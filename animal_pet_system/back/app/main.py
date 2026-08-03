from fastapi import FastAPI
from app.db import get_connection

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "server works"
    }


@app.get("/db-test")
def db_test():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        "select current_database();"
    )

    result = cursor.fetchone()

    cursor.close()
    connection.close()

    return {
        "database": result[0]
    }