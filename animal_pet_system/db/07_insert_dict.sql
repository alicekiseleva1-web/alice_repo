-- пол

insert into dict.gender(code)
values
('male'),
('female'),
('unknown');


-- роли пользователей

insert into dict.user_role(code)
values
('friend'),
('shelter_manager'),
('patrol'),
('admin');


-- статусы животных

insert into dict.animal_status(code)
values
('active'),
('lost'),
('found'),
('shelter'),
('adopted');


-- типы объявлений

insert into dict.report_type(code)
values
('lost'),
('found'),
('help');


-- статусы пользователей

insert into dict.user_status
(
    code,
    name
)
values
('active', 'активный'),
('blocked', 'заблокирован'),
('deleted', 'удален');


-- статусы заявок помощи

insert into dict.help_request_status
(
    code,
    name
)
values
('open', 'открыта'),
('in_progress', 'в работе'),
('closed', 'закрыта');


-- статусы объявлений

insert into dict.report_status(code)
values
('open'),
('closed');
