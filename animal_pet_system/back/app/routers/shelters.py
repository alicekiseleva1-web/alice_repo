from fastapi import APIRouter, HTTPException

from app.schemas.shelter import ShelterDetail, ShelterUpdate
from app.services.shelter_service import get_user_shelter, update_user_shelter


router = APIRouter()


@router.get("/user/{user_id}/shelter", response_model=ShelterDetail | None)
def user_shelter_route(user_id: int):

    shelter = get_user_shelter(user_id)

    if shelter is None:
        return None

    return {
        "shelter_id": shelter[0],
        "name": shelter[1],
        "address": shelter[2],
        "description": shelter[3],
        "created_at": shelter[4],
    }


@router.patch("/user/{user_id}/shelter", response_model=ShelterDetail)
def update_user_shelter_route(user_id: int, shelter_data: ShelterUpdate):

    update_user_shelter(
        user_id,
        shelter_data.name,
        shelter_data.address,
        shelter_data.description,
    )

    shelter = get_user_shelter(user_id)

    if shelter is None:
        raise HTTPException(status_code=404, detail="приют пользователя не найден")

    return {
        "shelter_id": shelter[0],
        "name": shelter[1],
        "address": shelter[2],
        "description": shelter[3],
        "created_at": shelter[4],
    }
