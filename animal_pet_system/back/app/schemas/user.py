from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


## модель регистрации пользователя
## описывает данные, которые приходят через API
class UserCreate(BaseModel):

    first_name: str
    last_name: str
    city_id: int
    phone: str
    email: str
    password: str = Field(min_length=8, max_length=128)
    is_shelter: bool = False
    shelter_name: str | None = Field(default=None, max_length=200)
    shelter_address: str | None = Field(default=None, max_length=500)
    shelter_description: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_shelter_fields(self):
        if not self.is_shelter:
            return self

        shelter_fields = (
            self.shelter_name,
            self.shelter_address,
            self.shelter_description,
        )

        if not all(value and value.strip() for value in shelter_fields):
            raise ValueError(
                "для регистрации приюта заполните название, адрес и описание"
            )

        return self


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=7, max_length=20, pattern=r"^\+?[0-9() -]+$")
    email: str = Field(max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    city_id: int = Field(gt=0)


class PasswordChange(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.new_password != self.confirm_password:
            raise ValueError("новые пароли не совпадают")
        if self.new_password == self.current_password:
            raise ValueError("новый пароль должен отличаться от старого")
        return self


class UserLogin(BaseModel):

    email: str
    password: str = Field(min_length=8, max_length=128)


class CitySuggestRequest(BaseModel):

    query: str = Field(min_length=3, max_length=100)


class CitySuggestion(BaseModel):

    city_name: str
    city_fias_id: str
    label: str


class CityResolveRequest(BaseModel):

    city_name: str = Field(min_length=1, max_length=100)
    city_fias_id: str = Field(min_length=36, max_length=36)


class CityResolveResponse(BaseModel):

    city_id: int
    city_name: str


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
