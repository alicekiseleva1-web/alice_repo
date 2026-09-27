from pydantic import BaseModel, Field

class PhotoCreate(BaseModel):
    user_id: int = Field(gt=0)
    animal_id: int
    report_id: int | None = None
    url: str
