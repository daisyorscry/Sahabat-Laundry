.PHONY: help dev stop kill-all core-api order-service web mobile clean install
.PHONY: node-adb-install node-adb


help:
	@echo "Available commands:"
	@echo "  make dev           - Start all 4 projects in parallel"
	@echo "  make core-api      - Start core API only (Laravel)"
	@echo "  make order-service - Start order service only (Go)"
	@echo "  make web           - Start web app only (Next.js)"
	@echo "  make mobile        - Start mobile app only (Expo)"
	@echo "  make stop          - Stop all running services"
	@echo "  make kill-all      - Force kill all node/go/php processes"
	@echo "  make install       - Install all dependencies"
	@echo "  make clean         - Clean all build artifacts and node_modules"

dev:
	@echo "Starting all services..."
	@trap 'make stop' EXIT; \
	cd laondry-system-management-core-api && composer run dev & \
	cd laondry-order-service && make dev & \
	cd sahabat_laundry_mobile && flutter run & \
	wait

dev-core:
	@echo "Starting all services..."
	@trap 'make stop' EXIT; \
	cd laondry-system-management-core-api && composer run dev & \
	cd laondry-order-service && make dev & 
	wait

core-api:
	@echo "Starting Core API (Laravel)..."
	cd laondry-system-management-core-api && composer run dev

order-service:
	@echo "Starting Order Service (Go)..."
	cd laondry-order-service && make dev

web:
	@echo "Starting Web App (Next.js)..."
	cd laondry-system-management-web && npm run dev

mobile:
	@echo "Starting Mobile App (Expo)..."
	cd laondry-system-management-mobile && npm start

stop:
	@echo "Stopping all services..."
	@-pkill -f "vite"
	@-pkill -f "next dev"
	@-pkill -f "expo start"
	@-pkill -f "air"
	@-pkill -f "php artisan serve"
	@echo "All services stopped"

kill-all:
	@echo "Force killing all processes..."
	@-killall -9 node 2>/dev/null || true
	@-killall -9 air 2>/dev/null || true
	@-pkill -9 -f "php artisan" 2>/dev/null || true
	@echo "All processes killed"

install:
	@echo "Installing dependencies for all projects..."
	@echo "Installing Core API dependencies..."
	cd laondry-system-management-core-api && composer install
	@echo "Installing Order Service dependencies..."
	cd laondry-order-service && go mod download
	@echo "Installing Web dependencies..."
	cd laondry-system-management-web && npm install
	@echo "Installing Mobile dependencies..."
	cd laondry-system-management-mobile && npm install
	@echo "All dependencies installed!"

clean:
	@echo "Cleaning all projects..."
	@echo "Cleaning Core API..."
	cd laondry-system-management-core-api && rm -rf vendor
	@echo "Cleaning Order Service..."
	cd laondry-order-service && make clean
	@echo "Cleaning Web..."
	cd laondry-system-management-web && rm -rf node_modules .next
	@echo "Cleaning Mobile..."
	cd laondry-system-management-mobile && rm -rf node_modules
	@echo "All projects cleaned!"

adb-install:
	@echo "Installing adb-wifi global..."
	@command -v npm >/dev/null 2>&1 || { echo "npm tidak ditemukan"; exit 1; }
	npm install -g adb-wifi
	@echo "Install selesai. Jalankan 'make node-adb' untuk start QR pairing."


adb:
	@command -v adb-wifi-py >/dev/null 2>&1 || $(MAKE) py-install
	@echo "=> jalankan adb-wifi-py (scan QR di HP)"
	adb-wifi-py