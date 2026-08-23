from pydantic import BaseModel

class MessageCreate(BaseModel):
    report_id: int
    user_id: int
    text: str