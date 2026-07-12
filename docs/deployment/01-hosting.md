# 01 — Deployment & Hosting

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

## Dockerfile — Scratch Base (~15MB)

```dockerfile
# Stage 1 — build
FROM golang:1.23-alpine AS build
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

## Hosting Options

| Option | Cost | Best For |
|---|---|---|
| Fly.io | $0 idle / ~$3-5/month active | Zero-ops start, scale-to-zero, auto TLS |
| Hetzner CAX11 (ARM) | €4.51/month | Cost-sensitive, self-managed, ~$5/month total |
| Hetzner CX22 (x86) | €4.85/month | If ARM compatibility concerns arise |
| Self-hosted (user) | Their cost | Self-hosted tier — docker compose up |

**Recommended path:** Start on Fly.io while building (zero ops overhead). Move to Hetzner when you have users and want to cut costs. Nothing in your Go code changes.

---

## Fly.io Setup

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

## Hetzner VPS Setup

Three config files are the entire production setup:

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

## Self-Hosted Distribution

The entire self-hosted setup is one `docker-compose.yml`. Users run one command:

```yaml
services:
  app:
    image: ghcr.io/yourname/finance-planner:latest
    environment:
      DATABASE_URL:     postgres://postgres:password@db:5432/finance
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      PORT:             8080
    ports:
      - "8080:8080"
    depends_on: [db]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB:       finance
      POSTGRES_USER:     postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
# That's it. Migrations run automatically on startup.
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.23' }

      - name: Lint
        run: go vet ./...

      - name: Test
        run: go test ./... -race -count=1

      # Migrate BEFORE deploying new code
      - name: Migrate DB
        uses: ariga/atlas-action@v1
        with:
          args: >
            migrate apply
            --url "${{ secrets.DATABASE_URL }}"
            --dir file://db/migrations

      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Infrastructure as Code — Pulumi

All infrastructure defined in Go in `infra/main.go`:

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

## Cost Summary (~$5/month total)

| Component | Cost |
|---|---|
| Hetzner CAX11 (API + static frontend) | €4.51/month |
| Neon free tier (Postgres) | $0 |
| Let's Encrypt TLS | $0 |
| Cloudflare free CDN (optional) | $0 |
| **Total** | **~$5/month** |

Plaid production tier adds ~$0.80/user/month — factor into subscription pricing.
