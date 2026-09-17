-- Каноническая идентификация городов по FIAS ID.
-- Скрипт применяется один раз после 09_dadata_city.sql.

drop index if exists dict.city_fias_id_unique_idx;

alter table dict.city
add constraint city_fias_id_key unique (fias_id);


-- В обычной работе город идентифицируется только по FIAS ID.
-- Поиск по названию нужен лишь для однозначного переноса одной старой записи
-- без FIAS ID. Если таких записей несколько, функция прерывается и не создаёт
-- ещё один дубль.

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
