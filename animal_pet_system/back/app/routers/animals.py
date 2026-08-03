from fastapi import APIRouter

from app.schemas.animal import AnimalCreate
from app.services.animal_service import create_animal


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