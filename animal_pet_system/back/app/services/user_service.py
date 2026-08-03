from app.db import get_connection


## регистрация пользователя
## вызывает функцию PostgreSQL api.register_user()
def register_user(
    first_name,
    last_name,
    city_id,
    phone,
    email,
    password_hash
):

    ## подключение к PostgreSQL
    connection = get_connection()

    cursor = None

    try:

        ## создание курсора
        cursor = connection.cursor()


        ## вызов функции PostgreSQL
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
                password_hash
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