from fastapi import APIRouter, HTTPException

from app.schemas.user import UserCreate, UserLogin
from app.services.user_service import login_user, register_user

from app.schemas.user import UserDetail
from app.services.user_service import get_user

## роутер пользователей
router = APIRouter()


## регистрация пользователя
## POST /register
@router.post("/register")
def create_user(user: UserCreate):


    ## передаём данные в сервис
    user_id = register_user(
        user.first_name,
        user.last_name,
        user.city_id,
        user.phone,
        user.email,
        user.password
    )


    ## возвращаем результат
    return {
        "user_id": user_id
    }


@router.post("/login")
def login_route(user: UserLogin):

    user_id = login_user(
        user.email,
        user.password
    )

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="неверный email или пароль"
        )

    return {
        "user_id": user_id
    }


## получить пользователя
## GET /user

## одно объявление
## GET /report/{report_id}
@router.get("/user/{user_id}", response_model=UserDetail)
def user_route(user_id: int):

    item = get_user(user_id)

    if item is None:

        raise HTTPException(status_code=404, detail="пользователь не найден")

    return {

        "user_id": item[0],
        "first_name": item[1],
        "last_name": item[2],
        "phone": item[3],
        "email": item[4],
        "role_id": item[5],
        "user_status_id": item[6],
        "city_id": item[7],
        "city_name": item[8],
        "animals_count": item[9],
        "created_at": item[10]
    }
