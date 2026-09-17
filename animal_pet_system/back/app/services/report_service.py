from app.db import get_connection


## создание объявления
## вызывает api.create_report()
def create_report(
    user_id,
    animal_id,
    report_type_id,
    title,
    description,
    location
):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select api.create_report(
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                user_id,
                animal_id,
                report_type_id,
                title,
                description,
                location
            )
        )

        report_id = cursor.fetchone()[0]

        connection.commit()

        return report_id

    except Exception:

        connection.rollback()

        raise

    finally:

        if cursor:
            cursor.close()

        connection.close()


## список объявлений
## вызывает api.get_reports()
def report_list(
    report_type_id=None,
    city_id_value=None,
    limit_value=20,
    offset_value=0
):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select *
            from api.get_reports(
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                report_type_id,
                city_id_value,
                limit_value,
                offset_value
            )
        )

        reports = cursor.fetchall()

        return reports

    finally:

        if cursor:
            cursor.close()

        connection.close()


## одно объявление
## вызывает api.get_report()
def report(report_id):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select *
            from api.get_report(%s)
            """,
            (
                report_id,
            )
        )

        result = cursor.fetchone()

        return result

    finally:

        if cursor:
            cursor.close()

        connection.close()


def close_report(report_id):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()
        cursor.execute("select api.close_report(%s)", (report_id,))
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        connection.close()


def user_report_list(user_id):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()
        cursor.execute("select * from api.get_user_reports(%s)", (user_id,))
        return cursor.fetchall()
    finally:
        if cursor:
            cursor.close()
        connection.close()


def change_report_status(report_id, user_id, report_status_id):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()
        cursor.execute(
            "select api.change_report_status(%s, %s, %s)",
            (report_id, user_id, report_status_id),
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        connection.close()
