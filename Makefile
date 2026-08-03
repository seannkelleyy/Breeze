.PHONY: dev db db-stop clean check ci ci-stop

dev:
	./scripts/dev.sh

check:
	./scripts/check.sh

db:
	docker compose up -d postgres

db-stop:
	docker compose down

clean:
	docker compose down -v

ci:
	docker compose -f compose.yaml -f compose.woodpecker.yaml up -d
	@echo ""
	@echo "PostgreSQL:  localhost:5432"
	@echo "Woodpecker:  http://localhost:8000"

ci-stop:
	docker compose -f compose.yaml -f compose.woodpecker.yaml down
