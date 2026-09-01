# Functional Scope and Business Rules

## Task Management (CRUD)
* **Create:** Creation of tasks automatically assigned to the authenticated `user_id`.
* **Read:** Listing of owned tasks (filtered by owner in the backend).
* **Update:** Editing of tasks subject to state machine rules.
* **Delete:** Logical (Soft Delete) or physical deletion of the task.

## Strict Domain Rules
1. **State Machine:** The lifecycle of a task is strictly sequential: `PENDING → IN_PROGRESS → DONE → ARCHIVED`. Any invalid transition (e.g., `PENDING → DONE`) will return an HTTP `422 Unprocessable Entity` error.
2. **Ownership:** Only the original creator of the task can advance its status to `DONE`.
3. **Partial Immutability:** Once the task reaches the `DONE` status, it is locked for editing. The only permitted exception is fixing typographical errors in the `title` field.