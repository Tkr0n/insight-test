# Data Model (PostgreSQL)

## Table: `tasks`

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the task. |
| `title` | `VARCHAR(255)` | Not Null | Descriptive title. |
| `description` | `TEXT` | Nullable | Additional details. |
| `status` | `ENUM` | Default: 'PENDING' | Valid states: 'PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'. |
| `owner_id` | `VARCHAR(255)`| Not Null | Mapped to the `sub` claim of the AWS Cognito JWT. |
| `version` | `INTEGER` | Default: 1 | Used for optimistic concurrency control (optional). |
| `created_at` | `TIMESTAMP` | Default: now() | Creation timestamp. |
| `updated_at` | `TIMESTAMP` | Default: now() | Last update timestamp. |