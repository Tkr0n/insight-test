# System Architecture and Flows

The backend implements a layered architecture (Clean Architecture), separating Controllers (Routers), Use Cases (Services), and Repositories.

## REST JSON API
The REST standard is used since the domain (Task CRUD) is flat, making it natural to use HTTP status codes for idempotency (`409 Conflict`) and business rule validations (`403 Forbidden`, `422 Unprocessable Entity`).

## Critical Flow: `markAsDone`
To demonstrate Cloud ecosystem expertise and decoupling of intensive processes, this use case is externalized to an **AWS Lambda**:
1. The client sends a `PATCH /tasks/{id}/done` including the `Idempotency-Key` header.
2. The API intercepts the request and validates idempotency against **Redis**.
3. If valid, the API invokes the Lambda function (deployed on LocalStack) via the AWS SDK.
4. The Lambda processes the transaction in PostgreSQL and responds to the API, which returns to the client.

## Advanced Technical Considerations (High Concurrency)

### Race Condition Handling
To prevent two requests from marking the same task as `DONE` simultaneously, two layers of protection are implemented:
* **Application Level (Idempotency):** Redis middleware. The `SETNX` (Set if Not Exists) command is used with the `Idempotency-Key` and a TTL. If the key already exists, the duplicate request is rejected, protecting the database.
* **Database Level (Pessimistic Locking):** The SQL transaction uses the `WITH FOR UPDATE` clause on the task row. This ensures ACID atomicity; if Lambda A is updating the row, Lambda B will wait or fail in a controlled manner.

### Connection Pool Exhaustion
When using Cloud Functions that scale horizontally, direct connections to PostgreSQL can exhaust database resources. To mitigate this, **PgBouncer** is placed between the backend/Lambda and PostgreSQL (simulating the role of AWS RDS Proxy).

### Observability and Logging
A middleware is implemented to log all API activity using structured JSON logs. Each log includes: `timestamp`, `actor` (Cognito `user_id`), `method`, `path`, `query_params`, `sanitized_body`, and `status_code`.

## Security: JWT Storage

### Design Decision
The Cognito `id_token` is stored in the browser's `localStorage`. This decision trades XSS security for implementation simplicity, which is acceptable for a technical test / proof-of-concept project.

### Tradeoff

| Approach | XSS Protection | CSRF Protection | Persistence | Complexity |
|----------|---------------|-----------------|-------------|------------|
| **localStorage (current)** | ❌ Vulnerable | ✅ Complete | ✅ Persists | Low |
| httpOnly Cookie | ✅ Complete | ✅ SameSite | ✅ Persists | Medium |
| BFF Pattern | ✅ Complete | ✅ Complete | ✅ Persists | High |
| In-Memory | ✅ Complete | ✅ Complete | ❌ Lost on refresh | Low |

### Why localStorage is Vulnerable to XSS
If an attacker injects malicious JavaScript (XSS), they can execute `localStorage.getItem('id_token')` and exfiltrate the token. With the stolen token, the attacker can make authenticated requests as the user.

### Production Mitigation
For a production environment, migrating to **httpOnly cookies** is recommended:
1. Backend exposes `POST /auth/login` that receives credentials, authenticates with Cognito, and sets an `httpOnly + SameSite=Strict + Secure` cookie.
2. Frontend removes the Authorization interceptor from axios (the browser sends the cookie automatically).
3. The `authenticate` middleware reads the JWT from the cookie instead of the `Authorization` header.
4. `LoginPage.tsx` calls the backend endpoint instead of making a direct fetch to Cognito.
