## действия с рынками

from review import Review

## поиск по городу
def find_by_city(markets, city):
    result = []

    for market in markets:
        if market.city == city:
            result.append(market)

    return result


## поиск по штату
def find_by_state(markets, state):
    result = []

    for market in markets:
        if market.state == state:
            result.append(market)

    return result


## поиск по zip
def find_by_zip(markets, zip_code):
    result = []

    for market in markets:
        if market.zip == zip_code:
            result.append(market)

    return result


## показывать постранично
def show_page(markets, page, page_size):
    start = (page - 1) * page_size
    end = start + page_size

    page_markets = markets[start:end]

    return page_markets


## добавить отзыв

def add_review(market, first_name, last_name, rating, text):

    review = Review(
        first_name,
        last_name,
        rating,
        text
    )

    market.reviews.append(review)


## средний рейтинг
def get_average_rating(market):
    reviews = market.reviews

    if not reviews:
        return 0

    total = 0

    for review in reviews:
        total += review.rating

    return total / len(reviews)


## сортировка по рейтингу
def sort_by_rating(markets, reverse=False):
    return sorted(
        markets,
        key=get_average_rating,
        reverse=reverse
    )


## сортировка рынков
def sort_markets(markets, field, reverse=False):
    return sorted(
        markets,
        key=lambda market: getattr(market, field),
        reverse=reverse
    )


## расчет расстояния между двумя точками
def calculate_distance(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2

    lat1 = float(lat1)
    lon1 = float(lon1)
    lat2 = float(lat2)
    lon2 = float(lon2)

    radius = 3959

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return radius * c


## поиск рынков по расстоянию
def find_by_distance(markets, latitude, longitude, max_distance):
    result = []

    for market in markets:

        market_latitude = market.lat
        market_longitude = market.lon

        if not market_latitude or not market_longitude:
            continue

        try:
            distance = calculate_distance(
                latitude,
                longitude,
                market_latitude,
                market_longitude
            )

        except ValueError:
            continue

        if distance <= max_distance:
            result.append(market)

    return result


## удалить рынок
def delete_market(markets, market):
    markets.remove(market)