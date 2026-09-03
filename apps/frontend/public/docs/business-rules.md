# Functional Scope and Business Rules

## Task Management (CRUD)
* **Create:** Creation of tasks automatically assigned to the authenticated `user_id`.
* **Read:** Listing of owned tasks (filtered by owner in the backend).
* **Update:** Editing of tasks subject to state machine rules.
* **Delete:** Logical (Soft Delete) or physical deletion of the task.

## Strict Domain Rules
1. **State Machine (reversible):** The lifecycle allows forward progression `PENDING → IN_PROGRESS → DONE → ARCHIVED` and backward correction one step at a time. Valid transitions are `PENDING ↔ IN_PROGRESS`, `IN_PROGRESS ↔ DONE`, `DONE ↔ ARCHIVED` plus direct archive `PENDING/IN_PROGRESS → ARCHIVED`. Any other jump (e.g., `PENDING → DONE`) returns HTTP `422 Unprocessable Entity`.
2. **Status change:** Only the **assignee** can change a task's status (`updateWithPermission` returns `403` otherwise); the owner controls assignment and sharing. Note the dedicated `PATCH /tasks/:id/done` endpoint is owner-scoped and externalized to a Lambda. It is reached via the API Gateway entrypoint (`api.insight.verkku.com`): the client calls `PATCH /api/tasks/:id/done`, which is proxied by the API Gateway → ALB → backend (Express), and the backend then invokes the `markAsDone` Lambda via the AWS SDK (it locks the row `FOR UPDATE` and sets `DONE`). All transitions must follow the state machine above.
3. **Partial Immutability:** Once the task reaches the `DONE` or `ARCHIVED` status, it is locked for editing. The only permitted mutations are `title` typo fixes and valid state transitions (e.g., `DONE → ARCHIVED` or `ARCHIVED → DONE`/`DONE → IN_PROGRESS` for correction). `description` remains locked.

## Extended Task Fields
Extended attributes introduced to support prioritization, scheduling, assignment and discovery:

| Field | Type | Validation | Description |
| :--- | :--- | :--- | :--- |
| `assigneeId` | `string \| null` | `z.string().min(1).nullable()` | Responsible user (assignment). `null` means unassigned. Only the **owner** can change this field; changing it as non-owner returns `403 Forbidden`. |
| `startDate` | `ISO date \| null` | `z.string().date().nullable()` or `datetime` | Planned start. Optional. If both `startDate` and `dueDate` are present, UI validates `dueDate >= startDate`; backend stores as `DATE`. |
| `dueDate` | `ISO date \| null` | `z.string().date().nullable()` or `datetime` | Deadline. Optional. Drives deadline coloring and `overdue` filter (`dueDate < today`). |
| `urgency` | `number` | `z.number().int().min(1).max(4).optional().default(2)` | 1 = most urgent → 4 = least. Rendered as `U:1..4` chip (`error/warning/info/default`). Filters as exact match. |
| `importance` | `number` | `z.number().int().min(1).max(4).optional().default(2)` | 1 = most important → 4 = least. Same rendering and filter semantics as `urgency`. |
| `tags` | `string[]` | `z.array(z.string().min(1).max(50)).max(10).optional().default([])` | Free-form labels stored as PostgreSQL `TEXT[]`. Filtering uses `hasSome` (OR semantics). Rendered as chips (first 3 + `+N`). |

All new fields are optional on `POST /api/tasks`; `urgency`/`importance` default to `2` and `tags` to `[]` when omitted. `PUT /api/tasks/:id` accepts any subset via `updateTaskSchema`.

## Permissions

> **Routing note:** All `/api/*` traffic is served through the API Gateway (`api.insight.verkku.com`), which proxies to the ALB → backend (Express). Clients always address the gateway and never call the Express ALB path directly.

### Roles
* **Owner (creator):** `task.ownerId === caller.sub`. Full ownership; only actor who can reassign (`assigneeId`) and share/unshare.
* **Assignee:** `task.assigneeId === caller.sub`. Responsible for execution; only actor who can change `status` (`updateWithPermission` gate).
* **Shared:** `task_shares.userId === caller.sub`. Read-only observer explicitly shared via `POST /api/tasks/:id/share`. Can appear in filter dropdowns.

### Permission Matrix

| Action | Owner | Assignee | Shared (read-only) |
| :--- | :---: | :---: | :---: |
| **Read** (`GET /tasks`, `GET /tasks/:id`) | ✅ | ✅ | ✅ |
| **Create** (`POST /tasks`) | ✅ (becomes owner) | — | — |
| **Edit content** (`title`, `description`, `tags`, `dates`, `urgency/importance`) | ✅ | ✅* | ❌ `403` |
| **Reassign** (`assigneeId`) | ✅ | ❌ `403` (`Only owner can reassign task`) | ❌ `403` |
| **Move status** (`status` via `PUT` or Kanban drag) | ❌ `403` (`Only assignee can change status`) | ✅ (subject to state-machine) | ❌ `403` |
| **Delete** (`DELETE /tasks/:id`) | ✅ | ❌ `404` (scoped to owner) | ❌ `404` |
| **Share / Unshare** (`POST/DELETE /tasks/:id/share`) | ✅ | ✅ | ❌ `403` |
| **State transition validation** | — | `422` if `PENDING→DONE` etc. | — |
| **Locked task** (`DONE`/`ARCHIVED`) | Only `title` editable | Only `title` editable | ❌ |

\* Assignee can edit content except `assigneeId`; shared users cannot update at all. `findAccessibleTask` scopes reads to `OR(owner, assignee, share)` while `updateWithPermission` enforces the column-level gates before applying state-machine and lock checks.

### UI enforcement of the matrix
The frontend (`TaskCard`) computes `canManage = (owner || assignee)`. A user who only has the task **shared** (neither owner nor assignee) sees a **read-only** card: the `Edit`, `Mark Done`/`Archive`, `Share`, `Delete` buttons and the mobile move arrows are hidden and replaced by a "Read-only" footer. The backend still enforces `403`/`404` as a second layer.

## User Management & Authentication (admin by email)

Roles are **not** stored in the database; the admin role is derived by comparing the authenticated user's email with `env.ADMIN_EMAIL` (default `admin@insightt.com`).

| Role | Determined by | Capabilities |
| :--- | :--- | :--- |
| **Admin** | `req.user.email === env.ADMIN_EMAIL` | Sees the **Users** menu (frontend); creates/edits/deletes users (`POST/PUT/DELETE /api/users`, guarded by `requireAdmin` → `403` for members); can create users with a temporary password. |
| **Member** | any other authenticated user | Cannot see the **Users** menu (hidden in `Layout`) and cannot manage users (backend `403`). A member can still register, log in and be assigned/shared tasks. |

### User lifecycle & password policies
- **Admin-created users:** `POST /api/users` creates the user in Cognito via `AdminCreateUser` with a **random temporary password** (`MessageAction: SUPPRESS`), which puts the account in `FORCE_CHANGE_PASSWORD`; the response includes `{ user, temporaryPassword }` for the admin to share. The DB row uses the Cognito `sub` as `id` so the login identity matches.
- **Self-registration:** `POST /api/auth/register {email,password,name?}` does Cognito `SignUp` + `admin-confirm-sign-up` (no email delivery is configured, so the account is active immediately).
- **Forced password change:** on first login a temporary password makes `InitiateAuth` return `NEW_PASSWORD_REQUIRED` → the backend responds `{ challenge, session }` (no cookies yet); the client completes it with `POST /api/auth/change-password {email,session,newPassword}` → `RespondToAuthChallenge` → the session cookies are issued.
- **Identity endpoint:** `GET /api/auth/me` returns `{ id, email, isAdmin }`. `isAdmin` drives the visibility of the Users menu and the admin guards.

> **Design note:** keeping the admin by email (instead of a `role` column) is intentional and sufficient for this test — the docs describe the permission model as implemented.

## Deadline Colors

Computed by `getDeadlineColor(dueDate)` (`apps/frontend/src/utils/deadline.ts`) using `date-fns/differenceInCalendarDays` against `today` (00:00):

| Condition | `DeadlineColor` | Border (`deadlineBorder`) | UX |
| :--- | :--- | :--- | :--- |
| `dueDate === null` or invalid | `null` | — | No left border |
| `dueDate < today` | `red` | `2px solid #c62828` | Overdue – highest attention |
| `dueDate === today` | `orange` | `2px solid #ef6c00` | Due today |
| `0 < diff <= 2` (next 2 calendar days) | `yellow` | `2px solid #f9a825` | Due soon |
| `diff > 2` | `null` | — | Far future – no highlight |

`TaskCard` applies `sx={{ borderLeft: deadlineColor ? deadlineBorder[deadlineColor] : undefined }}`. Cypress verifies red border via `have.css('border-left-color')`.

## Sharing

* **Model:** `task_shares(task_id, user_id)` with `UNIQUE(task_id, user_id)` and `ON DELETE CASCADE`. A user with a share is included in `findByOwner` / `findAccessibleTask` and appears in user-typeahead.
* **Endpoints:**
  * `POST /api/tasks/:id/share` `{ userId }` → `201` (owner or assignee only; else `403`). Validated by `shareTaskSchema` (`userId: z.string().min(1)`).
  * `GET /api/tasks/:id/share` → list of shares.
  * `DELETE /api/tasks/:id/share/:userId` → `204`.
* **Semantics:** Sharing is **read-only tracking** (no write permission). Shared users see the task on the Kanban board but `isDraggable = task.assigneeId === currentUserId` disables drag and `updateWithPermission` rejects status/assign changes with `403`. Only the owner can reassign; assignee retains move permission even if also shared.
* **Frontend:** `ShareModal` (`Autocomplete` + `useUsers`) lists available users (excluding owner and already-shared), shows current shares, and gates Add/Remove buttons to `effectiveIsOwner` – backend still enforces `403`.
