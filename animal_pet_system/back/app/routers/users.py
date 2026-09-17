from fastapi import APIRouter, HTTPException

from app.schemas.user import (
    CityResolveRequest,
    CityResolveResponse,
    CitySuggestRequest,
    CitySuggestion,
    UserCreate,
    UserLogin,
)
from app.services.dadata_service import suggest_cities
from app.services.user_service import login_user, register_user, resolve_city

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
        user.password,
        user.is_shelter,
        user.shelter_name,
        user.shelter_address,
        user.shelter_description,
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


@router.post("/cities/suggest", response_model=list[CitySuggestion])
def city_suggest_route(city_data: CitySuggestRequest):

    try:
        return suggest_cities(city_data.query)

    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.post("/cities/resolve", response_model=CityResolveResponse)
def city_resolve_route(city_data: CityResolveRequest):

    city_id = resolve_city(
        city_data.city_name,
        city_data.city_fias_id,
    )

    return {
        "city_id": city_id,
        "city_name": city_data.city_name,
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
