from app.db import get_connection

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