-- справочники

create table dict.city (
    city_id serial primary key,
    name varchar(100) not null
);


create table dict.animal_status (
    status_id serial primary key,
    code varchar(50) not null unique
);


create table dict.report_type (
    report_type_id serial primary key,
    code varchar(50) not null unique
);


create table dict.user_role (
    role_id serial primary key,
    code varchar(50) not null unique
);


create table dict.gender (
    gender_id serial primary key,
    code varchar(50) not null unique
);

create table dict.help_request_status
(
    help_request_status_id serial primary key,
    code varchar(50) not null unique,
    name varchar(100) not null
);

-- статусы юзеров
create table dict.user_status
(
    user_status_id serial primary key,
    code varchar(50) not null unique,
    name varchar(100) not null
);

create table dict.report_status (
    report_status_id serial primary key,
    code varchar(50) not null unique
);

-- пользователи

create table main.user (
    user_id serial primary key,
    first_name varchar(100),
    last_name varchar(100),
    city_id integer references dict.city(city_id),
    phone varchar(20),
    email varchar(255) unique not null,
    password_hash varchar(255),
    role_id integer references dict.user_role(role_id),
    created_at timestamp default now(),
    user_status_id integer not null references dict.user_status(user_status_id)
);


-- животные

create table main.animal (
    animal_id serial primary key,
    owner_id integer references main.user(user_id),
    name varchar(100),
    breed varchar(100),
    gender_id integer references dict.gender(gender_id),
    age integer,
    color varchar(100),
    city_id integer references dict.city(city_id),
    description text,
    status_id integer references dict.animal_status(status_id),
    created_at timestamp default now(),
    status_updated_at timestamp default now()
);


-- приюты

create table main.shelter (
    shelter_id serial primary key,
    name varchar(200) not null,
    city_id integer references dict.city(city_id),
    address text,
    phone varchar(20),
    email varchar(255),
    description text,
    created_at timestamp default now()
);


-- объявления

create table main.report (
    report_id serial primary key,
    user_id integer references main.user(user_id),
    animal_id integer references main.animal(animal_id),
    type_id integer references dict.report_type(report_type_id),
    status_id integer references dict.animal_status(status_id),
    title varchar(255),
    description text,
    location text,
    created_at timestamp default now(),
    updated_at timestamp,
    closed_at timestamp
);


-- фотографии

create table main.photo (
    photo_id serial primary key,
    animal_id integer references main.animal(animal_id),
    report_id integer references main.report(report_id),
    url text not null,
    created_at timestamp default now()
);


-- сообщения

create table main.message (
    message_id serial primary key,
    report_id integer references main.report(report_id),
    user_id integer references main.user(user_id),
    text text not null,
    created_at timestamp default now()
);


-- заявки помощи приютам

create table main.help_request (
    request_id serial primary key,
    shelter_id integer references main.shelter(shelter_id),
    user_id integer references main.user(user_id),
    title varchar(255),
    description text,
    status_id integer not null references dict.help_request_status(help_request_status_id),
    created_at timestamp default now(),
    updated_at timestamp
);

