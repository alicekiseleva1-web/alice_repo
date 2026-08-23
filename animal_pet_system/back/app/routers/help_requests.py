from fastapi import APIRouter

from app.schemas.help_request import HelpRequestCreate

from app.services.help_request_service import (
    create_help_request,
    help_request_list,
    change_help_request_status
)

router = APIRouter()


## создание заявки помощи
## POST /help_request

@router.post("/help_request")
def create_help_request_route(
    request_data: HelpRequestCreate
):

    request_id = create_help_request(
        request_data.shelter_id,
        request_data.user_id,
        request_data.title,
        request_data.description
    )

    return {
        "request_id": request_id
    }


## список заявок
## GET /help_request_list

@router.get("/help_request_list")
def help_request_list_route(
    shelter_id: int | None = None,
    help_request_status_id: int | None = None
):

    requests = help_request_list(
        shelter_id,
        help_request_status_id
    )

    result = []

    for item in requests:

        result.append(
            {
                "request_id": item[0],
                "shelter_id": item[1],
                "shelter_name": item[2],
                "user_id": item[3],
                "user_name": item[4],
                "title": item[5],
                "description": item[6],
                "help_request_status_id": item[7],
                "status_name": item[8],
                "created_at": item[9],
                "updated_at": item[10]
            }
        )

    return result


## изменение статуса заявки
## PATCH /help_request/{request_id}/status

@router.patch("/help_request/{request_id}/status")
def change_help_request_status_route(
    request_id: int,
    help_request_status_id: int
):

    change_help_request_status(
        request_id,
        help_request_status_id
    )

    return {
        "message": "статус заявки изменен"
    }
