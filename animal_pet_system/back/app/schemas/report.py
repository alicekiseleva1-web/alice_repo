from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    user_id: int
    animal_id: int
    report_type_id: int
    title: str
    description: str
    location: str


class ReportUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    user_id: int = Field(gt=0)
    report_type_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=5000)
    location: str = Field(min_length=1, max_length=1000)


class ReportResponse(BaseModel):
    report_id: int
    animal_id: int
    animal_name: str
    user_id: int
    user_name: str
    report_type_id: int
    title: str
    description: str
    location: str
    city_id: int
    created_at: datetime
    shelter_name: str | None


class ReportDetail(BaseModel):
    report_id: int
    report_title: str
    report_description: str
    report_type_id: int
    report_status_id: int
    report_created_at: datetime
    animal_id: int
    animal_name: str
    breed: str
    age: int
    color: str
    animal_status_id: int
    user_id: int
    user_name: str
    phone: str
    city_id: int
    shelter_name: str | None
    city_name: str | None


class ReportStatusUpdate(BaseModel):
    user_id: int
    report_status_id: int


class UserReportResponse(BaseModel):
    report_id: int
    animal_id: int
    animal_name: str
    report_type_id: int
    title: str
    description: str
    location: str
    city_id: int
    report_status_id: int
    report_status_code: str
    created_at: datetime
    updated_at: datetime | None
    closed_at: datetime | None
