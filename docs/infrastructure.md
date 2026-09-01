# Infrastructure and Local Deployment (Docker)

The entire ecosystem is orchestrated through a single `docker-compose.yaml`, designed to run natively on both x86 and ARM64 architectures.

## Services

| Service | Image | Port | Description |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `postgres:16-alpine` | `5432` | Primary database. |
| **PgBouncer** | `edoburu/pgbouncer:1.22.0` | `6432` | Connection pooler for PostgreSQL. |
| **Redis** | `redis:7-alpine` | `6379` | Cache and idempotency control. |
| **LocalStack** | `localstack/localstack:3.5` | `4566` | AWS emulator (Cognito, Lambda). |

## Environment Variables

### PostgreSQL / PgBouncer
| Variable | Value |
| :--- | :--- |
| `POSTGRES_USER` | `insightt_user` |
| `POSTGRES_PASSWORD` | `insightt_password` |
| `POSTGRES_DB` | `insightt_db` |

### LocalStack
| Variable | Value |
| :--- | :--- |
| `AWS_DEFAULT_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | `test` |
| `AWS_SECRET_ACCESS_KEY` | `test` |
| `PERSISTENCE` | `1` |

## Persistence Volumes
To ensure data survives container lifecycle, persistent volumes are configured:
* **PostgreSQL:** `/var/lib/postgresql/data` (schema and data).
* **Redis:** `/data` with AOF (Append-Only File) policy enabled.
* **LocalStack:** `/var/lib/localstack` with `PERSISTENCE=1` enabled to preserve the Cognito User Pool, test users, and deployed Lambda function.

## Initialization Script (Bootstrapping)
An `init-aws.sh` script in `infra/` is injected into LocalStack and runs automatically from `/etc/localstack/init/ready.d/` to provision the emulated infrastructure on startup:
1. Creation of the Cognito User Pool and App Client (SPA without client secret).
2. Packaging and deployment of the AWS Lambda (pending).

## Networking
All services share the `insightt_network` (bridge) to enable internal container communication.
