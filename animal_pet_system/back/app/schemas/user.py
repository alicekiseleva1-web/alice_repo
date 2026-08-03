from pydantic import BaseModel


## модель регистрации пользователя
## описывает данные, которые приходят через API
class UserCreate(BaseModel):

    first_name: str
    last_name: str
    city_id: int
    phone: str
    email: str
    password_hash: str