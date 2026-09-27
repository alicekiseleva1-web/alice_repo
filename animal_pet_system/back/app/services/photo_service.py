from app.db import get_connection


def check_photo_owner(animal_id, user_id):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("select api.check_photo_owner(%s,%s)", (animal_id, user_id))
    finally:
        connection.close()


def save_animal_photo(animal_id, user_id, url, public_id=None, photo_id=None, report_id=None):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("select * from api.save_animal_photo(%s,%s,%s,%s,%s,%s)",
                           (animal_id, user_id, url, public_id, photo_id, report_id))
            result = cursor.fetchone()
        connection.commit()
        return result
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def delete_animal_photo(animal_id, user_id, photo_id):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("select api.delete_animal_photo(%s,%s,%s)", (animal_id, user_id, photo_id))
            public_id = cursor.fetchone()[0]
        connection.commit()
        return public_id
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

def add_photo(animal_id, report_id, url):
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            select api.add_photo(%s, %s, %s)
            """,
            (
                animal_id,
                report_id,
                url
            )
        )
        photo_id = cursor.fetchone()[0]
        connection.commit()
        return photo_id
    except Exception:
        connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        connection.close()

def photo_list(animal_id):
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            select *
            from api.get_photos(%s)
            """,
            (
                animal_id,
            )
        )
        photos = cursor.fetchall()
        return photos
    finally:
        if cursor:
            cursor.close()
        connection.close()
