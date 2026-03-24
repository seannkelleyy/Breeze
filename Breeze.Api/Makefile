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
SQLC=sqlc
GQLGEN=go run github.com/99designs/gqlgen

.PHONY: gen migrate-diff migrate run tidy build

# Generate all code (sqlc then gqlgen — order matters)
gen:
	$(SQLC) generate
	$(GQLGEN) generate

migrate-clean:
	export $(shell cat .env | xargs) && $(ATLAS) schema clean --env local

# Plan a new migration from schema changes
migrate-diff:
	export $(shell cat .env | xargs) && $(ATLAS) migrate diff --env local

# Apply pending migrations to the database
migrate:
	export $(shell cat .env | xargs) && $(ATLAS) migrate apply --env local


# Run the API
run:
	go run ./cmd/api/...

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
