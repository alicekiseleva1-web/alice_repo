-- Ручная проверка SQL-функций в DBeaver.
-- Скрипт выполняется после создания таблиц, функций и тестовых данных.
-- Запросы из раздела «Проверки без изменения данных» безопасны для повторного запуска.
-- В разделе «Проверки с изменением данных» транзакция всегда завершается ROLLBACK.


-- Проверки без изменения данных

-- Справочники
select * from dict.city order by city_id;
select * from dict.gender order by gender_id;
select * from dict.animal_status order by status_id;
select * from dict.report_type order by report_type_id;
select * from dict.report_status order by report_status_id;
select * from dict.help_request_status order by help_request_status_id;

-- Состояние справочника городов.
-- В норме новые города всегда имеют FIAS ID.
select
    city_id,
    name,
    fias_id
from dict.city
order by city_id;

-- Старые записи без FIAS ID.
select
    city_id,
    name
from dict.city
where fias_id is null
order by city_id;

-- Названия, которые встречаются больше одного раза.
select
    lower(btrim(name)) as normalized_name,
    count(*) as cities_count,
    array_agg(city_id order by city_id) as city_ids
from dict.city
group by lower(btrim(name))
having count(*) > 1
order by normalized_name;


-- Карточки пользователя и животного
select * from api.get_user(1);
select * from api.get_animal(1);


-- Список и карточка объявления
select * from api.get_reports();
select * from api.get_reports(
    report_type_id_value => 1,
    city_id_value => 1,
    limit_value => 20,
    offset_value => 0
);
select * from api.get_report(1);


-- Сообщения, фотографии и заявки помощи
select * from api.get_messages(1);
select * from api.get_photos(1);
select * from api.get_help_requests();
select * from api.get_help_requests(
    shelter_id_value => 1,
    help_request_status_id_value => 1
);


-- Проверки с изменением данных
-- При необходимости замени идентификаторы на существующие значения из своей БД.

begin;

-- Изменение статуса животного
select api.change_animal_status(
    animal_id_value => 1,
    animal_status_id_value => 2
);

-- Добавление сообщения в открытое объявление
select api.create_message(
    report_id_value => 1,
    user_id_value => 1,
    message_text => 'Тестовое сообщение'
);

-- Добавление фотографии, связанной с животным и его объявлением
select api.add_photo(
    animal_id_value => 1,
    report_id_value => 1,
    photo_url => 'https://example.com/test-photo.jpg'
);

-- Создание заявки помощи
select api.create_help_request(
    shelter_id_value => 1,
    user_id_value => 1,
    title_value => 'Тестовая заявка',
    description_value => 'Проверка SQL-функции'
);

rollback;


-- Регистрацию и вход проверяй через Swagger:
-- POST /register и POST /login.
-- Пароль хэшируется в Python-приложении, поэтому передавать обычный пароль
-- напрямую в api.register_user нельзя.
