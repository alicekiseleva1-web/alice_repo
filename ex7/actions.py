##действия с рынками

## поиск по городу
def find_by_city(markets, city):
    result = []

    for market in markets:
        if market["city"] == city:
            result.append(market)

    return result