from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.db import get_connection
from app.routers import users
from app.routers import animals

app = FastAPI()


## подключение роутеров
app.include_router(users.router)
app.include_router(animals.router)

## глобальный обработчик ошибок
## отдаёт только понятный текст ошибки
@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception):

    error_text = str(exc).split("\n")[0]

    error_text = error_text.replace(
        "ОШИБКА:",
        ""
    ).strip()


    return JSONResponse(
        status_code=500,
        content={
            "error": error_text
        }
    )


## проверка работы сервера
@app.get("/")
def home():

    return {
        "message": "server works"
    }


## проверка подключения к базе
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