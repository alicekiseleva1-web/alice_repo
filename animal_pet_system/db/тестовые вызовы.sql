select api.register_user(
    'алиса',
    'киселёва',
    1,
    '+79997776655',
    'alice.kiss@example.com',
    '$2b$12$Q8M1Wv7iA6zK4eN8uJ5F0eGmK3pL9xR2tV7yH1sC4nD8aB6qP2zXW'
);

select api.create_animal(
    3, --ид юзера
    'чмоня',
    'двортерьер',
    2,
    2,
    'серая',
    1,
    'домашняя кошка'
);

select api.change_animal_status(
    1, --ид животного
    'lost'
); 


select api.create_report(
    3,
    1,
    'lost',
    'пропал кот',
    'убежал вечером возле парка',
    'парк победы'
);