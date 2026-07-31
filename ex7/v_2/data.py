## файл для работы с csv
## предполагаемая логика: открываем csv -> читаем -> делаем список маркетов

import csv
from market import Market


## загружаем csv
def load_markets(path):

    markets = []

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:

            market = Market(
                name=row["MarketName"],
                city=row["city"],
                state=row["State"],
                zip_code=row["zip"],
                latitude=row["y"],
                longitude=row["x"]
            )

            markets.append(market)

    return markets