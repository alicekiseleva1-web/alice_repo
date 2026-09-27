from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HelpRequestUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    user_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=5000)
    help_category_id: int = Field(gt=0)


class HelpRequestCreate(HelpRequestUpdate):
    shelter_id: int = Field(gt=0)


class HelpRequestStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: int = Field(gt=0)
    help_request_status_id: int = Field(gt=0)


class HelpCategory(BaseModel):
    help_category_id: int
    name: str
    description: str


class HelpStatus(BaseModel):
    help_request_status_id: int
    code: str
    name: str


class HelpRequestResponse(BaseModel):
    request_id: int
    shelter_id: int
    shelter_name: str
    user_id: int
    user_name: str | None
    title: str | None
    description: str | None
    help_request_status_id: int
    status_name: str
    created_at: datetime | None
    updated_at: datetime | None
    help_category_id: int | None
    category_name: str | None
    city_name: str | None
    shelter_address: str | None
    contact_phone: str | None
    contact_email: str | None
    status_code: str
