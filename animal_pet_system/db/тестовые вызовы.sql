select api.register_user(
    'алиса',
    'киселёва',
    1,
    '+79997776655',
    'alice.kiss@example.com',
    '$2b$12$Q8M1Wv7iA6zK4eN8uJ5F0eGmK3pL9xR2tV7yH1sC4nD8aB6qP2zXW'
);

select api.create_animal(
    3, --ид юзера
    'чмоня',
    'двортерьер',
    2,
    2,
    'серая',
    1,
    'домашняя кошка'
);

select api.change_animal_status(
    1, --ид животного
    2 -- id статуса lost из dict.animal_status
); 


select api.create_report(
    3,
    1,
    1, -- id типа lost из dict.report_type
    'пропал кот',
    'убежал вечером возле парка',
    'парк победы'
);
--тесты объявлений
--все открытые
select *
from api.get_reports();

--только потерянные
select *
from api.get_reports(
    1 -- id типа lost из dict.report_type
);

--по городу + лимит

select *
from api.get_reports(
    1, -- id типа lost из dict.report_type
    1,
    10,
    0
);

--существующее объявление

select *
from api.get_reports();

--смотрим его

select *
from api.get_report(1);

--добавить сообщение
select api.create_message(
    1,
    4,
    'видел похожего кота возле парка'
);

--добавить фотку
select api.add_photo(
    1,
    1,
    'https://example.com/barcik.jpg'
);

select *
from api.get_photos(1);

select *
from api.get_user(3);

активировать окружение (из папки back)
source venv/Scripts/activate

запустить
uvicorn app.main:app --reload

разнесла логику:
routers - отвечает за HTTP/API уровень
schemas — модели входных и выходных данных (структура данных)
service - доступ к бд

тесты апи:
POST /register
{
  "first_name": "Анна",
  "last_name": "Иванова",
  "city_id": 1,
  "phone": "+79990000001",
  "email": "anna_test@example.com",
  "password_hash": "test_hash_123"
}

POST /animals

{
  "owner_id": 5,
  "name": "Барсик",
  "breed": "Британская короткошерстная",
  "gender_id": 1,
  "age": 3,
  "color": "Серый",
  "city_id": 1,
  "description": "Спокойный и ласковый кот"
}

POST /report

{
  "user_id": 4,
  "animal_id": 2,
  "report_type_id": 1,
  "title": "Ищем дом для Барсика",
  "description": "Добрый и спокойный кот ищет новый дом.",
  "location": "Москва"
}

POST /message
{
  "report_id": 1,
  "user_id": 5,
  "text": "Здравствуйте! Хотел бы узнать подробнее."
}

post /photo
{
  "animal_id": 3,
  "report_id": 1,
  "url": "https://example.com/cat.jpg"
}
