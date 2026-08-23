from datetime import datetime

from pydantic import BaseModel, Field


## модель регистрации пользователя
## описывает данные, которые приходят через API
class UserCreate(BaseModel):

    first_name: str
    last_name: str
    city_id: int
    phone: str
    email: str
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):

    email: str
    password: str = Field(min_length=8, max_length=128)

## для карточки пользователя
class UserDetail(BaseModel):

    user_id: int
    first_name: str
    last_name: str
    phone: str
    email: str
    role_id: int
    user_status_id: int
    city_id: int
    city_name: str
    animals_count: int
    created_at: datetime
