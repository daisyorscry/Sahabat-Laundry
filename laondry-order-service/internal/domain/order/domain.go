package order

import (
    "context"
    "log"
    "time"

    "laondry-order-service/internal/config"
    "laondry-order-service/internal/domain/order/handler/rest"
    "laondry-order-service/internal/domain/order/repository"
    "laondry-order-service/internal/domain/order/service"
    "laondry-order-service/internal/lock"
    "laondry-order-service/pkg/validator"

    "gorm.io/gorm"
    redis "github.com/redis/go-redis/v9"
)

type OrderDomain struct {
	Repository   repository.OrderRepository
	Service      service.OrderService
	QuoteService service.QuoteService
	Handler      *rest.OrderHandler
	QuoteHandler *rest.QuoteHandler
}

func NewOrderDomain(db *gorm.DB, validator *validator.Validator, cfg *config.Config) *OrderDomain {
    orderRepo := repository.NewOrderRepository(db)
    pricingRepo := repository.NewPricingRepository(db)

    // Try Redis locker if REDIS_ADDR set, fallback to memory locker.
    var locker lock.Locker
    if cfg != nil && cfg.Redis.Addr != "" {
        rdb := redis.NewClient(&redis.Options{
            Addr:     cfg.Redis.Addr,
            Password: cfg.Redis.Password,
            DB:       cfg.Redis.DB,
        })
        // Test Redis connection with ping
        ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
        defer cancel()
        if err := rdb.Ping(ctx).Err(); err != nil {
            log.Printf("[Lock] Redis connection failed: %v, using in-memory locker", err)
            locker = lock.NewMemoryLocker()
        } else {
            log.Printf("[Lock] Using Redis locker at %s", cfg.Redis.Addr)
            locker = lock.NewRedisLocker(rdb)
        }
    } else {
        log.Printf("[Lock] Using in-memory locker (no Redis configured)")
        locker = lock.NewMemoryLocker()
    }

    orderService := service.NewOrderService(orderRepo, db, locker)
    quoteService := service.NewQuoteService(pricingRepo, locker)
    orderHandler := rest.NewOrderHandler(orderService, validator)
    quoteHandler := rest.NewQuoteHandler(quoteService, validator)

    return &OrderDomain{
        Repository:   orderRepo,
        Service:      orderService,
        QuoteService: quoteService,
        Handler:      orderHandler,
        QuoteHandler: quoteHandler,
    }
}
