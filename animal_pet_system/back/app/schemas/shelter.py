from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ShelterDetail(BaseModel):

    shelter_id: int
    name: str
    address: str
    description: str
    created_at: datetime


class ShelterUpdate(BaseModel):

    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1, max_length=1000)

    @field_validator("name", "address", "description")
    @classmethod
    def validate_not_blank(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("поле не может состоять только из пробелов")

        return value
