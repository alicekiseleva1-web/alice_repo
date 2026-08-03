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