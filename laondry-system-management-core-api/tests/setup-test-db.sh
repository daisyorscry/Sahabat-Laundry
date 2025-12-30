#!/bin/bash

# Setup Testing Database Script
echo "Setting up testing database..."

# Database credentials from phpunit.xml
DB_HOST="127.0.0.1"
DB_PORT="5422"
DB_NAME="laondry_system_management_testing"
DB_USER="root"
DB_PASS="root"

# Try to create database (will fail if already exists, which is fine)
echo "Creating database $DB_NAME..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists (this is OK)"

echo "Running migrations on testing database..."
php artisan migrate:fresh --env=testing --force

echo ""
echo "✓ Testing database setup complete!"
echo ""
echo "You can now run tests with:"
echo "  php artisan test"
echo "  php artisan test --filter=ServicePriceTest"
echo "  php artisan test --filter=ServiceControllerTest"
