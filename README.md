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

## Technical Documentation

To keep the repository organized and facilitate architectural review, detailed documentation is split into the following modules inside the ./docs/ directory:

1. [Functional Scope and Business Rules](./docs/business-rules.md)
2. [System Architecture and Flows](./docs/architecture-and-flows.md)
3. [Infrastructure and Deployment](./docs/infrastructure.md)
4. [Data Model](./docs/database-schema.md)
5. [Testing Strategy](./docs/testing-strategy.md)