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
                SELECT id
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
            return response(404, {"error": "Task not found"})

        return response(200, {
            "id": row[0],
            "title": row[1],
            "status": row[2],
            "updated_at": row[3],
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
        "body": json.dumps(body),
    }
