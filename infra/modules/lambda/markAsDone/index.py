import json
import os
import psycopg2
from datetime import datetime


def lambda_handler(event, context):
    task_id = event.get("taskId")
    user_id = event.get("ownerId")
    current_status = event.get("currentStatus")

    if not task_id:
        return response(400, {"error": "Task ID is required"})
    if not user_id:
        return response(401, {"error": "Unauthorized"})
    if current_status != "IN_PROGRESS":
        return response(422, {"error": f"Invalid state transition: {current_status} → DONE"})

    endpoint = os.environ["RDS_ENDPOINT"]
    db_host, _, db_port = endpoint.partition(":")
    conn = psycopg2.connect(
        host=db_host,
        port=db_port or os.environ["RDS_PORT"],
        dbname=os.environ["RDS_DB_NAME"],
        user=os.environ["RDS_DB_USER"],
        password=os.environ["RDS_DB_PASSWORD"],
    )

    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id
            FROM tasks
            WHERE id = %s AND owner_id = %s
            FOR UPDATE
            """,
            (task_id, user_id),
        )
        row = cur.fetchone()
        if not row:
            conn.rollback()
            return response(404, {"error": "Task not found or access denied"})

        cur.execute(
            """
            UPDATE tasks
            SET status = 'DONE', updated_at = %s, version = version + 1
            WHERE id = %s
            RETURNING id, title, status, updated_at
            """,
            (datetime.utcnow().isoformat(), task_id),
        )
        updated = cur.fetchone()
        conn.commit()

        return response(200, {
            "id": updated[0],
            "title": updated[1],
            "status": updated[2],
            "updated_at": updated[3],
        })
    except Exception as e:
        conn.rollback()
        return response(500, {"error": str(e)})
    finally:
        conn.close()


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
