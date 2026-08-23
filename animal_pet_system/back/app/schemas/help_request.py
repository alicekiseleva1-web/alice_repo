from pydantic import BaseModel


class HelpRequestCreate(BaseModel):
    shelter_id: int
    user_id: int
    title: str
    description: str