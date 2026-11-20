# Deployment & Hosting

## Current deployment

Breeze's active deployment is on Render: the API, static web frontend, and managed PostgreSQL database. The repository records this in `../roadmap.md`; Render service settings are maintained in the dashboard because no `render.yaml` or deployment workflow is checked in.

- **API:** Render native Go runtime. Build with `CGO_ENABLED=0 go build -ldflags="-w -s" -o bin/api ./cmd/api`; start with `./bin/api`; health check `/health`.
- **Database:** Render PostgreSQL, connected through `DATABASE_URL`. The API pre-deploy command is `make migrate-deploy && go run ./cmd/seed`.
- **Web:** Render static site. `breeze.web/next.config.ts` sets `output: 'export'`; `npm run build` generates the `out/` directory. Confirm the Render dashboard publishes `out/`.
- **CI:** `.github/workflows/ci.yml` validates the API and web app; it does not deploy them.

`breeze.web/Dockerfile.web` is a development container, not the production web deployment: it uses Node 22, installs with `npm ci`, and runs `npm run dev`. See [the production checklist](production-checklist.md) for production environment and launch requirements.

---

## The Binary Advantage

The Go build produces a single self-contained binary with no runtime dependencies. This is the foundation of every portability and cost advantage in this stack.

```bash
# Cross-compile for Linux ARM64
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
  go build -ldflags="-w -s" -o bin/api ./cmd/api

# Result: a single ~10MB binary
# Copy it to any Linux server and run it — that's the entire deployment
```

---

## Example API Docker image (not used by the current Render deployment)

This is an optional reference only. The active API deployment uses Render's native Go runtime, and no API Dockerfile is checked in. If this example is revived, keep its Go image aligned with `breeze.api/go.mod`.

```dockerfile
# Stage 1 — build
FROM golang:1.27.2-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build \
      -ldflags="-w -s" \
      -o /budget-api \
      ./cmd/api

# Stage 2 — run (scratch = empty image, just the binary)
FROM scratch
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /budget-api /budget-api
EXPOSE 8080
ENTRYPOINT ["/budget-api"]
```

---

## Alternative hosting notes

Render is the active provider. Fly.io, Hetzner, self-hosted, and Pulumi sections below are unconfigured examples retained for future evaluation, not current deployment instructions. Provider prices and regions change; verify them before using these examples.

---

## Example: Fly.io (not configured)

```toml
# fly.toml
app            = "budget-api"
primary_region = "ord"  # Chicago — close to Neon us-east-2

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port       = 8080
  force_https         = true
  auto_stop_machines  = true   # scale to zero when idle
  auto_start_machines = true
  min_machines_running = 0     # zero cost at rest

[[vm]]
  memory = "256mb"
  cpus   = 1
```

---

## Render Setup (API on native Go runtime)

The API runs on Render's native Go runtime with managed Render PostgreSQL linked through `DATABASE_URL`. The pre-deploy command applies migrations and seeds reference data before the new API version starts.

| Setting            | Value                                                          |
| ------------------ | -------------------------------------------------------------- |
| Build Command      | `CGO_ENABLED=0 go build -ldflags="-w -s" -o bin/api ./cmd/api` |
| Pre-Deploy Command | `make migrate-deploy && go run ./cmd/seed`                     |
| Start Command      | `./bin/api`                                                    |
| Health Check Path  | `/health` (database ping; returns 503 if unavailable)          |

- `make migrate-deploy` downloads the Atlas Linux AMD64 binary to `bin/atlas` and applies migrations using `DATABASE_URL`.
- Pre-deploy runs once per deploy — a failed migration blocks the rollout instead of crash-looping the API.
- Reference data is seeded after migrations with `go run ./cmd/seed`; the seed script is idempotent.
- `atlas.hcl` resolves `url` from the `DATABASE_URL` env var, so `make migrate-deploy` needs no local `.env` file. Use the database's **internal** connection string.
- Local `make migrate` uses the locally installed Atlas binary and `.env`; `make migrate-deploy` uses `DATABASE_URL` from the environment and does not require a local `.env` file.

---

## Example: Hetzner VPS (not configured)

A future Hetzner setup would need host, systemd, nginx, and certificate configuration. The following snippets are examples, not a supported deployment.

**systemd service** — keeps the binary running, restarts on crash:

```ini
# /etc/systemd/system/budget-api.service
[Unit]
Description=Budget API
After=network.target

[Service]
ExecStart=/opt/budget-api/budget-api
EnvironmentFile=/opt/budget-api/.env
Restart=always
RestartSec=5
User=budget

[Install]
WantedBy=multi-user.target
```

**nginx** — TLS termination + static frontend serving:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Go API
    location /graphql {
        proxy_pass http://localhost:8080;
    }

    location /health {
        proxy_pass http://localhost:8080;
    }
}

server {
    listen 443 ssl;
    server_name app.yourdomain.com;

    # Frontend — just static files
    root /var/www/budget-app/dist;
    try_files $uri $uri/ /index.html;
}
```

**certbot** — free TLS, auto-renews:

```bash
certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
```

---

## Example: Self-Hosted Distribution (not configured)

A future self-hosted package might use a `docker-compose.yml` like this. It is not maintained or tested by this repository.

```yaml
services:
  app:
    image: ghcr.io/yourname/finance-planner:latest
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/finance
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      PORT: 8080
    ports:
      - "8080:8080"
    depends_on: [db]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: finance
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
# Example only: apply migrations and seed data separately before starting the API.
```

---

## CI and deployment

`.github/workflows/ci.yml` is the only checked-in workflow. It runs validation for API and web changes but does not deploy. Render deployment settings are managed in the Render dashboard.

---

## Example: Infrastructure as Code with Pulumi (not active)

No Pulumi or other infrastructure-as-code project is checked in. Current Render service settings are managed in the Render dashboard; the following is an unimplemented example.

A future Pulumi project could define infrastructure in `infra/main.go`, for example:

```go
pulumi.Run(func(ctx *pulumi.Context) error {
    // Neon serverless Postgres
    db, err := neon.NewProject(ctx, "budget-db", &neon.ProjectArgs{
        Name:      pulumi.String("budget"),
        RegionId:  pulumi.String("aws-us-east-2"),
        PgVersion: pulumi.Int(16),
    })

    // Fly.io app
    app, err := fly.NewApp(ctx, "budget-api", &fly.AppArgs{
        Name: pulumi.String("budget-api"),
    })

    // Wire DB URL to app as secret
    _, err = fly.NewSecret(ctx, "db-url", &fly.SecretArgs{
        App:   app.Name,
        Name:  pulumi.String("DATABASE_URL"),
        Value: db.ConnectionUri,
    })

    ctx.Export("dbUrl", db.ConnectionUri)
    ctx.Export("appUrl", app.AppUrl)
    return nil
})
```

Self-host Pulumi state in S3 to avoid Pulumi Cloud dependency:

```bash
pulumi login s3://your-bucket/pulumi-state
```

---

## Historical cost example (not a current estimate)

The figures below are an old Hetzner/Neon planning example, not Breeze's current Render costs. Check current provider billing and Plaid pricing before budgeting.

| Component                             | Cost          |
| ------------------------------------- | ------------- |
| Hetzner CAX11 (API + static frontend) | €4.51/month   |
| Neon free tier (Postgres)             | $0            |
| Let's Encrypt TLS                     | $0            |
| Cloudflare free CDN (optional)        | $0            |
| **Total**                             | **~$5/month** |

Plaid production tier adds ~$0.80/user/month — factor into subscription pricing.
