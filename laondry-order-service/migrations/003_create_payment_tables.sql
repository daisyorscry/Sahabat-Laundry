-- Migration: Create payment tables for Midtrans integration
-- Created: 2025-01-05
-- Description: Creates tables for payment transactions, status logs, and webhook logs

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_order_id VARCHAR(100) NOT NULL UNIQUE,
    payment_method VARCHAR(50),
    payment_type VARCHAR(50),
    gross_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    fraud_status VARCHAR(30),
    snap_token TEXT,
    snap_redirect_url TEXT,
    va_number VARCHAR(50),
    biller_code VARCHAR(50),
    bill_key VARCHAR(50),
    expiry_time TIMESTAMP WITH TIME ZONE,
    settlement_time TIMESTAMP WITH TIME ZONE,
    transaction_time TIMESTAMP WITH TIME ZONE,
    request_payload JSONB,
    response_payload JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_order_id ON payment_transactions(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_deleted_at ON payment_transactions(deleted_at);

-- Payment Status Logs Table
CREATE TABLE IF NOT EXISTS payment_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    fraud_status VARCHAR(30),
    status_message TEXT,
    source VARCHAR(50) NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payment_status_logs
CREATE INDEX IF NOT EXISTS idx_payment_status_logs_payment_transaction_id ON payment_status_logs(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_logs_created_at ON payment_status_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_status_logs_deleted_at ON payment_status_logs(deleted_at);

-- Payment Webhook Logs Table
CREATE TABLE IF NOT EXISTS payment_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
    payment_order_id VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL,
    event_type VARCHAR(50),
    transaction_status VARCHAR(30),
    fraud_status VARCHAR(30),
    status_code VARCHAR(10),
    gross_amount VARCHAR(20),
    signature_key VARCHAR(255),
    signature_verified BOOLEAN DEFAULT FALSE,
    raw_payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payment_webhook_logs
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_payment_transaction_id ON payment_webhook_logs(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_payment_order_id ON payment_webhook_logs(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_created_at ON payment_webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_deleted_at ON payment_webhook_logs(deleted_at);

-- Add trigger to automatically update updated_at on payment_transactions
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Comments for documentation
COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions with complete Midtrans data';
COMMENT ON TABLE payment_status_logs IS 'Tracks all status changes for payment transactions';
COMMENT ON TABLE payment_webhook_logs IS 'Stores raw webhook notifications from Midtrans for audit trail';

COMMENT ON COLUMN payment_transactions.payment_order_id IS 'Unique Midtrans order_id (e.g., ORDER-123-PAY-1)';
COMMENT ON COLUMN payment_transactions.snap_token IS 'Midtrans Snap token for payment page';
COMMENT ON COLUMN payment_transactions.snap_redirect_url IS 'Midtrans Snap redirect URL';
COMMENT ON COLUMN payment_transactions.va_number IS 'Virtual Account number for bank transfer';
COMMENT ON COLUMN payment_transactions.biller_code IS 'Biller code for certain payment methods';
COMMENT ON COLUMN payment_transactions.bill_key IS 'Bill key for certain payment methods';
COMMENT ON COLUMN payment_transactions.request_payload IS 'Original snap token request data';
COMMENT ON COLUMN payment_transactions.response_payload IS 'Snap token response data';
COMMENT ON COLUMN payment_transactions.metadata IS 'Additional custom data';

COMMENT ON COLUMN payment_status_logs.source IS 'Source of status change: webhook, api_check, api_create, manual';
COMMENT ON COLUMN payment_status_logs.raw_data IS 'Full status data from source';

COMMENT ON COLUMN payment_webhook_logs.signature_verified IS 'Whether the webhook signature was verified';
COMMENT ON COLUMN payment_webhook_logs.raw_payload IS 'Complete webhook payload for debugging';
COMMENT ON COLUMN payment_webhook_logs.processing_error IS 'Error message if processing failed';
