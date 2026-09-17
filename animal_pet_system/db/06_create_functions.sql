-- функции проекта
-- регистрация пользователя
-- работа с городами
-- создание животных
-- работа со статусами животных
-- работа с объявлениями
-- сообщения
-- фотографии
-- карточки пользователей и животных
-- карточка приюта сотрудника
-- заявки помощи приютам


-- регистрация пользователя

create or replace function main.register_user(
    first_name_value varchar,
    last_name_value varchar,
    city_id_value integer,
    phone_value varchar,
    email_value varchar,
    password_hash_value varchar,
    is_shelter_value boolean,
    shelter_name_value varchar,
    shelter_address_value text,
    shelter_description_value text
)
returns integer
language plpgsql
as
$$
declare
    user_id_result integer;
    role_id_value integer;
    user_status_id_value integer;
begin

    if exists (
        select 1
        from main.user u
        where u.email = email_value
    ) then
        raise exception 'пользователь с таким email уже существует';
    end if;

    if exists (
        select 1
        from main.user u
        where u.phone = phone_value
    ) then
        raise exception 'пользователь с таким телефоном уже существует';
    end if;

    if is_shelter_value then
        if nullif(trim(shelter_name_value), '') is null then
            raise exception 'укажите название приюта';
        end if;

        if nullif(trim(shelter_address_value), '') is null then
            raise exception 'укажите адрес приюта';
        end if;

        if nullif(trim(shelter_description_value), '') is null then
            raise exception 'добавьте описание приюта';
        end if;
    end if;

    select ur.role_id
    into role_id_value
    from dict.user_role ur
    where ur.code = case
        when is_shelter_value then 'shelter_manager'
        else 'friend'
    end;

    if role_id_value is null then
        raise exception 'не найдено значение роли пользователя';
    end if;

    select us.user_status_id
    into user_status_id_value
    from dict.user_status us
    where us.code = 'active';

    if user_status_id_value is null then
        raise exception 'не найден активный статус пользователя';
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
        first_name_value,
        last_name_value,
        city_id_value,
        phone_value,
        email_value,
        password_hash_value,
        role_id_value,
        user_status_id_value
    )
    returning user_id
    into user_id_result;

    if is_shelter_value then
        insert into main.shelter
        (
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
            user_id_result,
            trim(shelter_name_value),
            city_id_value,
            trim(shelter_address_value),
            phone_value,
            email_value,
            trim(shelter_description_value)
        );
    end if;

    return user_id_result;

end;
$$;


-- api регистрация пользователя

create or replace function api.register_user(
    first_name_value varchar,
    last_name_value varchar,
    city_id_value integer,
    phone_value varchar,
    email_value varchar,
    password_hash_value varchar,
    is_shelter_value boolean,
    shelter_name_value varchar,
    shelter_address_value text,
    shelter_description_value text
)
returns integer
language plpgsql
as
$$
begin

    return main.register_user(
        first_name_value,
        last_name_value,
        city_id_value,
        phone_value,
        email_value,
        password_hash_value,
        is_shelter_value,
        shelter_name_value,
        shelter_address_value,
        shelter_description_value
    );

end;
$$;


-- определение города по FIAS ID из DaData

create or replace function main.resolve_city(
    city_name_value varchar,
    city_fias_id_value varchar
)
returns integer
language plpgsql
as
$$
declare
    resolved_city_id integer;
    legacy_city_count integer;
begin

    if city_name_value is null or btrim(city_name_value) = '' then
        raise exception 'название города не передано';
    end if;

    if city_fias_id_value is null or btrim(city_fias_id_value) = '' then
        raise exception 'FIAS ID города не передан';
    end if;

    select c.city_id
    into resolved_city_id
    from dict.city c
    where c.fias_id = city_fias_id_value;

    if found then
        update dict.city
        set name = city_name_value
        where city_id = resolved_city_id;

        return resolved_city_id;
    end if;

    select
        count(*),
        min(c.city_id)
    into
        legacy_city_count,
        resolved_city_id
    from dict.city c
    where c.fias_id is null
      and lower(btrim(c.name)) = lower(btrim(city_name_value));

    if legacy_city_count = 1 then
        update dict.city
        set
            name = city_name_value,
            fias_id = city_fias_id_value
        where city_id = resolved_city_id;

        return resolved_city_id;
    end if;

    if legacy_city_count > 1 then
        raise exception
            'в справочнике найдено несколько городов с названием %, требуется очистка дублей',
            city_name_value;
    end if;

    insert into dict.city (
        name,
        fias_id
    )
    values (
        city_name_value,
        city_fias_id_value
    )
    on conflict (fias_id)
    do update
    set name = excluded.name
    returning city_id
    into resolved_city_id;

    return resolved_city_id;

end;
$$;


create or replace function api.resolve_city(
    city_name_value varchar,
    city_fias_id_value varchar
)
returns integer
language plpgsql
as
$$
begin

    return main.resolve_city(
        city_name_value,
        city_fias_id_value
    );

end;
$$;


-- данные пользователя для проверки входа

create or replace function main.get_user_credentials(
    email_value varchar
)
returns table
(
    user_id integer,
    password_hash varchar
)
language sql
stable
as
$$
    select
        u.user_id,
        u.password_hash
    from main.user u
    where u.email = email_value;
$$;


-- api данные пользователя для проверки входа

create or replace function api.get_user_credentials(
    email_value varchar
)
returns table
(
    user_id integer,
    password_hash varchar
)
language sql
stable
as
$$
    select *
    from main.get_user_credentials(email_value);
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
    created_at timestamp,
    shelter_name varchar
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
        r.created_at,
        case when rt.code = 'adoption' then s.name else null end

    from main.report r

    join main.animal a
        on a.animal_id = r.animal_id

    join main.user u
        on u.user_id = r.user_id

    join dict.report_type rt
        on rt.report_type_id = r.report_type_id

    join dict.report_status rs
        on rs.report_status_id = r.report_status_id

    left join main.shelter s
        on s.manager_user_id = r.user_id

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
    created_at timestamp,
    shelter_name varchar
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


-- объявления пользователя для профиля

create or replace function main.get_user_reports(
    user_id_value integer
)
returns table
(
    report_id integer,
    animal_id integer,
    animal_name varchar,
    report_type_id integer,
    title varchar,
    description text,
    location text,
    city_id integer,
    report_status_id integer,
    report_status_code varchar,
    created_at timestamp,
    updated_at timestamp,
    closed_at timestamp
)
language plpgsql
as
$$
begin

    if not exists (
        select 1
        from main.user u
        where u.user_id = user_id_value
    ) then
        raise exception 'пользователь с id % не найден', user_id_value;
    end if;

    return query

    select
        r.report_id,
        a.animal_id,
        a.name,
        r.report_type_id,
        r.title,
        r.description,
        r.location,
        a.city_id,
        rs.report_status_id,
        rs.code,
        r.created_at,
        r.updated_at,
        r.closed_at
    from main.report r

    join main.animal a
        on a.animal_id = r.animal_id

    join dict.report_status rs
        on rs.report_status_id = r.report_status_id

    where r.user_id = user_id_value

    order by r.created_at desc;

end;
$$;


create or replace function api.get_user_reports(
    user_id_value integer
)
returns table
(
    report_id integer,
    animal_id integer,
    animal_name varchar,
    report_type_id integer,
    title varchar,
    description text,
    location text,
    city_id integer,
    report_status_id integer,
    report_status_code varchar,
    created_at timestamp,
    updated_at timestamp,
    closed_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_user_reports(user_id_value);

end;
$$;


-- изменение статуса объявления автором

create or replace function main.change_report_status(
    report_id_value integer,
    user_id_value integer,
    report_status_id_value integer
)
returns void
language plpgsql
as
$$
declare
    report_owner_id integer;
    current_status_id integer;
    status_code_value varchar;
begin

    select
        r.user_id,
        r.report_status_id
    into
        report_owner_id,
        current_status_id
    from main.report r
    where r.report_id = report_id_value;

    if not found then
        raise exception 'объявление с id % не найдено', report_id_value;
    end if;

    if report_owner_id <> user_id_value then
        raise exception 'изменить статус объявления может только его автор';
    end if;

    select rs.code
    into status_code_value
    from dict.report_status rs
    where rs.report_status_id = report_status_id_value;

    if status_code_value is null then
        raise exception 'статус объявления с id % не найден', report_status_id_value;
    end if;

    if status_code_value not in ('open', 'closed') then
        raise exception 'недопустимый статус объявления';
    end if;

    if current_status_id = report_status_id_value then
        return;
    end if;

    update main.report r
    set
        report_status_id = report_status_id_value,
        updated_at = now(),
        closed_at = case
            when status_code_value = 'closed' then now()
            else null
        end
    where r.report_id = report_id_value;

end;
$$;


create or replace function api.change_report_status(
    report_id_value integer,
    user_id_value integer,
    report_status_id_value integer
)
returns void
language plpgsql
as
$$
begin

    perform main.change_report_status(
        report_id_value,
        user_id_value,
        report_status_id_value
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

    city_id integer,
    shelter_name varchar,
    city_name varchar
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

        a.city_id,
        case when rt.code = 'adoption' then s.name else null end,
        c.name

    from main.report r

    join main.animal a
        on a.animal_id = r.animal_id

    join main.user u
        on u.user_id = r.user_id

    join dict.report_type rt
        on rt.report_type_id = r.report_type_id

    join dict.report_status rs
        on rs.report_status_id = r.report_status_id

    left join main.shelter s
        on s.manager_user_id = r.user_id

    left join dict.city c
        on c.city_id = a.city_id

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

    city_id integer,
    shelter_name varchar,
    city_name varchar
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


-- каталог животных

create or replace function main.get_animals(
    query_value varchar default null,
    limit_value integer default 24,
    offset_value integer default 0
)
returns table (
    animal_id integer,
    animal_name varchar,
    breed varchar,
    gender_id integer,
    age integer,
    color varchar,
    description text,
    city_id integer,
    city_name varchar,
    owner_name varchar,
    owner_phone varchar,
    photo_url text,
    shelter_name varchar
)
language sql
stable
as $$
    select
        a.animal_id, a.name, a.breed, a.gender_id, a.age,
        a.color, a.description, a.city_id, c.name,
        u.first_name, u.phone,
        (
            select p.url
            from main.photo p
            where p.animal_id = a.animal_id
            order by p.created_at desc nulls last, p.photo_id desc
            limit 1
        ),
        s.name
    from main.animal a
    left join dict.city c on c.city_id = a.city_id
    left join main.user u on u.user_id = a.owner_id
    left join main.shelter s on s.manager_user_id = a.owner_id
    where nullif(btrim(query_value), '') is null
       or position(lower(btrim(query_value)) in lower(coalesce(a.name, ''))) > 0
       or position(lower(btrim(query_value)) in lower(coalesce(a.breed, ''))) > 0
       or position(lower(btrim(query_value)) in lower(coalesce(c.name, ''))) > 0
    order by a.created_at desc nulls last, a.animal_id desc
    limit least(greatest(coalesce(limit_value, 24), 1), 100)
    offset greatest(coalesce(offset_value, 0), 0);
$$;


create or replace function api.get_animals(
    query_value varchar default null,
    limit_value integer default 24,
    offset_value integer default 0
)
returns table (
    animal_id integer,
    animal_name varchar,
    breed varchar,
    gender_id integer,
    age integer,
    color varchar,
    description text,
    city_id integer,
    city_name varchar,
    owner_name varchar,
    owner_phone varchar,
    photo_url text,
    shelter_name varchar
)
language sql
stable
as $$
    select * from main.get_animals(query_value, limit_value, offset_value);
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


-- карточка приюта сотрудника

create or replace function main.get_user_shelter(
    user_id_value integer
)
returns table
(
    shelter_id integer,
    name varchar,
    address text,
    description text,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select
        s.shelter_id,
        s.name,
        s.address,
        s.description,
        s.created_at
    from main.shelter s
    where s.manager_user_id = user_id_value;

end;
$$;


create or replace function api.get_user_shelter(
    user_id_value integer
)
returns table
(
    shelter_id integer,
    name varchar,
    address text,
    description text,
    created_at timestamp
)
language plpgsql
as
$$
begin

    return query

    select *
    from main.get_user_shelter(user_id_value);

end;
$$;


-- редактирование карточки может выполнить только привязанный сотрудник

create or replace function main.update_user_shelter(
    user_id_value integer,
    name_value varchar,
    address_value text,
    description_value text
)
returns integer
language plpgsql
as
$$
declare
    shelter_id_result integer;
begin

    if not exists (
        select 1
        from main.user u
        where u.user_id = user_id_value
    ) then
        raise exception 'пользователь с id % не найден', user_id_value;
    end if;

    if coalesce(btrim(name_value), '') = ''
        or coalesce(btrim(address_value), '') = ''
        or coalesce(btrim(description_value), '') = '' then
        raise exception 'название, адрес и описание приюта обязательны';
    end if;

    select s.shelter_id
    into shelter_id_result
    from main.shelter s
    where s.manager_user_id = user_id_value;

    if not found then
        raise exception 'у пользователя нет привязанного приюта';
    end if;

    update main.shelter s
    set
        name = btrim(name_value),
        address = btrim(address_value),
        description = btrim(description_value)
    where s.shelter_id = shelter_id_result;

    return shelter_id_result;

end;
$$;


create or replace function api.update_user_shelter(
    user_id_value integer,
    name_value varchar,
    address_value text,
    description_value text
)
returns integer
language plpgsql
as
$$
begin

    return main.update_user_shelter(
        user_id_value,
        name_value,
        address_value,
        description_value
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
