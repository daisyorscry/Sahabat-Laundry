package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/newrelic/go-agent/v3/newrelic"
	"gopkg.in/natefinch/lumberjack.v2"

	"laondry-order-service/internal/config"
	"laondry-order-service/internal/database"
	"laondry-order-service/internal/domain/order"
	mw "laondry-order-service/internal/middleware"
	"laondry-order-service/internal/routes"
	"laondry-order-service/pkg/validator"
)

func main() {
	cfg := config.LoadConfig()

	log.Printf("Starting %s in %s mode", cfg.App.Name, cfg.App.Environment)

	// Set core API URL for auth middleware
	mw.SetCoreAPIURL(cfg.External.CoreAPIURL)

	db, err := database.NewPostgresConnection(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get database instance: %v", err)
	}
	defer sqlDB.Close()

	validatorInstance := validator.NewValidator()

	orderDomain := order.NewOrderDomain(db, validatorInstance, cfg)

	router := routes.NewRouter(cfg, db, validatorInstance, orderDomain)
	handler := router.Setup()

	// New Relic setup (optional via env)
	var nrApp *newrelic.Application
	if cfg.Observability.NewRelicEnabled {
		license := cfg.Observability.NewRelicLicense
		appName := cfg.Observability.NewRelicAppName
		if appName == "" {
			appName = cfg.App.Name
		}
		if license != "" {
			var err error
			nrApp, err = newrelic.NewApplication(
				newrelic.ConfigAppName(appName),
				newrelic.ConfigLicense(license),
				newrelic.ConfigDistributedTracerEnabled(true),
			)
			if err != nil {
				log.Printf("New Relic init failed: %v", err)
			} else {
				log.Printf("New Relic enabled for app %s", appName)
			}
		}
	}
	// Wrap handler with New Relic middleware if initialized
	handler = mw.NewRelic(nrApp)(handler)

	// Access log to rotating file (for Promtail)
	if cfg.Logging.AccessLogPath != "" {
		// ensure dir exists
		if err := os.MkdirAll(filepath.Dir(cfg.Logging.AccessLogPath), 0o755); err != nil {
			log.Printf("failed to create log dir: %v", err)
		}
		accessWriter := &lumberjack.Logger{
			Filename:   cfg.Logging.AccessLogPath,
			MaxSize:    cfg.Logging.AccessLogMaxSizeMB,
			MaxBackups: cfg.Logging.AccessLogMaxBackups,
			MaxAge:     cfg.Logging.AccessLogMaxAgeDays,
			Compress:   cfg.Logging.AccessLogCompress,
		}
		handler = mw.AccessLog(accessWriter)(handler)
		log.Printf("Access log -> %s", cfg.Logging.AccessLogPath)
	}

	// Prefork mode: spawn N worker processes that listen on the same port using SO_REUSEPORT
	if cfg.App.ClusterEnabled && cfg.App.ClusterPrefork && !cfg.App.IsWorker {
		workers := cfg.App.ClusterWorkers
		if workers <= 0 {
			workers = runtime.NumCPU()
		}
		log.Printf("Prefork mode enabled: starting %d workers on :%s", workers, cfg.App.Port)

		// Spawn workers
		procs := make([]*exec.Cmd, 0, workers)
		for i := 0; i < workers; i++ {
			cmd := exec.Command(os.Args[0])
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			cmd.Env = append(os.Environ(),
				"APP_IS_WORKER=true",
				"APP_WORKER_INDEX="+strconv.Itoa(i),
				"APP_CLUSTER_ENABLED=true",
			)
			if err := cmd.Start(); err != nil {
				log.Fatalf("failed to start worker %d: %v", i, err)
			}
			log.Printf("[master] started worker %d pid %d", i, cmd.Process.Pid)
			procs = append(procs, cmd)
		}

		// Wait for termination signal
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Master shutting down, signaling workers...")
		for i, p := range procs {
			if p.Process == nil {
				continue
			}
			_ = p.Process.Signal(syscall.SIGTERM)
			log.Printf("[master] signaled worker %d pid %d", i, p.Process.Pid)
		}
		// Optionally wait workers to exit
		for i, p := range procs {
			_ = p.Wait()
			log.Printf("[master] worker %d exited", i)
		}
		log.Println("Master exited gracefully")
		return
	}

	// If this is a worker process (prefork), run a single server bound with REUSEPORT
	if cfg.App.ClusterEnabled && cfg.App.IsWorker {
		runWorkerReusePort(handler, cfg)
		return
	}

	// Cluster mode: spin up N workers in-process using SO_REUSEPORT (optional)
	if cfg.App.ClusterEnabled {
		workers := cfg.App.ClusterWorkers
		if workers <= 0 {
			workers = runtime.NumCPU()
		}
		log.Printf("Cluster mode enabled: %d workers on :%s", workers, cfg.App.Port)

		var servers []*http.Server
		var listeners []net.Listener
		servers = make([]*http.Server, 0, workers)
		listeners = make([]net.Listener, 0, workers)

		// Prepare listeners and servers
		for i := 0; i < workers; i++ {
			ln, lerr := listenWithOptionalReusePort(cfg.App.ClusterReusePort, "0.0.0.0:"+cfg.App.Port)
			if lerr != nil {
				log.Printf("[worker %d] reuseport listen error: %v", i, lerr)
				// Fallback to single server if first worker fails to bind
				if i == 0 {
					log.Printf("Falling back to single-worker mode on :%s", cfg.App.Port)
					startSingleServer(handler, cfg)
					return
				}
				break
			}

			srv := &http.Server{
				Handler:      handler,
				ReadTimeout:  15 * time.Second,
				WriteTimeout: 15 * time.Second,
				IdleTimeout:  60 * time.Second,
			}

			servers = append(servers, srv)
			listeners = append(listeners, ln)
		}

		// Start all workers
		var wg sync.WaitGroup
		wg.Add(len(servers))
		for i := range servers {
			i := i
			go func() {
				defer wg.Done()
				log.Printf("[worker %d pid %d] listening on 0.0.0.0:%s", i, os.Getpid(), cfg.App.Port)
				if err := servers[i].Serve(listeners[i]); err != nil && err != http.ErrServerClosed {
					log.Printf("[worker %d] server error: %v", i, err)
				}
			}()
		}

		// Graceful shutdown
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Shutting down cluster...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		for i, srv := range servers {
			if err := srv.Shutdown(ctx); err != nil {
				log.Printf("[worker %d] forced shutdown: %v", i, err)
			}
		}
		wg.Wait()
		log.Println("Cluster exited gracefully")
		return
	}

	// Single worker mode (default)
	startSingleServer(handler, cfg)
}

// startSingleServer starts a single http.Server with ListenAndServe and graceful shutdown.
func startSingleServer(handler http.Handler, cfg *config.Config) {
	server := &http.Server{
		Addr:         "0.0.0.0:" + cfg.App.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server is running on 0.0.0.0:%s", cfg.App.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited gracefully")
}

// listenWithOptionalReusePort creates a listener on addr. If reusePort is true,
// it enables SO_REUSEADDR and SO_REUSEPORT (best-effort). If enabling fails,
// it falls back to a standard Listen.
func listenWithOptionalReusePort(reusePort bool, addr string) (net.Listener, error) {
	if !reusePort {
		return net.Listen("tcp", addr)
	}
	lc := net.ListenConfig{
		Control: func(network, address string, c syscall.RawConn) error {
			var ctrlErr error
			if err := c.Control(func(fd uintptr) {
				// Best-effort enable; ignore errors for SO_REUSEPORT on platforms without support
				_ = syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1)
				_ = syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_REUSEPORT, 1)
			}); err != nil {
				return err
			}
			return ctrlErr
		},
	}
	return lc.Listen(context.Background(), "tcp", addr)
}

// runWorkerReusePort starts a worker server using SO_REUSEPORT listener.
func runWorkerReusePort(handler http.Handler, cfg *config.Config) {
	ln, err := listenWithOptionalReusePort(cfg.App.ClusterReusePort, "0.0.0.0:"+cfg.App.Port)
	if err != nil {
		log.Fatalf("worker failed to bind :%s: %v", cfg.App.Port, err)
	}
	srv := &http.Server{
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	go func() {
		log.Printf("[worker pid %d] listening on 0.0.0.0:%s", os.Getpid(), cfg.App.Port)
		if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
			log.Fatalf("worker server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Printf("[worker pid %d] shutting down...", os.Getpid())
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Printf("[worker pid %d] exited", os.Getpid())
}
