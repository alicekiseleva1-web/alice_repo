create index idx_animal_city
    on main.animal(city_id);

create index idx_animal_status
    on main.animal(animal_status_id);

create index idx_report_status
    on main.report(report_status_id);

create index idx_report_type
    on main.report(report_type_id);

create index idx_report_animal
    on main.report(animal_id);

create index idx_report_user
    on main.report(user_id);

create index idx_message_report
    on main.message(report_id);

create index idx_help_request_shelter
    on main.help_request(shelter_id);

create index idx_help_request_status
    on main.help_request(help_request_status_id);