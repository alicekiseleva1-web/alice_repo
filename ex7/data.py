## файл для работы с csv
## предполагаемая логика: открываем csv -> читаем -> делаем список маркетов
## загружаем csv
import csv ## модуль csv
from market import create_markets

def load_markets(path): 
    markets = [] ## сюда кладём рынки

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f) ## диктридер превращает цсв в словари
        for row in reader:
            market = create_markets( ## делаем из каждого рынка объект
                fmid=row["FMID"],
                name=row["MarketName"],
                city=row["city"],
                state=row["State"],
                zip_code=row["zip"],
                lat=row["y"],
                lon=row["x"]
            )
            markets.append(market) ## добавляем в конец списка
    return markets