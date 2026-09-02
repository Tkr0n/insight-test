# Infrastructure and Local Deployment (Docker)

The entire ecosystem is orchestrated through a single `docker-compose.yaml`, designed to run natively on both x86 and ARM64 architectures.

## Services

| Service | Image | Port | Description |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `postgres:16-alpine` | `5432` | Primary database. |
| **PgBouncer** | `edoburu/pgbouncer:1.22.0` | `6432` | Connection pooler for PostgreSQL. |
| **Redis** | `redis:7-alpine` | `6379` | Cache and idempotency control. |

## Environment Variables

### PostgreSQL / PgBouncer
| Variable | Value |
| :--- | :--- |
| `POSTGRES_USER` | `insightt_user` |
| `POSTGRES_PASSWORD` | `insightt_password` |
| `POSTGRES_DB` | `insightt_db` |

## Persistence Volumes
To ensure data survives container lifecycle, persistent volumes are configured:
* **PostgreSQL:** `/var/lib/postgresql/data` (schema and data).
* **Redis:** `/data` with AOF (Append-Only File) policy enabled.

## Networking
All services share the `insightt_network` (bridge) to enable internal container communication.
