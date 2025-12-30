package service

import (
	"context"

	"github.com/google/uuid"
)

type QuoteService interface {
	CalculateQuote(ctx context.Context, req QuoteRequest) (*QuoteResult, error)
}

type QuoteRequest struct {
	OutletID   uuid.UUID     `json:"outlet_id" validate:"required,uuid"`
	MemberTier *string       `json:"member_tier"`
	Date       *string       `json:"date"` // YYYY-MM-DD
	Items      []QuoteItem   `json:"items" validate:"required,min=1,dive"`
}

type QuoteItem struct {
	ServiceID string            `json:"service_id" validate:"required"`
	Qty       *int              `json:"qty"`
	WeightKg  *float64          `json:"weight_kg"`
	IsExpress bool              `json:"is_express"`
	Addons    []QuoteItemAddon  `json:"addons"`
}

type QuoteItemAddon struct {
	AddonID string `json:"addon_id" validate:"required"`
	Qty     int    `json:"qty" validate:"required,gte=1"`
}

type QuoteResult struct {
	Meta     QuoteMeta          `json:"meta"`
	Items    []QuoteResultItem  `json:"items"`
	Subtotal float64            `json:"subtotal"`
	GrandTotal float64          `json:"grand_total"`
}

type QuoteMeta struct {
	OutletID   string   `json:"outlet_id"`
	MemberTier *string  `json:"member_tier"`
	Date       string   `json:"date"`
	Warnings   []string `json:"warnings"`
}

type QuoteResultItem struct {
	ServiceID    string                `json:"service_id"`
	ServiceCode  string                `json:"service_code"`
	ServiceName  string                `json:"service_name"`
	PricingModel string                `json:"pricing_model"`
	IsExpress    bool                  `json:"is_express"`
	Qty          *int                  `json:"qty"`
	WeightKg     *float64              `json:"weight_kg"`
	UnitPrice    float64               `json:"unit_price"`
	BaseTotal    float64               `json:"base_total"`
	Addons       []QuoteResultAddon    `json:"addons"`
	AddonsTotal  float64               `json:"addons_total"`
	LineTotal    float64               `json:"line_total"`
}

type QuoteResultAddon struct {
	AddonID   string  `json:"addon_id"`
	AddonCode string  `json:"addon_code"`
	AddonName string  `json:"addon_name"`
	Qty       int     `json:"qty"`
	UnitPrice float64 `json:"unit_price"`
	LineTotal float64 `json:"line_total"`
}
