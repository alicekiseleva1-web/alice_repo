-- интеграция городов с DaData

alter table dict.city
add column if not exists fias_id varchar(36);

create unique index if not exists city_fias_id_unique_idx
on dict.city(fias_id)
where fias_id is not null;


-- находит город по ФИАС ID или создаёт новую запись

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
begin

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

    select c.city_id
    into resolved_city_id
    from dict.city c
    where c.fias_id is null
      and lower(c.name) = lower(city_name_value)
    order by c.city_id
    limit 1;

    if found then
        update dict.city
        set
            name = city_name_value,
            fias_id = city_fias_id_value
        where city_id = resolved_city_id;

        return resolved_city_id;
    end if;

    insert into dict.city (
        name,
        fias_id
    )
    values (
        city_name_value,
        city_fias_id_value
    )
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
