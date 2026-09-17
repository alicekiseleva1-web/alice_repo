-- объявления пользователя для раздела «Профиль»

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
