.PHONY: help run build test clean deps dev

help:
	@echo "Available commands:"
	@echo "  make run       - Run the application"
	@echo "  make dev       - Run with hot reload (requires air)"
	@echo "  make build     - Build the application"
	@echo "  make test      - Run tests"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make deps      - Download dependencies"

run:
	go run cmd/main.go

dev:
	air

build:
	go build -o bin/laondry-order-service cmd/main.go

test:
	go test -v ./...

clean:
	rm -rf bin/
	go clean

deps:
	go mod download
	go mod tidy
