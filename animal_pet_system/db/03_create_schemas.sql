-- Создание схем проекта без удаления существующих объектов и данных.
-- Повторный запуск этого файла не обновляет таблицы и SQL-функции.

create schema if not exists auth;
create schema if not exists api;
create schema if not exists main;
create schema if not exists dict;
