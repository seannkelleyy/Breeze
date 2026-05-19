# Breeze

Breeze is a personal finance planner with:

- Go API (gqlgen + sqlc + Atlas + PostgreSQL)
- Next.js web app

## Monorepo Structure

- `breeze.api/` - Go API
- `breeze.web/` - Next.js frontend

## API Quick Start

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Configure environment:

```bash
cd breeze.api
cp .env.example .env
```

3. Generate the initial migration and code:

```bash
make migrate-diff MIGRATION_NAME=initial_schema
make migrate
make gen
```

4. Run the API:

```bash
make run
```

API endpoints:

- `GET /health` - health check
- `GET /graphql` - GraphQL playground
- `POST /query` - GraphQL endpoint

## Web Quick Start

```bash
cd breeze.web
npm install
npm run dev
```

## Useful API Commands

```bash
cd breeze.api
make test
make build
make migrate-diff MIGRATION_NAME=<name>
make migrate
make gen
```

## Project Docs

Detailed API architecture and workflow docs live in `.github/docs/api/go/`.

Future Features:
* Transaction scraping from accounts
* Net worth that tracks values for home and vehicles
* Ability to see change in spending over time
* Excess carries to next month on certain categories
* Sinking fund tracker
* Add normal expense (i.e. mortgage) and special (i.e. trip back home)
* Save monthly spending (Mortgage, subscriptions, utilities etc.)
* Estimate utility payments based on previous months
* Ability to choose what day payments are made
* Account connection using Plaid
* Stripe for payment
* Split expenses into multiple categories
* Support different types of budget strategies 
* “Create a budget” feature that allows you to curate a budget and you can answer questions about this months potential spending and use AI to curate a better budget to start. 
* Allow users to add tags to their categories to follow certain budget, like the 50/30/20.
* Recurring charge checker

History of Tech Stack
Build 1:
* HTML, CSS, React
* .NET C#
* SQL database
* Auth0

Build 2:
* HTML, CSS, React (ShadCN, Tailwindcss) 
* Clerk for Auth
* .NET C#  with plans to switch to graphql later on
* PostGres database

Build 3:
* Next.js (ShadCN, Tailwindcss)
* Clerk for Auth
* Go API with plans to switch to graphql later on
* PostGres database