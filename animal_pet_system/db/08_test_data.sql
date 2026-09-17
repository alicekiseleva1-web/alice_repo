-- город для тестовых данных

insert into dict.city (
    name,
    fias_id
)
values
(
    'Москва',
    '0c5b2444-70a0-4932-980c-b4dc0d3f02b5'
);


-- пользователи

insert into main.user (
    first_name,
    last_name,
    city_id,
    phone,
    email,
    password_hash,
    role_id,
    user_status_id
)
values
(
    'иван',
    'иванов',
    1,
    '+79991112233',
    'ivan@example.com',
    'test_hash',
    1,
    1
),
(
    'мария',
    'петрова',
    1,
    '+79994445566',
    'maria@example.com',
    'test_hash',
    2,
    1
);


-- животные

insert into main.animal (
    owner_id,
    name,
    breed,
    gender_id,
    age,
    color,
    city_id,
    description,
    animal_status_id
)
values
(
    1,
    'барсик',
    'дворовый',
    1,
    3,
    'рыжий',
    1,
    'добрый кот',
    (select status_id from dict.animal_status where code = 'active')
),
(
    1,
    'бим',
    'лабрадор',
    1,
    5,
    'черный',
    1,
    'был в синем ошейнике',
    (select status_id from dict.animal_status where code = 'active')
);


-- приют

insert into main.shelter (
    manager_user_id,
    name,
    city_id,
    address,
    phone,
    email,
    description
)
values
(
    2,
    'добрые лапы',
    1,
    'ул. центральная, 10',
    '+79990001122',
    'shelter@example.com',
    'городской приют'
);


-- объявления

insert into main.report (
    user_id,
    animal_id,
    report_type_id,
    report_status_id,
    title,
    description,
    location
)
values
(
    1,
    1,
    1,
    1,
    'пропал кот',
    'убежал вечером',
    'парк победы'
),
(
    1,
    2,
    2,
    2,
    'найдена собака',
    'найдена возле магазина',
    'ул. ленина'
);


-- фотографии

insert into main.photo (
    animal_id,
    report_id,
    url
)
values
(
    1,
    1,
    'https://example.com/cat.jpg'
),
(
    2,
    2,
    'https://example.com/dog.jpg'
);


-- сообщения

insert into main.message (
    report_id,
    user_id,
    text
)
values
(
    1,
    2,
    'кажется, видел вашего кота'
),
(
    2,
    1,
    'спасибо за информацию'
);


-- заявки помощи приюту

insert into main.help_request (
    shelter_id,
    user_id,
    title,
    description,
    help_request_status_id
)
values
(
    1,
    2,
    'нужен корм',
    'требуется сухой корм для собак',
    1
);
