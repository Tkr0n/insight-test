# Testing Strategy (Automation)

## Unit and Integration Tests (Backend)
* **Tool:** Jest + Supertest (or native Next.js test utilities).
* **Objective:** 
  * Mock the AWS SDK and Redis calls.
  * Strictly validate the State Machine (verify that invalid transitions are rejected).
  * Validate that the idempotency control returns the correct HTTP status code under simulated concurrent conditions.

## End-to-End (E2E) Tests
* **Tool:** Cypress.
* **Objective:** Simulate a complete real-world user flow:
  1. Navigate to the web application.
  2. Log in using the form interacting with Cognito.
  3. Create a new task.
  4. Validate the proper rendering of loading indicators (loading states) in the Material UI interface.