insert into dict.gender(code)
values
('male'),
('female'),
('unknown');


insert into dict.user_role(code)
values
('friend'),
('shelter_manager'),
('patrol'),
('admin');


insert into dict.animal_status(code)
values
('active'),
('lost'),
('found'),
('shelter'),
('adopted');


insert into dict.report_type(code)
values
('lost'),
('found'),
('help');


insert into dict.city (name)
values
('москва'),
('санкт-петербург'),
('казань'),
('екатеринбург'),
('новосибирск');


insert into dict.user_status
(
    code,
    name
)
values
('active', 'Активный'),
('blocked', 'Заблокирован'),
('deleted', 'Удален');


insert into dict.help_request_status
(
    code,
    name
)
values
(
    'open',
    'Открыта'
),
(
    'in_progress',
    'В работе'
),
(
    'closed',
    'Закрыта'
);


insert into dict.report_status(code)
values
('open'),
('closed');