## основа

from data import load_markets
from actions import find_by_city, find_by_state

markets = load_markets("Export.csv")

while True:

    choice = input("По чему ищем? город/штат: ") ##добавляем выбор для поиска

    if choice == "город":
        city = input("Введите город: ") ##спрашиваем город
        result = find_by_city(markets, city) ##ищем рынки по городу, реализовано в actions

    elif choice == "штат":
        state = input("Введите штат: ")
        result = find_by_state(markets, state)

    else:
        result = []
    
    print(result) ##выводим результат