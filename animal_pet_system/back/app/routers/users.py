from fastapi import APIRouter

from app.schemas.user import UserCreate
from app.services.user_service import register_user


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
        user.password_hash
    )


    ## возвращаем результат
    return {
        "user_id": user_id
    }