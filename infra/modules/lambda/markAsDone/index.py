import json
import os
import redis
import psycopg2
from datetime import datetime


def lambda_handler(event, context):
    task_id = event.get("pathParameters", {}).get("id")
    idempotency_key = event.get("headers", {}).get("Idempotency-Key")
    user_id = event.get("requestContext", {}).get("authorizer", {}).get("claims", {}).get("sub")

    if not task_id:
        return response(400, {"error": "Task ID is required"})
    if not idempotency_key:
        return response(400, {"error": "Idempotency-Key header is required"})
    if not user_id:
        return response(401, {"error": "Unauthorized"})

    r = redis.Redis(
        host=os.environ["REDIS_ENDPOINT"],
        port=int(os.environ["REDIS_PORT"]),
        decode_responses=True,
    )

    lock_key = f"idempotency:{idempotency_key}"
    if not r.set(lock_key, "1", nx=True, ex=300):
        return response(409, {"error": "Duplicate request"})

    conn = psycopg2.connect(
        host=os.environ["RDS_ENDPOINT"],
        port=os.environ["RDS_PORT"],
        dbname=os.environ["RDS_DB_NAME"],
        user=os.environ["RDS_DB_USER"],
        password=os.environ["RDS_DB_PASSWORD"],
    )

    try:
        cur = conn.cursor()
        cur.execute(
            """
            WITH locked_task AS (
                SELECT id, title, status
                FROM tasks
                WHERE id = %s AND owner_id = %s
                FOR UPDATE
            )
            UPDATE tasks
            SET status = 'DONE', updated_at = %s
            FROM locked_task
            WHERE tasks.id = locked_task.id
            RETURNING tasks.id, tasks.title, tasks.status, tasks.updated_at
            """,
            (task_id, user_id, datetime.utcnow().isoformat()),
        )
        row = cur.fetchone()
        conn.commit()

        if not row:
            r.delete(lock_key)
            return response(404, {"error": "Task not found"})

        return response(200, {
            "id": row[0],
            "title": row[1],
            "status": row[2],
            "updated_at": row[3],
        })
    except Exception as e:
        conn.rollback()
        r.delete(lock_key)
        return response(500, {"error": str(e)})
    finally:
        cur.close()
        conn.close()


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
