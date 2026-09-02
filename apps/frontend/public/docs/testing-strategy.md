# Testing Strategy (Automation)

## Unit and Integration Tests (Backend)
* **Tool:** Jest + Supertest
* **Config:** `apps/backend/jest.config.ts` (ts-jest preset, node environment)
* **Objective:** 
  * Mock the AWS SDK and Redis calls.
  * Strictly validate the State Machine (verify that invalid transitions are rejected).
  * Validate that the idempotency control returns the correct HTTP status code under simulated concurrent conditions.

### Test Suites
| Suite | File | Tests |
|-------|------|-------|
| State Machine | `src/use-cases/__tests__/state-machine.test.ts` | Validates all valid/invalid transitions, error message format |
| Idempotency | `src/middlewares/__tests__/idempotency.test.ts` | Header validation, Redis SETNX lock, 409 on duplicates, lock release on error |
| Error Handler | `src/middlewares/__tests__/error-handler.test.ts` | AppError (custom status), ZodError (400), InvalidStateTransitionError (422), unknown (500) |

### Run Commands
```bash
cd apps/backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## End-to-End (E2E) Tests
* **Tool:** Cypress
* **Config:** `apps/frontend/cypress.config.ts` (stub-based), `cypress.config.integration.ts` (AWS Cognito)
* **Objective:** Simulate a complete real-world user flow:
  1. Navigate to the web application.
  2. Log in using the form interacting with Cognito.
  3. Create a new task.
  4. Validate the proper rendering of loading indicators (loading states) in the Material UI interface.

### Two Authentication Strategies

**Stub-based (default):**
- Intercepts Cognito API calls via `cy.intercept()`
- Returns mock JWT tokens
- Fast, no external dependencies
- Run with: `npm run test:e2e` (headless) or `npm run test:e2e:open` (interactive)

**AWS Cognito (integration):**
- Runs against real AWS Cognito
- Requires `CYPRESS_COGNITO_EMAIL` and `CYPRESS_COGNITO_PASSWORD` env vars
- Run with: `npm run test:e2e:integration` (headless) or `npm run test:e2e:integration:open` (interactive)

### E2E Test Suites
| Suite | File | Tests |
|-------|------|-------|
| Login | `cypress/e2e/stub/login.cy.ts` | Form render, error on wrong credentials, success redirect, loading state |
| Task Creation | `cypress/e2e/stub/task-creation.cy.ts` | Create task flow, empty state message |
| Loading States | `cypress/e2e/stub/loading-states.cy.ts` | Skeleton placeholders during load, button loading text |
| Full Flow | `cypress/e2e/integration/full-flow.cy.ts` | Complete login → create task → verify (AWS Cognito) |

### Run Commands
```bash
cd apps/frontend
npm run test:e2e                # Headless E2E (stub)
npm run test:e2e:open           # Interactive E2E (stub)
npm run test:e2e:integration    # Headless E2E (AWS Cognito)
npm run test:e2e:integration:open # Interactive E2E (AWS Cognito)
```

## Unit Tests (Frontend)
* **Tool:** Vitest + React Testing Library
* **Config:** `apps/frontend/vitest.config.ts`
* **Existing Tests:** `StatusChip.test.tsx`, `TaskCard.test.tsx`
* **Run Commands:**
```bash
cd apps/frontend
npm test          # Run unit tests
npm run test:watch # Watch mode
```
