package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"laondry-order-service/internal/domain/order/repository"
	"laondry-order-service/internal/lock"
	appErrors "laondry-order-service/pkg/errors"

	"github.com/google/uuid"
	"github.com/newrelic/go-agent/v3/newrelic"
	"gorm.io/gorm"
)

type quoteServiceImpl struct {
	pricingRepo repository.PricingRepository
	locker      lock.Locker
}

func NewQuoteService(pricingRepo repository.PricingRepository, locker lock.Locker) QuoteService {
	return &quoteServiceImpl{
		pricingRepo: pricingRepo,
		locker:      locker,
	}
}

func (s *quoteServiceImpl) withLock(ctx context.Context, key string, ttl time.Duration, fn func() error) error {
	if s.locker == nil {
		return fn()
	}
	unlock, ok, err := s.locker.TryLock(ctx, key, ttl)
	if err != nil {
		return appErrors.InternalServerError("Failed to acquire lock", err)
	}
	if !ok {
		return appErrors.BadRequest("Resource busy, try again", nil)
	}
	defer func() { _ = unlock() }()
	return fn()
}

func (s *quoteServiceImpl) CalculateQuote(ctx context.Context, req QuoteRequest) (*QuoteResult, error) {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("quote.CalculateQuote")
		defer seg.End()
		txn.AddAttribute("outlet_id", req.OutletID.String())
		txn.AddAttribute("items_count", len(req.Items))
	}

	log.Printf("[Quote] Calculating quote for outlet_id=%s, items=%d", req.OutletID.String(), len(req.Items))

	var result *QuoteResult
	lockKey := "quote:calculate:" + req.OutletID.String()
	err := s.withLock(ctx, lockKey, 10*time.Second, func() error {
		warnings := []string{}
		date := time.Now()
		if req.Date != nil && *req.Date != "" {
			parsedDate, err := time.Parse("2006-01-02", *req.Date)
			if err != nil {
				warnings = append(warnings, fmt.Sprintf("Invalid date format: %s, using today", *req.Date))
			} else {
				date = parsedDate
			}
		}

		items := make([]QuoteResultItem, 0, len(req.Items))
		var subtotal float64

	for idx, item := range req.Items {
		serviceID, err := uuid.Parse(item.ServiceID)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("Item %d: Invalid service_id: %s", idx+1, item.ServiceID))
			log.Printf("[Quote] Item %d: Invalid service_id: %s", idx+1, item.ServiceID)
			continue
		}

		// Fetch service from DB
		service, err := s.pricingRepo.FindServiceByID(ctx, serviceID)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				warnings = append(warnings, fmt.Sprintf("Item %d: Service not found: %s", idx+1, item.ServiceID))
				log.Printf("[Quote] Item %d: Service not found: %s", idx+1, item.ServiceID)
			} else {
				log.Printf("[Quote] Item %d: Error fetching service: %v", idx+1, err)
				return appErrors.InternalServerError("Failed to fetch service", err)
			}
			continue
		}

		// Fetch pricing
		unitPrice := service.BasePrice
		servicePrice, err := s.pricingRepo.FindServicePrice(ctx, serviceID, req.OutletID, req.MemberTier, date, item.IsExpress)
		if err == nil && servicePrice != nil {
			unitPrice = servicePrice.Price
			log.Printf("[Quote] Item %d: Found service price: %.2f", idx+1, unitPrice)
		} else {
			log.Printf("[Quote] Item %d: Using base price: %.2f (no service_price found)", idx+1, unitPrice)
		}

    // Calculate base total based on pricing model
    var baseTotal float64
    // Support both legacy (PER_KG, PER_ITEM) and new (weight, piece) values
    if service.PricingModel == "PER_KG" || service.PricingModel == "weight" {
        if item.WeightKg == nil || *item.WeightKg <= 0 {
            warnings = append(warnings, fmt.Sprintf("Item %d: Weight required for %s", idx+1, service.Code))
            continue
        }
        baseTotal = unitPrice * *item.WeightKg
    } else if service.PricingModel == "PER_ITEM" || service.PricingModel == "piece" {
        if item.Qty == nil || *item.Qty <= 0 {
            warnings = append(warnings, fmt.Sprintf("Item %d: Quantity required for %s", idx+1, service.Code))
            continue
        }
        baseTotal = unitPrice * float64(*item.Qty)
		} else {
			baseTotal = unitPrice
		}

		// Process addons
		addons := make([]QuoteResultAddon, 0, len(item.Addons))
		var addonsTotal float64

		for addonIdx, addonReq := range item.Addons {
			addonID, err := uuid.Parse(addonReq.AddonID)
			if err != nil {
				warnings = append(warnings, fmt.Sprintf("Item %d, Addon %d: Invalid addon_id: %s", idx+1, addonIdx+1, addonReq.AddonID))
				continue
			}

			addon, err := s.pricingRepo.FindAddonByID(ctx, addonID)
			if err != nil {
				if err == gorm.ErrRecordNotFound {
					warnings = append(warnings, fmt.Sprintf("Item %d, Addon %d: Addon not found: %s", idx+1, addonIdx+1, addonReq.AddonID))
				} else {
					log.Printf("[Quote] Item %d, Addon %d: Error fetching addon: %v", idx+1, addonIdx+1, err)
					return appErrors.InternalServerError("Failed to fetch addon", err)
				}
				continue
			}

			addonLineTotal := addon.Price * float64(addonReq.Qty)

			addons = append(addons, QuoteResultAddon{
				AddonID:   addon.ID.String(),
				AddonCode: addon.Code,
				AddonName: addon.Name,
				Qty:       addonReq.Qty,
				UnitPrice: addon.Price,
				LineTotal: addonLineTotal,
			})

			addonsTotal += addonLineTotal
		}

		lineTotal := baseTotal + addonsTotal

		items = append(items, QuoteResultItem{
			ServiceID:    service.ID.String(),
			ServiceCode:  service.Code,
			ServiceName:  service.Name,
			PricingModel: service.PricingModel,
			IsExpress:    item.IsExpress,
			Qty:          item.Qty,
			WeightKg:     item.WeightKg,
			UnitPrice:    unitPrice,
			BaseTotal:    baseTotal,
			Addons:       addons,
			AddonsTotal:  addonsTotal,
			LineTotal:    lineTotal,
		})

		subtotal += lineTotal
		log.Printf("[Quote] Item %d: %s (%.2f x %.2f = %.2f), addons: %.2f, total: %.2f",
			idx+1, service.Code, unitPrice, baseTotal/unitPrice, baseTotal, addonsTotal, lineTotal)
	}

		// TODO: Apply discount, tax, etc.
		grandTotal := subtotal

		log.Printf("[Quote] Quote calculated: subtotal=%.2f, grand_total=%.2f, items=%d, warnings=%d",
			subtotal, grandTotal, len(items), len(warnings))

		result = &QuoteResult{
			Meta: QuoteMeta{
				OutletID:   req.OutletID.String(),
				MemberTier: req.MemberTier,
				Date:       date.Format("2006-01-02"),
				Warnings:   warnings,
			},
			Items:      items,
			Subtotal:   subtotal,
			GrandTotal: grandTotal,
		}

		if txn := newrelic.FromContext(ctx); txn != nil {
			txn.AddAttribute("subtotal", subtotal)
			txn.AddAttribute("grand_total", grandTotal)
			txn.AddAttribute("warnings_count", len(warnings))
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}
