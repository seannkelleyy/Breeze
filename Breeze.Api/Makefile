# Run tests
test:
	go test ./...

test-verbose:
	go test -v ./...

test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out
	
# Breeze API Makefile

ATLAS=atlas
SQLC=go run github.com/sqlc-dev/sqlc/cmd/sqlc@latest
GQLGEN=go run github.com/99designs/gqlgen@v0.17.89
MIGRATION_NAME?=init

.PHONY: gen migrate-diff migrate migrate-apply migrate-lint run tidy build db-up dev

# Generate all code (sqlc then gqlgen — order matters)
gen:
	$(SQLC) generate
	$(GQLGEN) generate

migrate-clean:
	export $(shell cat .env | xargs) && $(ATLAS) schema clean --env local

# Plan a new migration from schema changes
migrate-diff:
	export $(shell cat .env | xargs) && $(ATLAS) migrate diff $(MIGRATION_NAME) --env local

# Apply pending migrations to the database
migrate:
	export $(shell cat .env | xargs) && $(ATLAS) migrate apply --env local

migrate-apply: migrate

migrate-lint:
	export $(shell cat .env | xargs) && $(ATLAS) migrate lint --env local --latest 1


# Run the API
run:
	go run ./cmd/api/...

# Start Postgres from the shared compose file
db-up:
	docker compose -f ../compose.yaml up -d postgres

# Run River job runner
river:
	go run ./cmd/river/...

# Build the binary
build:
	go build -o bin/api ./cmd/api/...

# Tidy Go modules
tidy:
	go mod tidy

# Run all generators then tidy
setup: gen tidy

# ─── Code Quality ────────────────────────────────────────────────

# Format Go code (in-place)
fmt:
	go fmt ./...

# Lint Go code
lint:
	golangci-lint run ./... 

# Full API clean+check: format → tidy → gen → vet → lint → test → build
# This is what CI runs and what you run before committing.
check: fmt tidy gen
	@echo "==> [api] Vet"
	go vet ./...
	@echo "==> [api] Lint"
	golangci-lint run ./...
	@echo "==> [api] Test"
	go test ./... -count=1
	@echo "==> [api] Build"
	go build -o bin/api ./cmd/api/...

# Dev: start db, migrate, gen, and run the API
dev:
	@echo "🚀 Starting dev environment..."
	@if ! docker ps --format '{{.Names}}' | grep -q 'breeze-postgres'; then \
		echo "📦 Starting PostgreSQL..."; \
		docker compose -f ../compose.yaml up -d postgres; \
		sleep 2; \
	fi
	@echo "🗄️  Applying migrations..."
	export $(shell cat .env | xargs) && $(ATLAS) migrate apply --env local
	@echo "⚙️  Generating code..."
	$(SQLC) generate
	$(GQLGEN) generate
	@echo "🏃 Running API..."
	go run ./cmd/api/...
