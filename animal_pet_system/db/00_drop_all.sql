drop schema auth cascade;
drop schema api cascade;
drop schema main cascade;
drop schema dict cascade;

create schema auth;
create schema api;
create schema main;
create schema dict;

truncate table
    main.help_request,
    main.message,
    main.photo,
    main.report,
    main.animal,
    main.shelter,
    main.user
restart identity cascade;