# Task Management System - Technical Test (Insightt)

**Role:** Mid/Senior Fullstack Software Architect

## Overview
A web SPA application for task management (CRUD) protected by authentication. The solution follows a Cloud-Native architecture, simulating a microservices and high concurrency environment using containers, Serverless Functions, Connection Pooling, and Caching for idempotency.

## Tech Stack
* **Frontend:** React + Vite + TypeScript + Material UI (MUI)
* **Backend:** Node.js + Express + TypeScript + Prisma ORM + Zod
* **Database:** PostgreSQL + PgBouncer (Connection Pooling)
* **Cache / State:** Redis
* **Authentication:** AWS Cognito
* **Serverless:** AWS Lambda
* **Local Infrastructure:** Docker Compose (ARM64 support for Raspberry Pi 5)

## Video Demo

[![Watch the demo](https://img.shields.io/badge/Watch-Demo-blue)](https://drive.google.com/file/d/1Tvl_OOt24uo2jszPGpplUlXAb2HYARYd/view?usp=sharing)

[Watch the full walkthrough on Google Drive](https://drive.google.com/file/d/1Tvl_OOt24uo2jszPGpplUlXAb2HYARYd/view?usp=sharing)

## How the Solution Works

The project is a monorepo split into `/apps/frontend` (React + Vite + MUI) and `/apps/backend` (Express + TypeScript), backed by PostgreSQL, Redis and AWS Cognito. The backend follows a Clean Architecture layered design (Controllers → Use Cases → Repositories), with all request bodies and query params validated by Zod.

### Core Domain
- **Task CRUD** with ownership scoping: every query is filtered by the authenticated `owner_id` (from the Cognito JWT), enforcing `403`/`404` on cross-user access.
- **Reversible state machine** `PENDING ↔ IN_PROGRESS ↔ DONE ↔ ARCHIVED` (plus direct archive and unarchive to any previous state). Invalid transitions return `422 Unprocessable Entity`.
- **Role-based permissions** (Owner / Assignee / Shared read-only) enforced on the backend, with a matching read-only UI for shared viewers.
- **Extended fields** for prioritization and scheduling: `assigneeId`, `startDate`/`dueDate`, `urgency`, `importance`, `tags` (`TEXT[]`).
- **Kanban board** with drag & drop (dnd-kit) on desktop and a mobile accordion + move-arrow fallback.

### High Concurrency Design
- **Idempotency (Redis `SETNX`):** the `PATCH /api/tasks/:id/done` endpoint deduplicates requests by `Idempotency-Key`, returning `409 Conflict` on races.
- **Pessimistic locking (PostgreSQL `SELECT ... FOR UPDATE`):** the `markAsDone` use case is externalized to an **AWS Lambda** that locks the task row before flipping it to `DONE`, guaranteeing ACID atomicity under concurrent load.
- **Connection pooling (PgBouncer):** sits between the app and PostgreSQL locally, simulating AWS RDS Proxy to avoid connection-pool exhaustion when serverless functions scale horizontally.

### Security
- Cognito `id_token` is stored in an **`httpOnly` + `Secure` + `SameSite=Lax` cookie** (never `localStorage`) and every request is protected by a **Double Submit Cookie CSRF** token.
- All `/api/*` traffic enters through **API Gateway** (`api.insight.verkku.com`) with WAF rate limiting, which proxies to the ALB → backend.

### Infrastructure & Delivery
- **Local:** single `docker-compose.yaml` (PostgreSQL + PgBouncer + Redis), ARM64-ready.
- **Production (AWS):** OpenTofu in `infra/` provisions ECS Fargate, ALB, API Gateway, WAF, Cognito, RDS, ElastiCache and the `markAsDone` Lambda in `us-east-2`.
- **CI/CD:** GitHub Actions pipeline runs Jest/Vitest tests, SonarQube analysis, multi-arch builds to GHCR and deploys via `tofu apply`.

## Technical Documentation

To keep the repository organized and facilitate architectural review, detailed documentation is split into the following modules inside the ./docs/ directory:

1. [Functional Scope and Business Rules](./docs/business-rules.md)
2. [System Architecture and Flows](./docs/architecture-and-flows.md)
3. [Infrastructure and Deployment](./docs/infrastructure.md)
4. [Data Model](./docs/database-schema.md)
5. [Testing Strategy](./docs/testing-strategy.md)