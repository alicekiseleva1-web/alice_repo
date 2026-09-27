from contextlib import contextmanager

from fastapi import APIRouter, HTTPException, Query
from psycopg2.errors import InsufficientPrivilege, InvalidParameterValue, NoDataFound

from app.schemas.help_request import (
    HelpCategory, HelpStatus, HelpRequestCreate, HelpRequestUpdate,
    HelpRequestResponse, HelpRequestStatusUpdate,
)
from app.services.help_request_service import (
    create_help_request, help_request_list, change_help_request_status,
    update_help_request, help_categories, help_statuses,
)

router = APIRouter()


@contextmanager
def help_errors():
    try:
        yield
    except NoDataFound as error:
        raise HTTPException(status_code=404, detail=error.diag.message_primary) from error
    except InsufficientPrivilege as error:
        raise HTTPException(status_code=403, detail=error.diag.message_primary) from error
    except InvalidParameterValue as error:
        raise HTTPException(status_code=400, detail=error.diag.message_primary) from error


@router.get("/help_categories", response_model=list[HelpCategory])
def help_categories_route():
    return [dict(zip(("help_category_id", "name", "description"), row)) for row in help_categories()]


@router.get("/help_request_statuses", response_model=list[HelpStatus])
def help_statuses_route():
    return [dict(zip(("help_request_status_id", "code", "name"), row)) for row in help_statuses()]


## создание заявки помощи
## POST /help_request
@router.post("/help_request")
def create_help_request_route(request_data: HelpRequestCreate):
    with help_errors():
        request_id = create_help_request(**request_data.model_dump())
    return {"request_id": request_id}


## список заявок
## GET /help_request_list
@router.get("/help_request_list", response_model=list[HelpRequestResponse])
def help_request_list_route(
    shelter_id: int | None = Query(default=None, gt=0),
    help_request_status_id: int | None = Query(default=None, gt=0),
    help_category_id: int | None = Query(default=None, gt=0),
    include_closed: bool = False,
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    fields = ("request_id", "shelter_id", "shelter_name", "user_id", "user_name",
              "title", "description", "help_request_status_id", "status_name",
              "created_at", "updated_at", "help_category_id", "category_name",
              "city_name", "shelter_address", "contact_phone", "contact_email", "status_code")
    return [
        dict(zip(fields, row)) for row in help_request_list(
            shelter_id, help_request_status_id, help_category_id, include_closed, limit, offset
        )
    ]


@router.patch("/help_request/{request_id}")
def update_help_request_route(request_id: int, data: HelpRequestUpdate):
    with help_errors():
        update_help_request(request_id, **data.model_dump())
    return {"message": "Заявка сохранена"}


## изменение статуса заявки
## PATCH /help_request/{request_id}/status
@router.patch("/help_request/{request_id}/status")
def change_help_request_status_route(request_id: int, data: HelpRequestStatusUpdate):
    with help_errors():
        change_help_request_status(request_id, **data.model_dump())
    return {"message": "Статус заявки изменён"}
