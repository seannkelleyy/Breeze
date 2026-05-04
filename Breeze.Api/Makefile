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

.PHONY: gen migrate-diff migrate migrate-apply migrate-lint run tidy build db-up

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

# Lint Go code
lint:
	golangci-lint run ./... 

# Format Go code
fmt:
	go fmt ./...

clean: lint fmt
