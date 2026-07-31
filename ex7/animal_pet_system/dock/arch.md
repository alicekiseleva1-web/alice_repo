Черновик с набросками, не забыть убрать из отслеживания

Стек проекта

бэк: Python + Django + Django REST Framework

Используем:

Django — основа серверного приложения
Django REST Framework (DRF) — создание REST API
Django ORM — работа с базой данных
JWT Authentication — авторизация через токены (мб сервис авторизации лайтовый сделать, менять логопасс на токен)

БД: Postgresql
Структура БД:

схемы:

main
api
dict

таблицы схемы dict:
dict.city - справочник городов
структура таблицы:
city_id

dict.animal_status
dict.report_type
dict.user_role
dict.gender


БД: PostgreSQL
Структура БД:

схема api:
функции для апи
1. post разместить объявление о пропаже
2. get получить инфу о животном
3. post для редактирования инфы
какие ещё?
надо подумать


схема main:
основные таблицы, функции и хп

таблицы:
1. пользователи
main.user 
структура:
user_id (pk)
first_name
last_name
city
phone
email
password_hash
role
created_at
status

роли:
FRIEND
SHELTER_MANAGER
PATROL
ADMIN

2. животные
main.animal

структура:
animal_id
name
breed
gender
age
color
city
description
photo_url
status_id
created_at

4. справочник сити (может в схему справочников вынести?):
city
может подвязать сюда что-то типа дададаты?

5. справочник статус (может в схему справочников вынести?)
Статусы:
LOST
FOUND
SHELTER
ADOPTED

4. приюты
main.shelter
структура:

shelter_id
name
address
phone
email
description
created_at

5. объявления
report_id
user_id
animal_id

type
title
description
location
date_created
date_updated
date_closed
status_id

6. message
message_id
report_id
user_id
text
created_at

7. photo

8. Заявки помощи приюту
main.help_requests

