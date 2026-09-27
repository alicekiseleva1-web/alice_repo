-- Полное удаление схем проекта и содержащихся в них данных.
-- Не входит в первичную установку или обычный запуск приложения.
-- Выполняется только для намеренного сброса БД после резервного копирования.
-- CASCADE также удаляет зависимые объекты, в том числе из других схем.
-- Для создания структуры после сброса используются скрипты 03–07.

begin;

drop schema if exists auth cascade;
drop schema if exists api cascade;
drop schema if exists main cascade;
drop schema if exists dict cascade;

commit;
