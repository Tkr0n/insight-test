# Data Model (PostgreSQL)

## Table: `users`

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | Primary Key | Cognito `sub` claim. |
| `email` | `VARCHAR(255)` | Unique, Not Null | User email. |
| `name` | `VARCHAR(255)` | Nullable | Display name. |
| `created_at` | `TIMESTAMP` | Default: now() | Creation timestamp. |

Relations: `ownedTasks` (1:N via `tasks.owner_id`), `assignedTasks` (1:N via `tasks.assignee_id`), `shares` (1:N via `task_shares.user_id`).

## Table: `tasks`

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the task. |
| `title` | `VARCHAR(255)` | Not Null | Descriptive title. |
| `description` | `TEXT` | Nullable | Additional details. |
| `status` | `ENUM` | Default: 'PENDING' | Valid states: 'PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'. |
| `owner_id` | `VARCHAR(255)`| Not Null, FK → `users.id` | Creator/owner (Cognito `sub`). |
| `assignee_id` | `VARCHAR(255)`| Nullable, FK → `users.id` | Responsible user (assignee). Only owner can change. |
| `start_date` | `DATE` | Nullable | Task start date. |
| `due_date` | `DATE` | Nullable | Task deadline; drives deadline coloring. |
| `urgency` | `INTEGER` | Default: 2, range 1-4 | 1=highest urgency. |
| `importance` | `INTEGER` | Default: 2, range 1-4 | 1=highest importance. |
| `tags` | `TEXT[]` | Default: '{}' | Free-form labels (PostgreSQL array). |
| `version` | `INTEGER` | Default: 1 | Used for optimistic concurrency control. |
| `created_at` | `TIMESTAMP` | Default: now() | Creation timestamp. |
| `updated_at` | `TIMESTAMP` | Default: now() | Last update timestamp. |

Relations: `owner` (N:1 User), `assignee` (N:1 User, nullable), `shares` (1:N TaskShare).

## Table: `task_shares`

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the share. |
| `task_id` | `UUID` | Not Null, FK → `tasks.id` ON DELETE CASCADE | Shared task. |
| `user_id` | `VARCHAR(255)` | Not Null, FK → `users.id` ON DELETE CASCADE | User with read-only access. |
| `shared_at` | `TIMESTAMP` | Default: now() | When sharing was created. |

Constraints: `UNIQUE(task_id, user_id)` — a user can be shared a task only once.

Relations: `task` (N:1 Task), `user` (N:1 User).
