from pydantic import BaseModel


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