# Arquitectura y Flujos del Sistema

Se implementará una arquitectura basada en capas (Clean Architecture) en el backend, separando los Controladores (Routers), Casos de Uso (Services) y Repositorios.

## API REST JSON
Se utilizará el estándar REST dado que el dominio (Task CRUD) es plano, facilitando el uso nativo de códigos de estado HTTP para manejar la idempotencia (`409 Conflict`) y validaciones de negocio (`403 Forbidden`, `422 Unprocessable Entity`).

## Flujo Crítico: `markAsDone` 
Para demostrar dominio de ecosistemas Cloud y desacoplamiento de procesos intensivos, este caso de uso se externalizará a una **AWS Lambda**:
1. El cliente envía un `PATCH /tasks/{id}/done` incluyendo el header `Idempotency-Key`.
2. El API (FastAPI) intercepta la petición y valida la idempotencia contra **Redis**.
3. Si es válida, el API invoca la función Lambda (desplegada en LocalStack) mediante el AWS SDK.
4. La Lambda procesa la transacción en PostgreSQL y responde al API, quien retorna al cliente.

## Consideraciones Técnicas Avanzadas (Alta Concurrencia)

### Manejo de Concurrencia (Race Conditions)
Para prevenir que dos peticiones marquen la misma tarea como `DONE` simultáneamente, se implementarán dos capas de protección:
* **Nivel Aplicación (Idempotencia):** Middleware con Redis. Se usará el comando `SETNX` (Set if Not Exists) con el `Idempotency-Key` y un TTL. Si la llave ya existe, se rechaza la petición duplicada protegiendo la base de datos.
* **Nivel Base de Datos (Pessimistic Locking):** La transacción SQL utilizará la cláusula `WITH FOR UPDATE` sobre la fila de la tarea. Esto asegura la atomicidad ACID; si la Lambda A está actualizando la fila, la Lambda B esperará o fallará de forma controlada.

### Connection Pool Exhaustion
Al utilizar Cloud Functions que escalan horizontalmente, las conexiones directas a PostgreSQL pueden agotar los recursos de la BD. Para mitigarlo, se interpondrá **PgBouncer** entre el backend/Lambda y PostgreSQL (simulando el rol de AWS RDS Proxy).

### Observabilidad y Logging
Se implementará un Middleware en FastAPI para registrar toda actividad de la API usando logs estructurados en JSON. El log incluirá: `timestamp`, `actor` (`user_id` de Cognito), `method`, `path`, `query_params`, `body_sanitizado` y `status_code`.

## Seguridad: Almacenamiento de JWT

### Decisión de Diseño
El `id_token` de Cognito se almacena en `localStorage` del navegador. Esta decisión sacrifica seguridad contra XSS a cambio de simplicidad de implementación, aceptable para un proyecto de prueba/técnico.

### Tradeoff

| Enfoque | Protección XSS | Protección CSRF | Persistencia | Complejidad |
|---------|----------------|-----------------|--------------|-------------|
| **localStorage (actual)** | ❌ Vulnerable | ✅ Total | ✅ Persiste | Baja |
| httpOnly Cookie | ✅ Total | ✅ SameSite | ✅ Persiste | Media |
| BFF Pattern | ✅ Total | ✅ Total | ✅ Persiste | Alta |
| In-Memory | ✅ Total | ✅ Total | ❌ Se pierde al refresh | Baja |

### Por qué localStorage es vulnerable a XSS
Si un atacante inyecta JavaScript malicioso (XSS), puede ejecutar `localStorage.getItem('id_token')` y exfiltrar el token. Con el token robado, el atacante puede hacer requests autenticados como el usuario.

### Mitigación para producción
Para un entorno de producción, se recomienda migrar a **httpOnly cookies**:
1. Backend expone `POST /auth/login` que recibe credenciales, autentica con Cognito, y setea cookie `httpOnly + SameSite=Strict + Secure`.
2. Frontend elimina el interceptor de Authorization de axios (el browser envía la cookie automáticamente).
3. Middleware `authenticate` lee el JWT de la cookie en lugar del header `Authorization`.
4. `LoginPage.tsx` llama al endpoint del backend en lugar de hacer fetch directo a Cognito.