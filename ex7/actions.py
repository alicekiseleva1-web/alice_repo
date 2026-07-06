## действия с рынками

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

## поиск по zip
def find_by_zip(markets, zip_code):
    result = []

    for market in markets:
        if market["zip"] == zip_code:
            result.append(market)

    return result

## показывать постранично
def show_page(markets, page, page_size):
    start = (page - 1) * page_size
    end = start + page_size

    page_markets = markets[start:end]

    return page_markets