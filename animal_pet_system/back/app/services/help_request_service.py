from app.db import get_connection


## создание заявки помощи
## вызывает api.create_help_request()

def create_help_request(
    shelter_id,
    user_id,
    title,
    description
):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select api.create_help_request(
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                shelter_id,
                user_id,
                title,
                description
            )
        )

        request_id = cursor.fetchone()[0]

        connection.commit()

        return request_id

    except Exception:

        connection.rollback()

        raise

    finally:

        if cursor:
            cursor.close()

        connection.close()


## получение списка заявок
## вызывает api.get_help_requests()

def help_request_list(
    shelter_id=None,
    help_request_status_id=None
):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select *
            from api.get_help_requests(
                %s,
                %s
            )
            """,
            (
                shelter_id,
                help_request_status_id
            )
        )

        requests = cursor.fetchall()

        return requests

    finally:

        if cursor:
            cursor.close()

        connection.close()


## изменение статуса заявки
## вызывает api.change_help_request_status()

def change_help_request_status(
    request_id,
    help_request_status_id
):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select api.change_help_request_status(
                %s,
                %s
            )
            """,
            (
                request_id,
                help_request_status_id
            )
        )

        connection.commit()

    except Exception:

        connection.rollback()

        raise

    finally:

        if cursor:
            cursor.close()

        connection.close()