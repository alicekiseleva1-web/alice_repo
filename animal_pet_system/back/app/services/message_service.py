from app.db import get_connection

def create_message(report_id, user_id, text):
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            select api.create_message(%s, %s, %s)
            """,
            (report_id, user_id, text)
        )
        message_id = cursor.fetchone()[0]
        connection.commit()
        return message_id
    except Exception:
        connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        connection.close()

def message_list(report_id):
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            select *
            from api.get_messages(%s)
            """,
            (report_id,)
        )
        messages = cursor.fetchall()
        return messages
    finally:
        if cursor:
            cursor.close()
        connection.close()