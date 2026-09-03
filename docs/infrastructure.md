# Infrastructure

The Insightt stack runs in two modes: a **local development** environment (Docker Compose) for day-to-day work, and a **production** environment deployed to AWS. Both are described below.

## Overview

| Environment | Orchestration | Purpose |
| :--- | :--- | :--- |
| **Local (dev)** | Docker Compose | Fast local iteration, no external dependencies. |
| **Production (AWS)** | OpenTofu (`infra/`) | Cloud-native, scalable, internet-facing SaaS deployment. |

The production stack is provisioned in `us-east-2` under the `insight-test-tkr0n` project, with all infrastructure managed as code via OpenTofu.

## Local Development (Docker)

The entire local ecosystem is orchestrated through a single `docker-compose.yaml`, designed to run natively on both x86 and ARM64 architectures.

### Services

| Service | Image | Port | Description |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `postgres:16-alpine` | `5432` | Primary database. |
| **PgBouncer** | `edoburu/pgbouncer:1.22.0` | `6432` | Connection pooler for PostgreSQL (local only). |
| **Redis** | `redis:7-alpine` | `6379` | Cache and idempotency control. |

### Environment Variables

**PostgreSQL / PgBouncer**

| Variable | Value |
| :--- | :--- |
| `POSTGRES_USER` | `insightt_user` |
| `POSTGRES_PASSWORD` | `insightt_password` |
| `POSTGRES_DB` | `insightt_db` |

**Application**

| Variable | Value |
| :--- | :--- |
| `DATABASE_URL` | `pgbouncer:6432` |
| `REDIS_URL` | `redis:6379` |
| `COOKIE_SECURE` | `false` |

The frontend/backend runtime images are pulled from `ghcr.io/tkr0n/insight-test/insightt-{frontend,backend}:latest`.

### Persistence Volumes

To ensure data survives container lifecycle, persistent volumes are configured:
* **PostgreSQL:** `/var/lib/postgresql/data` (schema and data).
* **Redis:** `/data` with AOF (Append-Only File) policy enabled.

### Networking

All services share the `insightt_network` (bridge) to enable internal container communication.

## Production (AWS / Terraform)

The production environment is provisioned by OpenTofu from the `infra/` directory and is composed of the resources below.

### Resources

| Resource | AWS Service | Details |
| :--- | :--- | :--- |
| **Frontend** | ECS Fargate | Nginx serving the React SPA. |
| **Backend** | ECS Fargate | Express API on `:3000`. |
| **Load Balancer** | ALB (internet-facing) | Routes `/api/*` → backend and `/` → frontend (SPA). |
| **API Gateway** | HTTP API v2 | Custom domain `api.insight.verkku.com`; route `ANY /api/{proxy+}` proxies (`HTTP_PROXY`) to the ALB DNS. |
| **WAF** | AWS WAFv2 (regional) | Attached to the ALB; rate rule scoped to `/api` (2000 req / 5 min / IP). |
| **Auth** | Cognito | User pool issuing JWTs. |
| **Database** | RDS PostgreSQL | `:5432`. PgBouncer is local-only; prod connects directly via `DATABASE_URL` / `RDS_*`. |
| **Cache** | ElastiCache Redis | `:6379`. |
| **Lambda** | `markAsDone` | Python 3.12. |
| **TLS** | ACM | Certificate for `insight.verkku.com`. |

### Key Configuration

* **ALB:** Internet-facing; HTTP/HTTPS listener with the ACM certificate. `/api/*` → backend target group, `/` → frontend target group (SPA).
* **ECS Fargate:** Frontend (Nginx SPA) and backend (Express on `:3000`) tasks run behind the ALB.
* **API Gateway:** Regional custom domain `api.insight.verkku.com` with route `ANY /api/{proxy+}` proxying (`HTTP_PROXY`) to the ALB DNS; stage throttling at **100 rps / burst 200**.
* **WAF:** AWS WAFv2 (regional) associated with the ALB; rate rule of 2000 requests per 5 minutes per IP scoped to `/api`.
* **Auto-scaling:** Backend ECS Service Auto Scaling with CPU target tracking (min 1 / max 4).

### State & Delivery

* **Terraform state:** Backend S3 bucket `insight-test-tfstate` (encrypted) with DynamoDB lock table `insight-test-tflock`.
* **DNS:** Cloudflare — `insight.verkku.com` → ALB; `api.insight.verkku.com` → API Gateway regional domain.

### CI/CD

GitHub Actions pipeline:

1. **Tests** — Jest (backend) / Vitest (frontend).
2. **Analysis** — SonarQube scan.
3. **Build** — Multi-arch (amd64 + arm64) images pushed to GHCR (`ghcr.io/tkr0n/insight-test/insightt-{frontend,backend}:latest`).
4. **Deploy** — `tofu apply`, ECS `update-service --force-new-deployment`, `prisma migrate deploy`.

### Production Environment Variables

| Variable | Value |
| :--- | :--- |
| `COOKIE_DOMAIN` | `.insight.verkku.com` |
| `CORS_ORIGIN` | `https://insight.verkku.com` |
| `COOKIE_SECURE` | `true` |
| `VITE_API_URL` | `https://api.insight.verkku.com/api` |
