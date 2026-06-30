## основа

from data import load_markets
from actions import find_by_city

markets = load_markets("Export.csv")

city = input("Введите город: ") ##спрашиваем город

result = find_by_city(markets, city) ##ищем рынки, реализовано в actions

print(result) ##выводим результат