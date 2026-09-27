from app.db import get_connection


def _query(statement, values=(), write=False):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(statement, values)
            rows = cursor.fetchall()
        if write:
            connection.commit()
        return rows
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


## создание заявки помощи
## вызывает api.create_help_request()
def create_help_request(shelter_id, user_id, title, description, help_category_id):
    return _query(
        "select api.create_help_request(%s,%s,%s,%s,%s)",
        (shelter_id, user_id, title, description, help_category_id), write=True,
    )[0][0]


## получение списка заявок
## вызывает api.get_help_requests()
def help_request_list(shelter_id=None, help_request_status_id=None,
                      help_category_id=None, include_closed=False, limit=24, offset=0):
    return _query(
        "select * from api.get_help_requests(%s,%s,%s,%s,%s,%s)",
        (shelter_id, help_request_status_id, help_category_id, include_closed, limit, offset),
    )


def help_categories():
    return _query("select * from api.get_help_categories()")


def help_statuses():
    return _query("select * from api.get_help_statuses()")


def update_help_request(request_id, user_id, title, description, help_category_id):
    _query(
        "select api.update_help_request(%s,%s,%s,%s,%s)",
        (request_id, user_id, title, description, help_category_id), write=True,
    )


## изменение статуса заявки
## вызывает api.change_help_request_status()
def change_help_request_status(request_id, help_request_status_id, user_id):
    _query(
        "select api.change_help_request_status(%s,%s,%s)",
        (request_id, help_request_status_id, user_id), write=True,
    )
