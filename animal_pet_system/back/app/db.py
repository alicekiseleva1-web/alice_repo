import psycopg2


def get_connection():
    connection = psycopg2.connect(
        host="localhost",
        database="animal_help",
        user="postgres",
        password="65542",
        port="5432"
    )

    return connection