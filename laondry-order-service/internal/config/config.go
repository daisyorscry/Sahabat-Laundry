package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	App           AppConfig
	Database      DatabaseConfig
	Observability ObservabilityConfig
	Logging       LoggingConfig
	Redis         RedisConfig
	External      ExternalConfig
	Midtrans      MidtransConfig
}

type ExternalConfig struct {
	CoreAPIURL string
}

type MidtransConfig struct {
	ServerKey       string
	ClientKey       string
	IsProduction    bool
	EnabledPayments []string
}

type AppConfig struct {
	Name             string
	Environment      string
	Port             string
	Debug            bool
	ClusterEnabled   bool
	ClusterWorkers   int
	ClusterReusePort bool
	ClusterPrefork   bool
	// Worker process flags (set internally for prefork)
	IsWorker    bool
	WorkerIndex int
}

type DatabaseConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	SSLMode         string
	Timezone        string
	MaxIdleConns    int
	MaxOpenConns    int
	ConnMaxLifetime int
}

type ObservabilityConfig struct {
	NewRelicEnabled bool
	NewRelicLicense string
	NewRelicAppName string
}

type LoggingConfig struct {
	AccessLogPath       string
	AccessLogMaxSizeMB  int
	AccessLogMaxBackups int
	AccessLogMaxAgeDays int
	AccessLogCompress   bool
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

func LoadConfig() *Config {
	// Configure Viper to read from .env file (if present) and environment variables
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	// Defaults
	viper.SetDefault("APP_NAME", "Laondry Order Service")
	viper.SetDefault("APP_ENV", "development")
	viper.SetDefault("APP_PORT", "8080")
	viper.SetDefault("APP_DEBUG", true)
	viper.SetDefault("APP_CLUSTER_ENABLED", false)
	viper.SetDefault("APP_CLUSTER_WORKERS", 0)
	viper.SetDefault("APP_CLUSTER_REUSEPORT", true)
	viper.SetDefault("APP_CLUSTER_PREFORK", false)
	viper.SetDefault("APP_IS_WORKER", false)
	viper.SetDefault("APP_WORKER_INDEX", -1)

	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "5432")
	viper.SetDefault("DB_USER", "postgres")
	viper.SetDefault("DB_PASSWORD", "")
	viper.SetDefault("DB_NAME", "laondry_order_db")
	viper.SetDefault("DB_SSLMODE", "disable")
	viper.SetDefault("DB_TIMEZONE", "Asia/Jakarta")
	viper.SetDefault("DB_MAX_IDLE_CONNS", 10)
	viper.SetDefault("DB_MAX_OPEN_CONNS", 100)
	viper.SetDefault("DB_CONN_MAX_LIFETIME", 3600)

	viper.SetDefault("NEW_RELIC_ENABLED", true)
	viper.SetDefault("NEW_RELIC_LICENSE", "")
	viper.SetDefault("NEW_RELIC_APP_NAME", "")

	viper.SetDefault("ACCESS_LOG_PATH", "logs/access.log")
	viper.SetDefault("ACCESS_LOG_MAX_SIZE_MB", 10)
	viper.SetDefault("ACCESS_LOG_MAX_BACKUPS", 7)
	viper.SetDefault("ACCESS_LOG_MAX_AGE_DAYS", 14)
	viper.SetDefault("ACCESS_LOG_COMPRESS", true)

	viper.SetDefault("REDIS_ADDR", "")
	viper.SetDefault("REDIS_PASSWORD", "")
	viper.SetDefault("REDIS_DB", 0)

	viper.SetDefault("CORE_API_URL", "http://192.168.1.20:8000/api/v1")
	// Midtrans defaults (sandbox)
	viper.SetDefault("MIDTRANS_SERVER_KEY", "")
	viper.SetDefault("MIDTRANS_CLIENT_KEY", "")
	viper.SetDefault("MIDTRANS_IS_PRODUCTION", false)
	// Comma-separated list, e.g.: "gopay,qris,bca_va,bni_va,bri_va,credit_card"
	viper.SetDefault("MIDTRANS_ENABLED_PAYMENTS", "")

	if err := viper.ReadInConfig(); err != nil {
		log.Println("Info: .env not found or unreadable, relying on environment variables")
	}

	workerIdx := viper.GetInt("APP_WORKER_INDEX")
	isWorker := viper.GetBool("APP_IS_WORKER")

	return &Config{
		App: AppConfig{
			Name:             viper.GetString("APP_NAME"),
			Environment:      viper.GetString("APP_ENV"),
			Port:             viper.GetString("APP_PORT"),
			Debug:            viper.GetBool("APP_DEBUG"),
			ClusterEnabled:   viper.GetBool("APP_CLUSTER_ENABLED"),
			ClusterWorkers:   viper.GetInt("APP_CLUSTER_WORKERS"),
			ClusterReusePort: viper.GetBool("APP_CLUSTER_REUSEPORT"),
			ClusterPrefork:   viper.GetBool("APP_CLUSTER_PREFORK"),
			IsWorker:         isWorker || workerIdx >= 0,
			WorkerIndex:      workerIdx,
		},
		Database: DatabaseConfig{
			Host:            viper.GetString("DB_HOST"),
			Port:            viper.GetString("DB_PORT"),
			User:            viper.GetString("DB_USER"),
			Password:        viper.GetString("DB_PASSWORD"),
			Name:            viper.GetString("DB_NAME"),
			SSLMode:         viper.GetString("DB_SSLMODE"),
			Timezone:        viper.GetString("DB_TIMEZONE"),
			MaxIdleConns:    viper.GetInt("DB_MAX_IDLE_CONNS"),
			MaxOpenConns:    viper.GetInt("DB_MAX_OPEN_CONNS"),
			ConnMaxLifetime: viper.GetInt("DB_CONN_MAX_LIFETIME"),
		},
		Observability: ObservabilityConfig{
			NewRelicEnabled: viper.GetBool("NEW_RELIC_ENABLED"),
			NewRelicLicense: viper.GetString("NEW_RELIC_LICENSE"),
			NewRelicAppName: viper.GetString("NEW_RELIC_APP_NAME"),
		},
		Logging: LoggingConfig{
			AccessLogPath:       viper.GetString("ACCESS_LOG_PATH"),
			AccessLogMaxSizeMB:  viper.GetInt("ACCESS_LOG_MAX_SIZE_MB"),
			AccessLogMaxBackups: viper.GetInt("ACCESS_LOG_MAX_BACKUPS"),
			AccessLogMaxAgeDays: viper.GetInt("ACCESS_LOG_MAX_AGE_DAYS"),
			AccessLogCompress:   viper.GetBool("ACCESS_LOG_COMPRESS"),
		},
		Redis: RedisConfig{
			Addr:     viper.GetString("REDIS_ADDR"),
			Password: viper.GetString("REDIS_PASSWORD"),
			DB:       viper.GetInt("REDIS_DB"),
		},
		External: ExternalConfig{
			CoreAPIURL: viper.GetString("CORE_API_URL"),
		},
		Midtrans: MidtransConfig{
			ServerKey:       viper.GetString("MIDTRANS_SERVER_KEY"),
			ClientKey:       viper.GetString("MIDTRANS_CLIENT_KEY"),
			IsProduction:    viper.GetBool("MIDTRANS_IS_PRODUCTION"),
			EnabledPayments: parseCSV(viper.GetString("MIDTRANS_ENABLED_PAYMENTS")),
		},
	}
}

// parseCSV splits a comma-separated string into a slice, trimming spaces
// and skipping empty values.
func parseCSV(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := []string{}
	start := 0
	for i := 0; i <= len(s); i++ {
		if i == len(s) || s[i] == ',' {
			seg := s[start:i]
			// trim spaces
			for len(seg) > 0 && (seg[0] == ' ' || seg[0] == '\t') {
				seg = seg[1:]
			}
			for len(seg) > 0 && (seg[len(seg)-1] == ' ' || seg[len(seg)-1] == '\t') {
				seg = seg[:len(seg)-1]
			}
			if seg != "" {
				parts = append(parts, seg)
			}
			start = i + 1
		}
	}
	return parts
}
