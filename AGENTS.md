# Role & Context
You are an Expert Fullstack Software Architect working on a technical test for a US-based SaaS company (Insightt). 
Your code must be production-ready, highly concurrent, scalable, secure, and follow clean code principles.

# Project Overview
A Task Management System with authentication and strict business rules. 
The architecture simulates a Cloud-Native environment using Docker, LocalStack (AWS), PostgreSQL, and Redis.

# Context & Documentation Mapping (CRITICAL)
Before implementing any feature, you MUST READ the corresponding documentation in the `./docs/` folder to understand constraints and design decisions. If you make structural changes, you MUST UPDATE the respective document:
- **Business Logic & Rules:** Read `./docs/business-rules.md`.
- **Architecture & Backend Structure:** Read `./docs/architecture-and-flows.md`.
- **Database Schema:** Read `./docs/database-schema.md`.
- **Infrastructure:** Read `./docs/infrastructure.md`.
- **Testing Requirements:** Read `./docs/testing-strategy.md`.

# Tech Stack
- **Frontend:** React + Vite, TypeScript, Material UI (MUI), React Query, Vitest, Cypress.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Zod, Jest + Supertest.
- **Database:** PostgreSQL (with PgBouncer for connection pooling).
- **Cache/Idempotency:** Redis (via ioredis).
- **Cloud/Auth (Emulated):** LocalStack (AWS Cognito for Auth, AWS Lambda for the `markAsDone` endpoint).

# Architecture & Code Rules

## 1. General Rules & Code Complexity
- **Fail Fast / Early Returns:** Use guard clauses to prevent deep nesting. Maximum indentation level allowed is 2.
- **Cyclomatic Complexity:** Keep functions small and focused. Maximum 10-15 lines of code per function/method.
- **Language:** Use English for all code, variables, commits, and technical documentation.
- **Monorepo Structure:** `/apps/frontend` (React + Vite), `/apps/backend` (Express + TypeScript).

## 2. Backend Rules (Express Clean Architecture)
- **Structure:** Separate concerns into Controllers (Express handlers), Use Cases (Business logic), and Repositories (Prisma data access).
- **Data Validation:** Use Zod middleware for validating request bodies and query parameters.
- **Idempotency:** The `/api/tasks/:id/done` endpoint MUST use Redis (`SETNX`) to prevent processing the same `Idempotency-Key` twice. Return HTTP `409 Conflict` on race conditions.
- **State Machine:** Task statuses are strictly `PENDING -> IN_PROGRESS -> DONE -> ARCHIVED`. Reject invalid transitions with HTTP `422 Unprocessable Entity`.
- **Database Locks:** Use pessimistic locking via raw SQL in Prisma (`prisma.$executeRaw` with `SELECT ... FOR UPDATE`) to handle concurrent state updates atomically.

## 3. Security Rules
- **Authentication:** All protected endpoints must validate the AWS Cognito JWT signature.
- **Authorization (Ownership):** Always scope database queries to the `owner_id` (extracted from the JWT). Return HTTP `403 Forbidden` or `404 Not Found` if there's no match.

## 4. Frontend Rules
- STRICT TYPESCRIPT: No `any` types allowed.
- Use `React Query` for data fetching and caching.
- Use Material UI components. Ensure proper loading states (Spinners/Skeletons) for all async actions.
- All API calls must include the Cognito JWT in the `Authorization: Bearer <token>` header.

## 5. Documentation & Comments
- **Inline Comments:** NEVER explain *WHAT* the code is doing. Only comment *WHY* a specific decision was made (e.g., explaining a workaround for a race condition).