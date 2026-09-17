from app.db import get_connection


def get_user_shelter(user_id):

    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            select *
            from api.get_user_shelter(%s)
            """,
            (user_id,),
        )

        return cursor.fetchone()

    finally:
        if cursor:
            cursor.close()

        connection.close()


def update_user_shelter(user_id, name, address, description):

    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            select api.update_user_shelter(%s, %s, %s, %s)
            """,
            (
                user_id,
                name,
                address,
                description,
            ),
        )

        shelter_id = cursor.fetchone()[0]
        connection.commit()

        return shelter_id

    except Exception:
        connection.rollback()
        raise

    finally:
        if cursor:
            cursor.close()

        connection.close()
