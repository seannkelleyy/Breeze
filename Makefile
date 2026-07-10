.PHONY: dev api web db db-stop clean

db:
	docker compose up -d postgres

db-stop:
	docker compose down

api:
	cd Breeze.Api && make dev

web:
	cd Breeze.Web && npm run dev

dev: db api

clean:
	docker compose down -v
