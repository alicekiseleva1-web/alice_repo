## основа

from data import load_markets
from actions import (
    find_by_city,
    find_by_state,
    find_by_zip,
    find_by_distance,
    show_page,
    add_review,
    get_average_rating,
    sort_markets,
    sort_by_rating,
    delete_market
)

## загружаем рынки
markets = load_markets("Export.csv")

## меню
while True:

    print()
    print("Что хотите сделать?")
    print("1 - Показать рынки")
    print("2 - Найти по городу")
    print("3 - Найти по штату")
    print("4 - Найти по ZIP-коду")
    print("5 - Найти по расстоянию")
    print("6 - Сортировать рынки")
    print("7 - Удалить рынок")
    print("0 - Выход")

    choice = input("Ваш выбор: ")

    ## показать рынки постранично
    if choice == "1":
        page = int(input("Введите страницу: "))
        result = show_page(markets, page, 10)

    ## поиск рынка по городу
    elif choice == "2":
        city = input("Введите город: ")
        result = find_by_city(markets, city)

    ## поиск рынка по штату
    elif choice == "3":
        state = input("Введите штат: ")
        result = find_by_state(markets, state)

    ## поиск рынка по ZIP
    elif choice == "4":
        zip_code = input("Введите ZIP-код: ")
        result = find_by_zip(markets, zip_code)

        if not zip_code:
            print("ZIP-код не может быть пустым")
            continue

        if not result:
            print("Ничего не найдено.")
            continue

    ## поиск по расстоянию
    elif choice == "5":

        while True:
            try:
                latitude = float(input("Введите широту: "))

                if -90 <= latitude <= 90:
                    break

                print("Широта должна быть от -90 до 90.")

            except ValueError:
                print("Введите число.")

        while True:
            try:
                longitude = float(input("Введите долготу: "))

                if -180 <= longitude <= 180:
                    break

                print("Долгота должна быть от -180 до 180.")

            except ValueError:
                print("Введите число.")

        while True:
            try:
                max_distance = float(
                    input("Введите максимальное расстояние в милях: ")
                )

                if max_distance > 0:
                    break

                print("Расстояние должно быть больше 0.")

            except ValueError:
                print("Введите число.")

        result = find_by_distance(
            markets,
            latitude,
            longitude,
            max_distance
        )

        if not result:
            print("Ничего не найдено.")
            continue

    ## сортировка рынков
    elif choice == "6":

        print()
        print("По чему сортировать?")
        print("1 - По названию")
        print("2 - По городу")
        print("3 - По штату")
        print("4 - По рейтингу")

        sort_choice = input("Ваш выбор: ")

        if sort_choice == "1":
            result = sort_markets(markets, "name")

        elif sort_choice == "2":
            result = sort_markets(markets, "city")

        elif sort_choice == "3":
            result = sort_markets(markets, "state")

        elif sort_choice == "4":

            print()
            print("1 - От меньшего к большему")
            print("2 - От большего к меньшему")

            rating_choice = input("Ваш выбор: ")

            if rating_choice == "1":
                result = sort_by_rating(markets)

            elif rating_choice == "2":
                result = sort_by_rating(
                    markets,
                    reverse=True
                )

            else:
                print("Неверный выбор")
                continue

        else:
            print("Неверный выбор")
            continue

    ## удалить рынок
    elif choice == "7":

        for number, market in enumerate(markets, start=1):
            print("-" * 40)
            print(number)
            print("Название:", market["name"])
            print("Город:", market["city"])
            print("Штат:", market["state"])

        number = int(
            input("Введите номер рынка для удаления (0 - назад): ")
        )

        if number == 0:
            continue

        if number < 1 or number > len(markets):
            print("Такого номера нет.")
            continue

        selected = markets[number - 1]

        print()
        print("Вы выбрали:")
        print("Название:", selected["name"])
        print("Город:", selected["city"])
        print("Штат:", selected["state"])

        confirm = input("Удалить этот рынок? (да/нет): ")

        if confirm.lower() == "да":
            delete_market(markets, selected)
            print("Рынок удалён.")
        else:
            print("Удаление отменено.")

        continue

    ## выход
    elif choice == "0":
        print("До свидания!")
        break

    else:
        print("Неверный выбор")
        continue

    ## выводим найденные рынки
    for number, market in enumerate(result, start=1):
        print("-" * 40)
        print(number)
        print("Название:", market["name"])
        print("Город:", market["city"])
        print("Штат:", market["state"])

    number = int(
        input("Введите номер рынка (0 - назад): ")
    )

    ## возврат в главное меню
    if number == 0:
        continue

    ## проверка номера рынка
    if number < 1 or number > len(result):
        print("Такого номера нет.")
        continue

    selected = result[number - 1]

    ## подробная информация о рынке
    print()
    print("Подробная информация:")
    print("Название:", selected["name"])
    print("Город:", selected["city"])
    print("Штат:", selected["state"])
    print("Индекс:", selected["zip"])
    print("Широта:", selected["lat"])
    print("Долгота:", selected["lon"])

    ## средний рейтинг
    average_rating = get_average_rating(selected)

    print("Средний рейтинг:", average_rating)

    ## работа с отзывами
    print()
    print("1 - Добавить отзыв")
    print("2 - Посмотреть отзывы")
    print("0 - Назад")

    review_choice = input("Ваш выбор: ")

    ## добавить отзыв
    if review_choice == "1":

        first_name = input("Введите имя: ")
        last_name = input("Введите фамилию: ")

        while True:

            try:
                rating = int(
                    input("Введите рейтинг от 1 до 5: ")
                )

                if 1 <= rating <= 5:
                    break

                print("Рейтинг должен быть от 1 до 5.")

            except ValueError:
                print("Введите целое число от 1 до 5.")

        text = input("Введите текст отзыва: ")

        add_review(
            selected,
            first_name,
            last_name,
            rating,
            text
        )

        print("Отзыв добавлен!")

    ## просмотр отзывов
    elif review_choice == "2":

        if not selected["reviews"]:
            print("Отзывов пока нет.")

        else:

            for review in selected["reviews"]:

                print()
                print(
                    review["first_name"],
                    review["last_name"]
                )
                print("Рейтинг:", review["rating"])
                print("Отзыв:", review["text"])