from fastapi import APIRouter
from app.schemas.message import MessageCreate
from app.services.message_service import create_message, message_list

router = APIRouter()

@router.post("/message")
def create_message_route(message_data: MessageCreate):
    message_id = create_message(
        message_data.report_id,
        message_data.user_id,
        message_data.text
    )
    return {
        "message_id": message_id
    }

@router.get("/message_list/{report_id}")
def message_list_route(report_id: int):
    messages = message_list(report_id)
    result = []
    for item in messages:
        result.append(
            {
                "message_id": item[0],
                "user_id": item[1],
                "user_name": item[2],
                "text": item[3],
                "created_at": item[4]
            }
        )
    return result