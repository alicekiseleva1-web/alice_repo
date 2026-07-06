## основа

from data import load_markets
from actions import find_by_city, find_by_state, find_by_zip, show_page

markets = load_markets("Export.csv")

while True:

    print()
    print("Что хотите сделать?")
    print("1 - Показать рынки")
    print("2 - Найти по городу")
    print("3 - Найти по штату")
    print ("4 - Найти по ZIP-коду")
    print("0 - Выход")

    choice = input("Ваш выбор: ") ##добавляем выбор для поиска

    if choice == "1":
        page = int(input("Введите страницу: ")) ##спрашиваем страницу
        result = show_page(markets, page, 10) ##ищем рынки постранично, реализовано в actions

    elif choice == "2":
        city = input("Введите город: ") ##спрашиваем город
        result = find_by_city(markets, city) ##ищем рынки по городу, реализовано в actions

    elif choice == "3":
        state = input("Введите штат: ") ## спрашиваем штат
        result = find_by_state(markets, state) ## реализовано в actions

    elif choice == "4":
        zip_code = input("Введите ZIP-код: ")## спрашиваем zip
        result = find_by_zip(markets, zip_code)

        if not zip_code:
            print("ZIP-код не может быть пустым")
            continue
        
        if not result:
            print("Ничего не найдено.")
            continue

    elif choice == "0":
        print ("До свидания!") ## выход
        break

    else:
        print ("Неверный выбор") ## выход
        continue
    
    for number, market in enumerate(result, start=1): ##выводим результат, добавила enumerate, для нумерации всех маркетов
        print("-" * 40)
        print(number)
        print("Название:", market["name"])
        print("Город:", market["city"])
        print("Штат:", market["state"])

    number = int(input("Введите номер рынка (0 - назад): "))

    if number == 0:
        continue

    if number < 1 or number > len(result):
        print("Такого номера нет.")
        continue

    selected = result[number - 1]

    print()
    print("Подробная информация:")
    print("Название:", selected["name"])
    print("Город:", selected["city"])
    print("Штат:", selected["state"])
    print("Индекс:", selected["zip"])
    print("Широта:", selected["lat"])
    print("Долгота:", selected["lon"])