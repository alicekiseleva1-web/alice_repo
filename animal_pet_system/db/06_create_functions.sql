-- функции проекта
-- регистрация пользователя
-- создание животных
-- работа со статусами животных
-- работа с объявлениями
-- сообщения
-- фотографии
-- карточки пользователей и животных
-- заявки помощи приютам


-- регистрация пользователя

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

    if exists (
        select 1
        from main.user u
        where u.email = register_user.email
    ) then
        raise exception 'пользователь с таким email уже существует.';
    end if;

    if exists (
        select 1
        from main.user u
        where u.phone = register_user.phone
    ) then
        raise exception 'пользователь с таким телефоном уже существует.';
    end if;

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
            where code = 'friend'
        ),

        (
            select user_status_id
            from dict.user_status
            where code = 'active'
        )
    )
    returning main.user.user_id
    into user_id;

    return user_id;

end;
$$;


-- api регистрация пользователя

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


-- создание животного

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
        animal_status_id,
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
            where code = 'active'
        ),

        now()
    )
    returning main.animal.animal_id
    into animal_id;

    return animal_id;

end;
$$;


-- api создание животного

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


-- изменение статуса животного

create or replace function main.change_animal_status(
    animal_id_value integer,
    animal_status_id_value integer
)
returns void
language plpgsql
as
$$
begin

    if not exists (
        select 1
        from dict.animal_status
        where status_id = animal_status_id_value
    ) then
        raise exception 'статус животного с id % не найден',
            animal_status_id_value;
    end if;


    update main.animal

    set
        animal_status_id = animal_status_id_value,
        status_updated_at = now()

    where animal_id = animal_id_value;


    if not found then
        raise exception 'животное с id % не найдено',
            animal_id_value;
    end if;

end;
$$;


-- api изменение статуса животного

create or replace function api.change_animal_status(
    animal_id_value integer,
    animal_status_id_value integer
)
returns void
language plpgsql
as
$$
begin

    perform main.change_animal_status(
        animal_id_value,
        animal_status_id_value
    );

end;
$$;

-- создание объявления

create or replace function main.create_report(
    user_id_value integer,
    animal_id_value integer,
    report_type_id_value integer,
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
    report_status_id_value integer;
begin

    select rs.report_status_id
    into report_status_id_value
    from dict.report_status rs
    where rs.code = 'open';

    if report_status_id_value is null then
        raise exception 'статус объявления open не найден';
    end if;

    if not exists (
        select 1
        from dict.report_type rt
        where rt.report_type_id = report_type_id_value
    ) then
        raise exception 'тип объявления с id % не найден',
            report_type_id_value;
    end if;

    insert into main.report
    (
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


-- api создание объявления

create or replace function api.create_report(
    user_id_value integer,
    animal_id_value integer,
    report_type_id_value integer,
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
        report_type_id_value,
        title,
        description,
        location
    );

end;
$$;


-- закрытие объявления

create or replace function main.close_report(
    report_id_value integer
)
returns void
language plpgsql
as
$$
declare
    closed_status_id integer;
begin

    select rs.report_status_id
    into closed_status_id
    from dict.report_status rs
    where rs.code = 'closed';

    if closed_status_id is null then
        raise exception 'статус объявления closed не найден';
    end if;

    update main.report r
    set
        report_status_id = closed_status_id,
        updated_at = now(),
        closed_at = now()
    where r.report_id = report_id_value;

    if not found then
        raise exception 'объявление с id % не найдено', report_id_value;
    end if;

end;
$$;


-- api закрытие объявления

create or replace function api.close_report(
    report_id_value integer
)
returns void
language plpgsql
as
$$
begin

    perform main.close_report(
        report_id_value
    );

end;
$$;


-- получение списка объявлений

create or replace function main.get_reports(
    report_type_id_value integer default null,
    city_id_value integer default null,
    limit_value integer default 20,
    offset_value integer default 0
)
returns table
(
    report_id integer,
    animal_id integer,
    animal_name varchar,
    user_id integer,
    user_name varchar,
    report_type_id integer,
    title varchar,
    description text,
    location text,
    city_id integer,
    created_at timestamp
)
language plpgsql
as
$$
begin

    if limit_value > 100 then
        limit_value := 100;
    end if;

    if limit_value < 1 then
        limit_value := 20;
    end if;

    if offset_value < 0 then
        offset_value := 0;
    end if;

    return query

    select
        r.report_id,
        a.animal_id,
        a.name,
        u.user_id,
        u.first_name,
        r.report_type_id,
        r.title,
        r.description,
        r.location,
        a.city_id,
        r.created_at

    from main.report r

    join main.animal a
        on a.animal_id = r.animal_id

    join main.user u
        on u.user_id = r.user_id

    join dict.report_type rt
        on rt.report_type_id = r.report_type_id

    join dict.report_status rs
        on rs.report_status_id = r.report_status_id

    where rs.code = 'open'

    and (
        report_type_id_value is null
        or rt.report_type_id = report_type_id_value
    )

    and (
        city_id_value is null
        or a.city_id = city_id_value
    )

    order by r.created_at desc

    limit limit_value
    offset offset_value;

end;
$$;


-- api список объявлений

create or replace function api.get_reports(
    report_type_id_value integer default null,
    city_id_value integer default null,
    limit_value integer default 20,
    offset_value integer default 0
)
returns table
(
    report_id integer,
    animal_id integer,
    animal_name varchar,
    user_id integer,
    user_name varchar,
    report_type_id integer,
    title varchar,
    description text,
    location text,
    city_id integer,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_reports(
        report_type_id_value,
        city_id_value,
        limit_value,
        offset_value
    );

end;
$$;


-- просмотр объявления

create or replace function main.get_report(
    report_id_value integer
)
returns table
(
    report_id integer,
    report_title varchar,
    report_description text,
    report_type_id integer,
    report_status_id integer,
    report_created_at timestamp,

    animal_id integer,
    animal_name varchar,
    breed varchar,
    age integer,
    color varchar,
    animal_status_id integer,

    user_id integer,
    user_name varchar,
    phone varchar,

    city_id integer
)
language plpgsql
as
$$
begin

    return query

    select
        r.report_id,
        r.title,
        r.description,
        r.report_type_id,
        r.report_status_id,
        r.created_at,

        a.animal_id,
        a.name,
        a.breed,
        a.age,
        a.color,
        a.animal_status_id,

        u.user_id,
        u.first_name,
        u.phone,

        a.city_id

    from main.report r

    join main.animal a
        on a.animal_id = r.animal_id

    join main.user u
        on u.user_id = r.user_id

    join dict.report_type rt
        on rt.report_type_id = r.report_type_id

    join dict.report_status rs
        on rs.report_status_id = r.report_status_id

    left join dict.animal_status ast
        on ast.status_id = a.animal_status_id

    where r.report_id = report_id_value;

end;
$$;


-- api просмотр объявления

create or replace function api.get_report(
    report_id_value integer
)
returns table
(
    report_id integer,
    report_title varchar,
    report_description text,
    report_type_id integer,
    report_status_id integer,
    report_created_at timestamp,

    animal_id integer,
    animal_name varchar,
    breed varchar,
    age integer,
    color varchar,
    animal_status_id integer,

    user_id integer,
    user_name varchar,
    phone varchar,

    city_id integer
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_report(
        report_id_value
    );

end;
$$;


-- создание сообщения

create or replace function main.create_message(
    report_id_value integer,
    user_id_value integer,
    message_text text
)
returns integer
language plpgsql
as
$$
declare
    message_id_value integer;
    report_status_code varchar;
begin

    select rs.code
    into report_status_code

    from main.report r

    join dict.report_status rs
        on rs.report_status_id = r.report_status_id

    where r.report_id = report_id_value;

    if report_status_code is null then
        raise exception 'объявление с id % не найдено', report_id_value;
    end if;

    if report_status_code <> 'open' then
        raise exception 'нельзя отправить сообщение в закрытое объявление';
    end if;

    if not exists (
        select 1
        from main.user u
        where u.user_id = user_id_value
    ) then
        raise exception 'пользователь с id % не найден', user_id_value;
    end if;

    insert into main.message
    (
        report_id,
        user_id,
        text
    )
    values
    (
        report_id_value,
        user_id_value,
        message_text
    )
    returning message_id
    into message_id_value;

    return message_id_value;

end;
$$;


-- api создание сообщения

create or replace function api.create_message(
    report_id_value integer,
    user_id_value integer,
    message_text text
)
returns integer
language plpgsql
as
$$
begin

    return main.create_message(
        report_id_value,
        user_id_value,
        message_text
    );

end;
$$;


-- получение сообщений

create or replace function main.get_messages(
    report_id_value integer
)
returns table
(
    message_id integer,
    user_id integer,
    user_name varchar,
    text text,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select
        m.message_id,
        u.user_id,
        u.first_name,
        m.text,
        m.created_at

    from main.message m

    join main.user u
        on u.user_id = m.user_id

    where m.report_id = report_id_value

    order by m.created_at asc;

end;
$$;


-- api получение сообщений

create or replace function api.get_messages(
    report_id_value integer
)
returns table
(
    message_id integer,
    user_id integer,
    user_name varchar,
    text text,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_messages(
        report_id_value
    );

end;
$$;


-- добавление фотографии

create or replace function main.add_photo(
    animal_id_value integer,
    report_id_value integer,
    photo_url text
)
returns integer
language plpgsql
as
$$
declare
    photo_id_value integer;
begin

    if not exists (
        select 1
        from main.animal a
        where a.animal_id = animal_id_value
    ) then
        raise exception 'животное с id % не найдено', animal_id_value;
    end if;

    if report_id_value is not null
       and not exists (
            select 1
            from main.report r
            where r.report_id = report_id_value
       )
    then
        raise exception 'объявление с id % не найдено', report_id_value;
    end if;

    if report_id_value is not null
       and not exists (
            select 1
            from main.report r
            where r.report_id = report_id_value
              and r.animal_id = animal_id_value
       )
    then
        raise exception 'объявление с id % не относится к животному с id %',
            report_id_value,
            animal_id_value;
    end if;

    insert into main.photo
    (
        animal_id,
        report_id,
        url
    )
    values
    (
        animal_id_value,
        report_id_value,
        photo_url
    )
    returning photo_id
    into photo_id_value;

    return photo_id_value;

end;
$$;


-- api добавление фотографии

create or replace function api.add_photo(
    animal_id_value integer,
    report_id_value integer,
    photo_url text
)
returns integer
language plpgsql
as
$$
begin

    return main.add_photo(
        animal_id_value,
        report_id_value,
        photo_url
    );

end;
$$;


-- получение фотографий

create or replace function main.get_photos(
    animal_id_value integer
)
returns table
(
    photo_id integer,
    animal_id integer,
    report_id integer,
    url text,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select
        p.photo_id,
        p.animal_id,
        p.report_id,
        p.url,
        p.created_at

    from main.photo p

    where p.animal_id = animal_id_value

    order by p.created_at desc;

end;
$$;


-- api получение фотографий

create or replace function api.get_photos(
    animal_id_value integer
)
returns table
(
    photo_id integer,
    animal_id integer,
    report_id integer,
    url text,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_photos(
        animal_id_value
    );

end;
$$;


-- карточка животного

create or replace function main.get_animal(
    animal_id_value integer
)
returns table
(
    animal_id integer,
    animal_name varchar,
    breed varchar,
    gender_id integer,
    age integer,
    color varchar,
    description text,

    animal_status_id integer,
    status_updated_at timestamp,

    city_id integer,
    city_name varchar,

    owner_id integer,
    owner_name varchar,
    owner_phone varchar,

    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select
        a.animal_id,
        a.name,
        a.breed,
        a.gender_id,
        a.age,
        a.color,
        a.description,

        a.animal_status_id,
        a.status_updated_at,

        c.city_id,
        c.name,

        u.user_id,
        u.first_name,
        u.phone,

        a.created_at

    from main.animal a

    left join dict.gender g
        on g.gender_id = a.gender_id

    left join dict.animal_status ast
        on ast.status_id = a.animal_status_id

    left join dict.city c
        on c.city_id = a.city_id

    left join main.user u
        on u.user_id = a.owner_id

    where a.animal_id = animal_id_value;

end;
$$;


-- api карточка животного

create or replace function api.get_animal(
    animal_id_value integer
)
returns table
(
    animal_id integer,
    animal_name varchar,
    breed varchar,
    gender_id integer,
    age integer,
    color varchar,
    description text,

    animal_status_id integer,
    status_updated_at timestamp,

    city_id integer,
    city_name varchar,

    owner_id integer,
    owner_name varchar,
    owner_phone varchar,

    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_animal(
        animal_id_value
    );

end;
$$;


-- карточка пользователя

create or replace function main.get_user(
    user_id_value integer
)
returns table
(
    user_id integer,
    first_name varchar,
    last_name varchar,
    phone varchar,
    email varchar,

    role_id integer,
    user_status_id integer,

    city_id integer,
    city_name varchar,

    animals_count bigint,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select
        u.user_id,
        u.first_name,
        u.last_name,
        u.phone,
        u.email,

        u.role_id,
        u.user_status_id,

        c.city_id,
        c.name,

        count(a.animal_id),

        u.created_at

    from main.user u

    left join dict.city c
        on c.city_id = u.city_id

    left join main.animal a
        on a.owner_id = u.user_id

    where u.user_id = user_id_value

    group by
        u.user_id,
        u.first_name,
        u.last_name,
        u.phone,
        u.email,
        u.role_id,
        u.user_status_id,
        c.city_id,
        c.name,
        u.created_at;

end;
$$;

-- api карточка пользователя

create or replace function api.get_user(
    user_id_value integer
)
returns table
(
    user_id integer,
    first_name varchar,
    last_name varchar,
    phone varchar,
    email varchar,

    role_id integer,
    user_status_id integer,

    city_id integer,
    city_name varchar,

    animals_count bigint,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_user(
        user_id_value
    );

end;
$$;


-- заявки помощи приютам

create or replace function main.create_help_request(
    shelter_id_value integer,
    user_id_value integer,
    title_value varchar,
    description_value text
)
returns integer
language plpgsql
as
$$
declare
    request_id_value integer;
    status_id_value integer;
begin

    select hrs.help_request_status_id
    into status_id_value
    from dict.help_request_status hrs
    where hrs.code = 'open';

    if status_id_value is null then
        raise exception 'статус заявки open не найден';
    end if;

    if not exists (
        select 1
        from main.shelter s
        where s.shelter_id = shelter_id_value
    ) then
        raise exception 'приют с id % не найден', shelter_id_value;
    end if;

    if not exists (
        select 1
        from main.user u
        where u.user_id = user_id_value
    ) then
        raise exception 'пользователь с id % не найден', user_id_value;
    end if;

    insert into main.help_request
    (
        shelter_id,
        user_id,
        title,
        description,
        help_request_status_id
    )
    values
    (
        shelter_id_value,
        user_id_value,
        title_value,
        description_value,
        status_id_value
    )
    returning request_id
    into request_id_value;

    return request_id_value;

end;
$$;


-- api создание заявки помощи

create or replace function api.create_help_request(
    shelter_id_value integer,
    user_id_value integer,
    title_value varchar,
    description_value text
)
returns integer
language plpgsql
as
$$
begin

    return main.create_help_request(
        shelter_id_value,
        user_id_value,
        title_value,
        description_value
    );

end;
$$;


-- список заявок помощи

create or replace function main.get_help_requests(
    shelter_id_value integer default null,
    help_request_status_id_value integer default null
)
returns table
(
    request_id integer,
    shelter_id integer,
    shelter_name varchar,
    user_id integer,
    user_name varchar,
    title varchar,
    description text,
    help_request_status_id integer,
    status_name varchar,
    created_at timestamp,
    updated_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select
        hr.request_id,
        s.shelter_id,
        s.name as shelter_name,
        u.user_id,
        u.first_name as user_name,
        hr.title,
        hr.description,
        hr.help_request_status_id,
        hrs.name as status_name,
        hr.created_at,
        hr.updated_at

    from main.help_request hr

    join main.shelter s
        on s.shelter_id = hr.shelter_id

    join main.user u
        on u.user_id = hr.user_id

    join dict.help_request_status hrs
        on hrs.help_request_status_id = hr.help_request_status_id

    where
        (
            shelter_id_value is null
            or hr.shelter_id = shelter_id_value
        )
        and (
            help_request_status_id_value is null
            or hr.help_request_status_id = help_request_status_id_value
        )

    order by hr.created_at desc;

end;
$$;


-- api список заявок помощи

create or replace function api.get_help_requests(
    shelter_id_value integer default null,
    help_request_status_id_value integer default null
)
returns table
(
    request_id integer,
    shelter_id integer,
    shelter_name varchar,
    user_id integer,
    user_name varchar,
    title varchar,
    description text,
    help_request_status_id integer,
    status_name varchar,
    created_at timestamp,
    updated_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_help_requests(
        shelter_id_value,
        help_request_status_id_value
    );

end;
$$;


-- изменение статуса заявки

create or replace function main.change_help_request_status(
    request_id_value integer,
    help_request_status_id_value integer
)
returns void
language plpgsql
as
$$
begin

    if not exists (
        select 1
        from dict.help_request_status
        where help_request_status_id = help_request_status_id_value
    ) then
        raise exception 'статус заявки с id % не найден',
            help_request_status_id_value;
    end if;

    update main.help_request
    set
        help_request_status_id = help_request_status_id_value,
        updated_at = now()
    where request_id = request_id_value;

    if not found then
        raise exception 'заявка с id % не найдена',
            request_id_value;
    end if;

end;
$$;


-- api изменение статуса заявки

create or replace function api.change_help_request_status(
    request_id_value integer,
    help_request_status_id_value integer
)
returns void
language plpgsql
as
$$
begin

    perform main.change_help_request_status(
        request_id_value,
        help_request_status_id_value
    );

end;
$$;
