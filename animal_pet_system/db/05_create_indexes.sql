create unique index uq_user_email
    on main.user(email);

create unique index uq_user_phone
    on main.user(phone);

create index idx_animal_city
    on main.animal(city_id);

create index idx_report_status
    on main.report(status_id);

create index idx_report_animal
    on main.report(animal_id);

create index idx_message_report
    on main.message(report_id);