-- в разработке
-- регистрация юзера на main

create or replace function main.register_user(
    first_name varchar,
    last_name varchar,
    city_id integer,
    phone varchar,
    email varchar,
    password_hash varchar
)
returns integer
language plpgsql
as
$$
declare
    user_id integer;
begin

    insert into main.user
    (
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
        first_name,
        last_name,
        city_id,
        phone,
        email,
        password_hash,
        (
            select role_id
            from dict.user_role
            where code = 'FRIEND'
        ),
        (
            select user_status_id
            from dict.user_status
            where code = 'ACTIVE'
        )
    )
    returning main.user.user_id
    into user_id;

    return user_id;

end;
$$;

-- функция для апишки

create or replace function api.register_user(
    first_name varchar,
    last_name varchar,
    city_id integer,
    phone varchar,
    email varchar,
    password_hash varchar
)
returns integer
language plpgsql
as
$$
begin

    return main.register_user(
        first_name,
        last_name,
        city_id,
        phone,
        email,
        password_hash
    );

end;
$$;

-- регаем животного

create or replace function main.create_animal(
    owner_id integer,
    name varchar,
    breed varchar,
    gender_id integer,
    age integer,
    color varchar,
    city_id integer,
    description text
)
returns integer
language plpgsql
as
$$
declare
    animal_id integer;
begin

    insert into main.animal
    (
        owner_id,
        name,
        breed,
        gender_id,
        age,
        color,
        city_id,
        description,
        status_id,
        status_updated_at
    )
    values
    (
        owner_id,
        name,
        breed,
        gender_id,
        age,
        color,
        city_id,
        description,
        (
            select status_id
            from dict.animal_status
            where code = 'ACTIVE'
        ),
        now()
    )
    returning main.animal.animal_id
    into animal_id;

    return animal_id;

end;
$$;

create or replace function api.create_animal(
    owner_id integer,
    name varchar,
    breed varchar,
    gender_id integer,
    age integer,
    color varchar,
    city_id integer,
    description text
)
returns integer
language plpgsql
as
$$
begin

    return main.create_animal(
        owner_id,
        name,
        breed,
        gender_id,
        age,
        color,
        city_id,
        description
    );

end;
$$;

-- смена статусов животных

create or replace function main.change_animal_status(
    animal_id_value integer,
    status_code varchar
)
returns void
language plpgsql
as
$$
declare
    new_status_id integer;
begin

    select s.status_id
    into new_status_id
    from dict.animal_status s
    where s.code = status_code;

    if new_status_id is null then
        raise exception 'статус % не найден', status_code;
    end if;


    update main.animal a
    set
        status_id = new_status_id,
        status_updated_at = now()
    where a.animal_id = animal_id_value;


    if not found then
        raise exception 'животное с id % не найдено', animal_id_value;
    end if;

end;
$$;

-- для апишки

create or replace function api.change_animal_status(
    animal_id_value integer,
    status_code varchar
)
returns void
language plpgsql
as
$$
begin

    perform main.change_animal_status(
        animal_id_value,
        status_code
    );

end;
$$;

-- создаём объявление

create or replace function main.create_report(
    user_id_value integer,
    animal_id_value integer,
    report_type_code varchar,
    title varchar,
    description text,
    location text
)
returns integer
language plpgsql
as
$$
declare
    report_id_value integer;
    report_type_id_value integer;
    report_status_id_value integer;
begin

    select rt.report_type_id
    into report_type_id_value
    from dict.report_type rt
    where rt.code = report_type_code;

    if report_type_id_value is null then
        raise exception 'тип объявления % не найден', report_type_code;
    end if;


    select rs.report_status_id
    into report_status_id_value
    from dict.report_status rs
    where rs.code = 'open';

    if report_status_id_value is null then
        raise exception 'статус объявления open не найден';
    end if;


    insert into main.report
    (
        user_id,
        animal_id,
        type_id,
        status_id,
        title,
        description,
        location
    )
    values
    (
        user_id_value,
        animal_id_value,
        report_type_id_value,
        report_status_id_value,
        title,
        description,
        location
    )
    returning report_id
    into report_id_value;


    return report_id_value;

end;
$$;

--для апи
create or replace function api.create_report(
    user_id_value integer,
    animal_id_value integer,
    report_type_code varchar,
    title varchar,
    description text,
    location text
)
returns integer
language plpgsql
as
$$
begin

    return main.create_report(
        user_id_value,
        animal_id_value,
        report_type_code,
        title,
        description,
        location
    );

end;
$$;