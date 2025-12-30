package service

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/newrelic/go-agent/v3/newrelic"
	"gorm.io/gorm"

	"laondry-order-service/internal/domain/order/repository"
	"laondry-order-service/internal/entity"
	"laondry-order-service/internal/lock"
	mw "laondry-order-service/internal/middleware"
	appErrors "laondry-order-service/pkg/errors"
)

type orderService struct {
	orderRepo repository.OrderRepository
	db        *gorm.DB
	locker    lock.Locker
}

func NewOrderService(orderRepo repository.OrderRepository, db *gorm.DB, locker lock.Locker) OrderService {
	return &orderService{orderRepo: orderRepo, db: db, locker: locker}
}

func (s *orderService) withTx(ctx context.Context, fn func(r repository.OrderRepository) error) error {
	if s.db == nil {
		return fn(s.orderRepo)
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txRepo := s.orderRepo.WithDB(tx)
		return fn(txRepo)
	})
}

func (s *orderService) withLock(ctx context.Context, key string, ttl time.Duration, fn func() error) error {
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

var allowedTransitions = map[string]map[string]bool{
	"NEW": {
		"IN_PROGRESS": true,
		"CANCELED":    true,
	},
	"IN_PROGRESS": {
		"COMPLETED": true,
		"CANCELED":  true,
	},
	"COMPLETED": {},
	"CANCELED":  {},
}

func isAllowedTransition(from, to string) bool {
	if from == to {
		return false
	}
	if nexts, ok := allowedTransitions[from]; ok {
		return nexts[to]
	}
	return false
}

var finalStatuses = map[string]bool{
	"COMPLETED": true,
	"CANCELED":  true,
}

func (s *orderService) CreateOrder(ctx context.Context, req CreateOrderRequest) (*entity.Order, error) {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.CreateOrder")
		defer seg.End()
		txn.AddAttribute("customer_id", req.CustomerID.String())
		txn.AddAttribute("outlet_id", req.OutletID.String())
	}

	// SECURITY: Verify user exists in database and get member tier
	// Pricing should use member tier derived from authenticated user (core-api),
	// mirroring Mobile ServiceController logic. We still accept client-provided
	// member_tier but prefer the one from auth context if present.
	userRepo := repository.NewUserRepository(s.db)
	dbUser, err := userRepo.FindByID(ctx, req.CustomerID)
	if err != nil {
		return nil, appErrors.BadRequest("Customer not found", err)
	}

	// Resolve member tier code with the following priority:
	// 1. From JWT auth context (if available)
	// 2. From database user.member_tier_code (fallback for old JWT tokens)
	// 3. From request payload (backward compatibility)
	var selectedMemberTier *string

	// Try to get from JWT auth context first
	if user, ok := mw.GetUserFromContext(ctx); ok && user != nil && user.MemberTierCode != nil && *user.MemberTierCode != "" {
		selectedMemberTier = user.MemberTierCode
		log.Printf("[PRICING] Using member_tier from JWT: %s", *selectedMemberTier)
	} else if dbUser.MemberTier != nil && dbUser.MemberTier.Code != "" {
		// Fallback to database user.member_tier.code
		selectedMemberTier = &dbUser.MemberTier.Code
		log.Printf("[PRICING] Using member_tier from DB (fallback): %s", *selectedMemberTier)
	} else if req.MemberTier != nil && *req.MemberTier != "" {
		// Last fallback: request-provided member_tier
		selectedMemberTier = req.MemberTier
		log.Printf("[PRICING] Using member_tier from request: %s", *selectedMemberTier)
	} else {
		log.Printf("[PRICING] No member_tier available, will use default pricing")
	}

	// SECURITY: ALWAYS fetch all prices from database
	// Never trust any price data from request
	pricingRepo := repository.NewPricingRepository(s.db)
	currentDate := time.Now()
	maxEstHours := 0

	for i := range req.Items {
		item := &req.Items[i]

		// SECURITY: ALWAYS fetch service data from database
		service, err := pricingRepo.FindServiceByID(ctx, item.ServiceID)
		if err != nil {
			return nil, appErrors.BadRequest("Service not found: "+item.ServiceID.String(), err)
		}

		// Set service info
		item.ServiceCode = service.Code
		item.ServiceName = service.Name

		// Track promised time based on service estimated duration
		if service.EstDurationHours > maxEstHours {
			maxEstHours = service.EstDurationHours
		}

		// SECURITY: ALWAYS fetch price from database based on member tier
		// Prefer tier derived from auth context (selectedMemberTier)
		servicePrice, err := pricingRepo.FindServicePrice(ctx, item.ServiceID, req.OutletID, selectedMemberTier, currentDate, item.IsExpress)
		if err == nil && servicePrice != nil {
			item.UnitPrice = servicePrice.Price
		} else {
			// Log detailed info when falling back to base price
			memberTierStr := "nil"
			if selectedMemberTier != nil {
				memberTierStr = *selectedMemberTier
			}
			log.Printf("[WARN] Price lookup failed, using base_price | service_id=%s service_code=%s outlet_id=%s member_tier=%s is_express=%v date=%s base_price=%.2f error=%v",
				item.ServiceID.String(),
				service.Code,
				req.OutletID.String(),
				memberTierStr,
				item.IsExpress,
				currentDate.Format("2006-01-02"),
				service.BasePrice,
				err,
			)
			item.UnitPrice = service.BasePrice
		}

		// SECURITY: ALWAYS fetch addon prices from database
		for j := range item.Addons {
			addon := &item.Addons[j]
			addonEntity, err := pricingRepo.FindAddonByID(ctx, addon.AddonID)
			if err != nil {
				return nil, appErrors.BadRequest("Addon not found: "+addon.AddonID.String(), err)
			}

			addon.AddonCode = addonEntity.Code
			addon.AddonName = addonEntity.Name
			addon.UnitPrice = addonEntity.Price // ALWAYS use real price from database
		}
	}

	// Calculate totals using REAL prices from database
	subtotal, totalWeight, totalPiece, err := s.CalculateOrderTotal(req.Items)
	if err != nil {
		return nil, appErrors.BadRequest("Failed to calculate order total", err)
	}

	// Delivery fee should also be calculated, not from request
	req.DeliveryFee = 0 // TODO: Calculate based on distance/outlet policy

	tax := subtotal * 0.0
	grandTotal := subtotal - 0 + tax + req.DeliveryFee

	var created *entity.Order
	lockKey := "orders:create"
	err = s.withLock(ctx, lockKey, 10*time.Second, func() error {
		orderNo := s.generateOrderNumber()
		var promisedAtPtr *time.Time
		if maxEstHours > 0 {
			prom := time.Now().Add(time.Duration(maxEstHours) * time.Hour)
			promisedAtPtr = &prom
		}
		order := &entity.Order{
			CustomerID:      req.CustomerID,
			OutletID:        req.OutletID,
			Status:          "NEW",
			OrderNo:         orderNo,
			OrderType:       req.OrderType,
			TotalWeight:     totalWeight,
			TotalPiece:      totalPiece,
			Subtotal:        subtotal,
			Discount:        0,
			Tax:             tax,
			DeliveryFee:     req.DeliveryFee,
			GrandTotal:      grandTotal,
			Notes:           req.Notes,
			PickupAddress:   req.PickupAddress,
			DeliveryAddress: req.DeliveryAddress,
			PromisedAt:      promisedAtPtr,
			CreatedBy:       &req.CustomerID, // Set created_by to customer_id
			UpdatedBy:       &req.CustomerID, // Set updated_by to customer_id
		}

		if req.RequestedPickupAt != nil {
			parsedTime, err := time.Parse(time.RFC3339, *req.RequestedPickupAt)
			if err != nil {
				return appErrors.BadRequest("Invalid requested_pickup_at format", err)
			}
			order.RequestedPickupAt = &parsedTime
		}

		var items []entity.OrderItem
		for _, itemReq := range req.Items {
			lineTotal := itemReq.UnitPrice
			if itemReq.WeightKg != nil {
				lineTotal = itemReq.UnitPrice * (*itemReq.WeightKg)
			} else if itemReq.Qty != nil {
				lineTotal = itemReq.UnitPrice * float64(*itemReq.Qty)
			}

			item := entity.OrderItem{
				ServiceID:   itemReq.ServiceID,
				ServiceCode: itemReq.ServiceCode,
				ServiceName: itemReq.ServiceName,
				WeightKg:    itemReq.WeightKg,
				Qty:         itemReq.Qty,
				UnitPrice:   itemReq.UnitPrice,
				LineTotal:   lineTotal,
			}

			var addons []entity.OrderItemAddon
			for _, addonReq := range itemReq.Addons {
				addon := entity.OrderItemAddon{
					AddonID:   addonReq.AddonID,
					AddonCode: addonReq.AddonCode,
					AddonName: addonReq.AddonName,
					Qty:       addonReq.Qty,
					UnitPrice: addonReq.UnitPrice,
					LineTotal: addonReq.UnitPrice * float64(addonReq.Qty),
				}
				addons = append(addons, addon)
			}

			item.Addons = addons
			items = append(items, item)
		}
		order.Items = items

		return s.withTx(ctx, func(r repository.OrderRepository) error {
			if err := r.Create(ctx, order); err != nil {
				return err
			}

			// Create initial status log entry for NEW
			initLog := &entity.OrderStatusLog{
				OrderID:    order.ID,
				FromStatus: nil,
				ToStatus:   order.Status,
			}
			if err := r.CreateStatusLog(ctx, initLog); err != nil {
				return err
			}

			// promised_at already set before Create (if any)
			o, err := r.FindByID(ctx, order.ID)
			if err != nil {
				return err
			}
			created = o
			if txn := newrelic.FromContext(ctx); txn != nil {
				txn.AddAttribute("order_id", created.ID.String())
				txn.AddAttribute("order_no", created.OrderNo)
			}
			return nil
		})
	})
	if err != nil {
		return nil, err
	}
	return created, nil
}

func (s *orderService) GetOrderByID(ctx context.Context, id uuid.UUID) (*entity.Order, error) {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.GetOrderByID")
		defer seg.End()
		txn.AddAttribute("order_id", id.String())
	}
	order, err := s.orderRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return order, nil
}

func (s *orderService) GetOrderByOrderNo(ctx context.Context, orderNo string) (*entity.Order, error) {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.GetOrderByOrderNo")
		defer seg.End()
		txn.AddAttribute("order_no", orderNo)
	}
	order, err := s.orderRepo.FindByOrderNo(ctx, orderNo)
	if err != nil {
		return nil, err
	}
	return order, nil
}

func (s *orderService) GetOrders(ctx context.Context, filters repository.OrderFilters) ([]entity.Order, int64, error) {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.GetOrders")
		defer seg.End()
		if filters.CustomerID != nil {
			txn.AddAttribute("customer_id", filters.CustomerID.String())
		}
		if filters.OutletID != nil {
			txn.AddAttribute("outlet_id", filters.OutletID.String())
		}
		if filters.Status != nil {
			txn.AddAttribute("status", *filters.Status)
		}
		if filters.OrderType != nil {
			txn.AddAttribute("order_type", *filters.OrderType)
		}
		txn.AddAttribute("page", filters.Page)
		txn.AddAttribute("limit", filters.Limit)
	}
	orders, total, err := s.orderRepo.FindAll(ctx, filters)
	if err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (s *orderService) UpdateOrder(ctx context.Context, id uuid.UUID, req UpdateOrderRequest) (*entity.Order, error) {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.UpdateOrder")
		defer seg.End()
		txn.AddAttribute("order_id", id.String())
	}
	lockKey := "order:" + id.String()
	var updated *entity.Order
	err := s.withLock(ctx, lockKey, 10*time.Second, func() error {
		return s.withTx(ctx, func(r repository.OrderRepository) error {
			order, err := r.FindByID(ctx, id)
			if err != nil {
				return err
			}
			if finalStatuses[order.Status] {
				return appErrors.BadRequest("Cannot modify a finalized order", nil)
			}

			if req.OrderType != nil {
				order.OrderType = *req.OrderType
			}

			if req.PickupAddress != nil {
				order.PickupAddress = req.PickupAddress
			}

			if req.DeliveryAddress != nil {
				order.DeliveryAddress = req.DeliveryAddress
			}

			if req.DeliveryFee != nil {
				if *req.DeliveryFee < 0 {
					return appErrors.BadRequest("Delivery fee must be >= 0", nil)
				}
				order.DeliveryFee = *req.DeliveryFee
			}

			if req.Notes != nil {
				order.Notes = req.Notes
			}

			if req.RequestedPickupAt != nil {
				parsedTime, err := time.Parse(time.RFC3339, *req.RequestedPickupAt)
				if err != nil {
					return appErrors.BadRequest("Invalid requested_pickup_at format", err)
				}
				order.RequestedPickupAt = &parsedTime
			}

			if len(req.Items) > 0 {
				subtotal, totalWeight, totalPiece, err := s.CalculateOrderTotal(req.Items)
				if err != nil {
					return appErrors.BadRequest("Failed to calculate order total", err)
				}

				order.Subtotal = subtotal
				order.TotalWeight = totalWeight
				order.TotalPiece = totalPiece
				order.GrandTotal = subtotal - order.Discount + order.Tax + order.DeliveryFee

				// rebuild items to be persisted by repository update
				var items []entity.OrderItem
				// recompute promised_at based on services' est duration (if DB available)
				var pricingRepo repository.PricingRepository
				if s.db != nil {
					pricingRepo = repository.NewPricingRepository(s.db)
				}
				maxEstHours := 0
				for _, itemReq := range req.Items {
					lineTotal := itemReq.UnitPrice
					if itemReq.WeightKg != nil {
						lineTotal = itemReq.UnitPrice * (*itemReq.WeightKg)
					} else if itemReq.Qty != nil {
						lineTotal = itemReq.UnitPrice * float64(*itemReq.Qty)
					}

					item := entity.OrderItem{
						OrderID:     order.ID,
						ServiceID:   itemReq.ServiceID,
						ServiceCode: itemReq.ServiceCode,
						ServiceName: itemReq.ServiceName,
						WeightKg:    itemReq.WeightKg,
						Qty:         itemReq.Qty,
						UnitPrice:   itemReq.UnitPrice,
						LineTotal:   lineTotal,
					}

					var addons []entity.OrderItemAddon
					for _, addonReq := range itemReq.Addons {
						addons = append(addons, entity.OrderItemAddon{
							AddonID:   addonReq.AddonID,
							AddonCode: addonReq.AddonCode,
							AddonName: addonReq.AddonName,
							Qty:       addonReq.Qty,
							UnitPrice: addonReq.UnitPrice,
							LineTotal: addonReq.UnitPrice * float64(addonReq.Qty),
						})
					}
					item.Addons = addons
					items = append(items, item)

					// fetch service to read EstDurationHours when repo available
					if pricingRepo != nil {
						svcEnt, err := pricingRepo.FindServiceByID(ctx, itemReq.ServiceID)
						if err == nil && svcEnt != nil && svcEnt.EstDurationHours > maxEstHours {
							maxEstHours = svcEnt.EstDurationHours
						}
					}
				}
				order.Items = items

				if maxEstHours > 0 {
					prom := time.Now().Add(time.Duration(maxEstHours) * time.Hour)
					order.PromisedAt = &prom
				}
			}

			if err := r.Update(ctx, order); err != nil {
				return err
			}
			o, err := r.FindByID(ctx, id)
			if err != nil {
				return err
			}
			updated = o
			return nil
		})
	})
	if err != nil {
		return nil, err
	}
	return updated, nil
}

func (s *orderService) DeleteOrder(ctx context.Context, id uuid.UUID) error {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.DeleteOrder")
		defer seg.End()
		txn.AddAttribute("order_id", id.String())
	}
	lockKey := "order:" + id.String()
	return s.withLock(ctx, lockKey, 10*time.Second, func() error {
		return s.withTx(ctx, func(r repository.OrderRepository) error {
			if _, err := r.FindByID(ctx, id); err != nil {
				return err
			}
			if err := r.Delete(ctx, id); err != nil {
				return err
			}
			return nil
		})
	})
}

func (s *orderService) UpdateOrderStatus(ctx context.Context, id uuid.UUID, req UpdateStatusRequest) error {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.UpdateOrderStatus")
		defer seg.End()
		txn.AddAttribute("order_id", id.String())
		txn.AddAttribute("to_status", req.Status)
	}
	lockKey := "order:" + id.String()
	return s.withLock(ctx, lockKey, 10*time.Second, func() error {
		return s.withTx(ctx, func(r repository.OrderRepository) error {
			order, err := r.FindByID(ctx, id)
			if err != nil {
				return err
			}
			if order.Status == req.Status {
				return appErrors.BadRequest("Order already in "+req.Status+" status", nil)
			}
			if !isAllowedTransition(order.Status, req.Status) {
				return appErrors.BadRequest("Invalid status transition from "+order.Status+" to "+req.Status, nil)
			}
			if err := r.UpdateStatus(ctx, id, req.Status); err != nil {
				return err
			}
			// persist status log
			logEntry := &entity.OrderStatusLog{
				OrderID:    id,
				FromStatus: &order.Status,
				ToStatus:   req.Status,
				ChangedBy:  req.ChangedBy,
				Note:       req.Note,
			}
			if err := r.CreateStatusLog(ctx, logEntry); err != nil {
				return err
			}
			if txn := newrelic.FromContext(ctx); txn != nil {
				txn.AddAttribute("from_status", order.Status)
			}
			return nil
		})
	})
}

func (s *orderService) CancelOrder(ctx context.Context, id uuid.UUID, canceledBy *uuid.UUID, reason *string) error {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.CancelOrder")
		defer seg.End()
		txn.AddAttribute("order_id", id.String())
	}

	req := UpdateStatusRequest{
		Status:    "CANCELED",
		ChangedBy: canceledBy,
		Note:      reason,
	}

	return s.UpdateOrderStatus(ctx, id, req)
}

func (s *orderService) GetOrderStatusLogs(ctx context.Context, id uuid.UUID, page, limit int, sortOrder string) ([]entity.OrderStatusLog, int64, error) {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("orders.ListStatusLogs")
		defer seg.End()
		txn.AddAttribute("order_id", id.String())
		txn.AddAttribute("page", page)
		txn.AddAttribute("limit", limit)
		txn.AddAttribute("sort_order", sortOrder)
	}
	// ensure order exists
	if _, err := s.orderRepo.FindByID(ctx, id); err != nil {
		return nil, 0, err
	}
	logs, total, err := s.orderRepo.ListStatusLogs(ctx, id, page, limit, sortOrder)
	if err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}

func (s *orderService) CalculateOrderTotal(items []OrderItemRequest) (float64, float64, int, error) {
	var subtotal float64
	var totalWeight float64
	var totalPiece int

	for _, item := range items {
		lineTotal := item.UnitPrice

		if item.WeightKg != nil {
			if *item.WeightKg <= 0 {
				return 0, 0, 0, appErrors.BadRequest("Weight must be greater than 0", nil)
			}
			lineTotal = item.UnitPrice * (*item.WeightKg)
			totalWeight += *item.WeightKg
		} else if item.Qty != nil {
			if *item.Qty <= 0 {
				return 0, 0, 0, appErrors.BadRequest("Quantity must be greater than 0", nil)
			}
			lineTotal = item.UnitPrice * float64(*item.Qty)
			totalPiece += *item.Qty
		} else {
			return 0, 0, 0, appErrors.BadRequest("Either weight_kg or qty must be provided", nil)
		}

		subtotal += lineTotal

		for _, addon := range item.Addons {
			if addon.Qty <= 0 {
				return 0, 0, 0, appErrors.BadRequest("Addon quantity must be greater than 0", nil)
			}
			addonTotal := addon.UnitPrice * float64(addon.Qty)
			subtotal += addonTotal
		}
	}

	return subtotal, totalWeight, totalPiece, nil
}

func (s *orderService) generateOrderNumber() string {
	now := time.Now()
	// add a short UUID fragment to reduce collision chance
	uid := uuid.New().String()
	frag := uid[:8]
	return "ORD-" + now.Format("20060102") + "-" + now.Format("150405") + "-" + frag
}
