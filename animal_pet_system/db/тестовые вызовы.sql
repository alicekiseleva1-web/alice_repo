-- Ручная проверка SQL-функций в DBeaver.
-- Скрипт выполняется после создания таблиц, функций и тестовых данных.
-- Использовать отдельную тестовую БД с наполнением 07 и 08, не рабочую базу.
-- Запросы из раздела «Проверки без изменения данных» безопасны для повторного запуска.
-- В разделе «Проверки с изменением данных» транзакция всегда завершается ROLLBACK.
-- Значения serial-последовательностей после ROLLBACK не возвращаются назад.
-- При ошибке внутри транзакции перед следующими проверками требуется выполнить ROLLBACK вручную.


-- Проверки без изменения данных

-- Справочники
select * from dict.city order by city_id;
select * from dict.gender order by gender_id;
select * from dict.animal_status order by status_id;
select * from dict.report_type order by report_type_id;
select * from dict.report_status order by report_status_id;
select * from dict.help_request_status order by help_request_status_id;
select * from api.get_help_categories();
select * from api.get_help_statuses();

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
-- Это кандидаты на разбор, а не список для автоматического удаления:
-- разные населённые пункты могут иметь одинаковые названия и разные FIAS ID.
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
select * from api.get_user_animals(1);
select * from api.get_user_shelter(2);
select * from api.get_animals(
    query_value => 'бар',
    limit_value => 24,
    offset_value => 0,
    report_type_id_value => 1
);


-- Список и карточка объявления
select * from api.get_reports();
select * from api.get_reports(
    report_type_id_value => 1,
    city_id_value => 1,
    limit_value => 20,
    offset_value => 0
);
select * from api.get_report(1);
select * from api.get_user_reports(1);


-- Сообщения, фотографии и заявки помощи
select * from api.get_messages(1);
select * from api.get_photos(1);
select * from api.get_help_requests();
select * from api.get_help_requests(
    shelter_id_value => 1,
    help_request_status_id_value => 1,
    help_category_id_value => null,
    include_closed_value => false,
    limit_value => 24,
    offset_value => 0
);


-- Проверки с изменением данных
-- Идентификаторы соответствуют данным скрипта 08; для другого тестового набора требуется их замена.

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
-- Только SQL-запись с тестовым URL: обращений к Cloudinary здесь нет.
select * from api.save_animal_photo(
    animal_id_value => 1,
    user_id_value => 1,
    url_value => 'https://example.com/test-photo.jpg',
    public_id_value => null,
    report_id_value => 1,
    photo_id_value => null
);

-- Создание заявки помощи
select api.create_help_request(
    shelter_id_value => 1,
    user_id_value => 2,
    title_value => 'Тестовая заявка',
    description_value => 'Проверка SQL-функции',
    help_category_id_value => (select help_category_id from dict.help_category where code = 'supplies')
);

-- Редактирование и статус существующей тестовой заявки.
select api.update_help_request(
    request_id_value => 1,
    user_id_value => 2,
    title_value => 'Нужна помощь волонтёров',
    description_value => 'Проверка изменения категории',
    help_category_id_value => (select help_category_id from dict.help_category where code = 'hands')
);
select api.change_help_request_status(
    request_id_value => 1,
    help_request_status_id_value => (select help_request_status_id from dict.help_request_status where code = 'in_progress'),
    user_id_value => 2
);
select * from api.get_help_requests(shelter_id_value => 1, include_closed_value => true);

-- Обновление личных данных не меняет роль и пароль.
select api.update_user_profile(
    user_id_value => 1,
    first_name_value => 'Иван',
    last_name_value => 'Иванов',
    phone_value => '+79991112233',
    email_value => 'ivan@example.com',
    city_id_value => 1
);
select * from api.get_user(1);

rollback;


-- Регистрация и вход проверяются через Swagger:
-- POST /register и POST /login.
-- Пароль хэшируется в Python-приложении, поэтому передавать обычный пароль
-- напрямую в api.register_user нельзя.
