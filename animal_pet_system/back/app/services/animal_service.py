from app.db import get_connection


## создание животного
## вызывает PostgreSQL функцию api.create_animal()
def create_animal(
    owner_id,
    name,
    breed,
    gender_id,
    age,
    color,
    city_id,
    description
):

    ## подключение к PostgreSQL
    connection = get_connection()

    cursor = None

    try:

        ## создаём курсор
        cursor = connection.cursor()


        ## вызываем функцию PostgreSQL
        cursor.execute(
            """
            select api.create_animal(
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                owner_id,
                name,
                breed,
                gender_id,
                age,
                color,
                city_id,
                description
            )
        )


        ## получаем id животного
        animal_id = cursor.fetchone()[0]


        ## сохраняем изменения
        connection.commit()


        ## возвращаем id
        return animal_id


    except Exception:

        ## откат при ошибке
        connection.rollback()

        raise


    finally:

        ## закрываем курсор
        if cursor:
            cursor.close()


        ## закрываем соединение
        connection.close()


def get_animals(query=None, limit=24, offset=0, report_type_id=None):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()
        cursor.execute(
            "select * from api.get_animals(%s, %s, %s, %s)",
            (query, limit, offset, report_type_id),
        )
        return cursor.fetchall()
    finally:
        if cursor:
            cursor.close()
        connection.close()


def user_animal_list(user_id):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("select * from api.get_user_animals(%s)", (user_id,))
            return cursor.fetchall()
    finally:
        connection.close()


def update_animal(animal_id, user_id, name, breed, gender_id, age, color, city_id, description):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "select api.update_animal(%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (animal_id, user_id, name, breed, gender_id, age, color, city_id, description),
            )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def get_animal(animal_id):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()
        cursor.execute("select * from api.get_animal(%s)", (animal_id,))
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        connection.close()


def change_animal_status(animal_id, animal_status_id):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()
        cursor.execute(
            "select api.change_animal_status(%s, %s)",
            (animal_id, animal_status_id)
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        connection.close()
