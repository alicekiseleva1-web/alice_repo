from app.db import get_connection
from app.security import hash_password, verify_password


## регистрация пользователя
## вызывает функцию api.register_user()
def register_user(
    first_name,
    last_name,
    city_id,
    phone,
    email,
    password
):

    ## подключение к пг
    connection = get_connection()

    cursor = None

    try:

        ## создание курсора
        cursor = connection.cursor()


        ## вызов функции 
        cursor.execute(
            """
            select api.register_user(
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                first_name,
                last_name,
                city_id,
                phone,
                email,
                hash_password(password)
            )
        )


        ## получение id созданного пользователя
        user_id = cursor.fetchone()[0]


        ## сохранение изменений
        connection.commit()


        ## возврат id пользователя
        return user_id


    except Exception:

        ## откат изменений при ошибке
        connection.rollback()

        raise


    finally:

        ## закрытие курсора
        if cursor:
            cursor.close()


        ## закрытие соединения
        connection.close()

## карточка пользователя
## вызывает api.get_user()
def get_user(user_id):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select *
            from api.get_user(%s)
            """,
            (
                user_id,
            )
        )

        result = cursor.fetchone()

        return result

    finally:

        if cursor:
            cursor.close()

        connection.close()


def login_user(email, password):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select *
            from api.get_user_credentials(%s)
            """,
            (
                email,
            )
        )

        result = cursor.fetchone()

        if result is None:
            return None

        user_id, password_hash = result

        if not verify_password(password, password_hash):
            return None

        return user_id

    finally:

        if cursor:
            cursor.close()

        connection.close()


def resolve_city(city_name, city_fias_id):

    connection = get_connection()
    cursor = None

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            select api.resolve_city(%s, %s)
            """,
            (
                city_name,
                city_fias_id,
            )
        )

        city_id = cursor.fetchone()[0]
        connection.commit()

        return city_id

    except Exception:

        connection.rollback()
        raise

    finally:

        if cursor:
            cursor.close()

        connection.close()

