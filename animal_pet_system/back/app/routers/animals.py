from fastapi import APIRouter, HTTPException

from app.schemas.animal import AnimalCreate, AnimalDetail, AnimalStatusUpdate
from app.services.animal_service import (
    change_animal_status,
    create_animal,
    get_animal,
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
