package payment

import (
	"context"
	"log"
	"time"

	"laondry-order-service/internal/config"
	phandler "laondry-order-service/internal/domain/payment/handler/rest"
	prepo "laondry-order-service/internal/domain/payment/repository"
	pservice "laondry-order-service/internal/domain/payment/service"
	"laondry-order-service/internal/lock"
	"laondry-order-service/pkg/validator"

	redis "github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type PaymentDomain struct {
	Repository prepo.PaymentRepository
	Service    pservice.MidtransService
	Handler    *phandler.MidtransHandler
}

func NewPaymentDomain(cfg *config.Config, v *validator.Validator, db *gorm.DB) *PaymentDomain {
	repo := prepo.NewPaymentRepository(db)

	// Try Redis locker if REDIS_ADDR set, fallback to memory locker
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
			log.Printf("[Payment Lock] Redis connection failed: %v, using in-memory locker", err)
			locker = lock.NewMemoryLocker()
		} else {
			log.Printf("[Payment Lock] Using Redis locker at %s", cfg.Redis.Addr)
			locker = lock.NewRedisLocker(rdb)
		}
	} else {
		log.Printf("[Payment Lock] Using in-memory locker (no Redis configured)")
		locker = lock.NewMemoryLocker()
	}

    svc := pservice.NewMidtransService(cfg, repo, db, locker)
    h := phandler.NewMidtransHandler(svc, v, db)

	return &PaymentDomain{
		Repository: repo,
		Service:    svc,
		Handler:    h,
	}
}
