.PHONY: dev db db-stop clean check

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
