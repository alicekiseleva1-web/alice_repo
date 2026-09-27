from fastapi import APIRouter, HTTPException, Query
from psycopg2.errors import InsufficientPrivilege, InvalidParameterValue, NoDataFound

from app.schemas.animal import AnimalCatalogItem, AnimalCreate, AnimalDetail, AnimalStatusUpdate
from app.schemas.animal import AnimalUpdate, UserAnimalResponse
from app.services.animal_service import (
    change_animal_status,
    create_animal,
    get_animal,
    get_animals,
    update_animal,
    user_animal_list,
)


## роутер животных
router = APIRouter()


## создание животного
## POST /animals
@router.post("/animals")
def create_animal_route(animal: AnimalCreate):


    ## вызываем сервис
    animal_id = create_animal(
        animal.owner_id,
        animal.name,
        animal.breed,
        animal.gender_id,
        animal.age,
        animal.color,
        animal.city_id,
        animal.description
    )


    ## возвращаем результат
    return {
        "animal_id": animal_id
    }


@router.get("/animals", response_model=list[AnimalCatalogItem])
def animal_list_route(
    query: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    report_type_id: int | None = Query(default=None, ge=1),
):
    return [
        {
            "animal_id": item[0],
            "animal_name": item[1],
            "breed": item[2],
            "gender_id": item[3],
            "age": item[4],
            "color": item[5],
            "description": item[6],
            "city_id": item[7],
            "city_name": item[8],
            "owner_name": item[9],
            "owner_phone": item[10],
            "photo_url": item[11],
            "shelter_name": item[12],
        }
        for item in get_animals(query, limit, offset, report_type_id)
    ]


@router.get("/user/{user_id}/animals", response_model=list[UserAnimalResponse])
def user_animals_route(user_id: int):
    fields = ("animal_id", "name", "breed", "gender_id", "age", "color", "city_id", "city_name", "description")
    return [dict(zip(fields, row)) for row in user_animal_list(user_id)]


@router.patch("/animals/{animal_id}")
def update_animal_route(animal_id: int, data: AnimalUpdate):
    try:
        update_animal(animal_id, **data.model_dump())
    except NoDataFound as error:
        raise HTTPException(status_code=404, detail=error.diag.message_primary) from error
    except InsufficientPrivilege as error:
        raise HTTPException(status_code=403, detail=error.diag.message_primary) from error
    except InvalidParameterValue as error:
        raise HTTPException(status_code=400, detail=error.diag.message_primary) from error
    return {"message": "Данные животного сохранены"}


@router.get("/animals/{animal_id}", response_model=AnimalDetail)
def get_animal_route(animal_id: int):
    item = get_animal(animal_id)

    if item is None:
        raise HTTPException(status_code=404, detail="животное не найдено")

    return {
        "animal_id": item[0],
        "animal_name": item[1],
        "breed": item[2],
        "gender_id": item[3],
        "age": item[4],
        "color": item[5],
        "description": item[6],
        "animal_status_id": item[7],
        "status_updated_at": item[8],
        "city_id": item[9],
        "city_name": item[10],
        "owner_id": item[11],
        "owner_name": item[12],
        "owner_phone": item[13],
        "created_at": item[14],
    }


@router.patch("/animals/{animal_id}/status")
def change_animal_status_route(
    animal_id: int,
    status_data: AnimalStatusUpdate,
):
    change_animal_status(animal_id, status_data.animal_status_id)
    return {"message": "статус животного изменен"}
