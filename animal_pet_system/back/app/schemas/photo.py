from pydantic import BaseModel

class PhotoCreate(BaseModel):
    animal_id: int
    report_id: int | None = None
    url: str