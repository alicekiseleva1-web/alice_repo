from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


## модель создания животного
## описывает данные из API
class AnimalCreate(BaseModel):

    owner_id: int
    name: str
    breed: str
    gender_id: int
    age: int
    color: str
    city_id: int
    description: str


class AnimalStatusUpdate(BaseModel):
    animal_status_id: int


class UserAnimalResponse(BaseModel):
    animal_id: int
    name: str | None
    breed: str | None
    gender_id: int | None
    age: int | None
    color: str | None
    city_id: int | None
    city_name: str | None
    description: str | None


class AnimalUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    user_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=100)
    breed: str = Field(min_length=1, max_length=100)
    gender_id: int = Field(gt=0)
    age: int = Field(ge=0)
    color: str = Field(min_length=1, max_length=100)
    city_id: int = Field(gt=0)
    description: str = Field(min_length=1, max_length=5000)


class AnimalCatalogItem(BaseModel):
    animal_id: int
    animal_name: str | None
    breed: str | None
    gender_id: int | None
    age: int | None
    color: str | None
    description: str | None
    city_id: int | None
    city_name: str | None
    owner_name: str | None
    owner_phone: str | None
    photo_url: str | None
    shelter_name: str | None


class AnimalDetail(BaseModel):
    animal_id: int
    animal_name: str
    breed: str
    gender_id: int
    age: int
    color: str
    description: str
    animal_status_id: int
    status_updated_at: datetime
    city_id: int
    city_name: str
    owner_id: int
    owner_name: str
    owner_phone: str
    created_at: datetime
