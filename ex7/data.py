## файл для работы с csv
## предполагаемая логика: открываем csv -> читаем -> делаем список маркетов
## загружаем csv

import csv ## модуль csv

def load_markets(path): 
    markets = [] ## сюда кладём рынки

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f) ## диктридер превращает цсв в словари
        for row in reader:
            print(row["MarketName"])
            break

    return markets

load_markets("Export.csv")

