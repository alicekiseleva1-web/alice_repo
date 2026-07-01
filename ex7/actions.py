##действия с рынками

## поиск по городу
def find_by_city(markets, city):
    result = []

    for market in markets:
        if market["city"] == city:
            result.append(market)

    return result

## поиск по штату
def find_by_state(markets, state):
    result = []

    for market in markets:
        if market["state"] == state:
            result.append(market)

    return result