## тесты для actions.py

from actions import (
    find_by_city,
    find_by_state,
    find_by_zip,
    show_page,
    add_review,
    get_average_rating,
    sort_markets,
    sort_by_rating,
    calculate_distance,
    find_by_distance,
    delete_market
)


## тестовые данные
markets = [
    {
        "name": "Market A",
        "city": "Chicago",
        "state": "Illinois",
        "zip": "60601",
        "lat": "41.8781",
        "lon": "-87.6298",
        "reviews": [
            {
                "first_name": "Anna",
                "last_name": "Smith",
                "rating": 5,
                "text": "Отличный рынок"
            }
        ]
    },
    {
        "name": "Market B",
        "city": "Boston",
        "state": "Massachusetts",
        "zip": "02108",
        "lat": "42.3601",
        "lon": "-71.0589",
        "reviews": []
    },
    {
        "name": "Market C",
        "city": "Chicago",
        "state": "Illinois",
        "zip": "60602",
        "lat": "41.8819",
        "lon": "-87.6278",
        "reviews": [
            {
                "first_name": "John",
                "last_name": "Brown",
                "rating": 3,
                "text": "Нормально"
            }
        ]
    }
]


## тест поиска по городу
def test_find_by_city():

    result = find_by_city(markets, "Chicago")

    assert len(result) == 2


## тест поиска по штату
def test_find_by_state():

    result = find_by_state(markets, "Illinois")

    assert len(result) == 2


## тест поиска по ZIP-коду
def test_find_by_zip():

    result = find_by_zip(markets, "60601")

    assert len(result) == 1
    assert result[0]["name"] == "Market A"


## тест постраничного вывода
def test_show_page():

    result = show_page(markets, 1, 2)

    assert len(result) == 2
    assert result[0]["name"] == "Market A"


## тест добавления отзыва
def test_add_review():

    market = {
        "reviews": []
    }

    add_review(
        market,
        "Maria",
        "Ivanova",
        5,
        "Хороший рынок"
    )

    assert len(market["reviews"]) == 1
    assert market["reviews"][0]["rating"] == 5


## тест среднего рейтинга
def test_get_average_rating():

    rating = get_average_rating(markets[0])

    assert rating == 5


## тест сортировки по рейтингу
def test_sort_by_rating():

    result = sort_by_rating(markets, reverse=True)

    assert result[0]["name"] == "Market A"


## тест сортировки по названию
def test_sort_markets():

    result = sort_markets(markets, "name")

    assert result[0]["name"] == "Market A"


## тест расчета расстояния
def test_calculate_distance():

    distance = calculate_distance(
        41.8781,
        -87.6298,
        41.8781,
        -87.6298
    )

    assert distance == 0


## тест поиска по расстоянию
def test_find_by_distance():

    result = find_by_distance(
        markets,
        41.8781,
        -87.6298,
        10
    )

    assert len(result) >= 1


## тест удаления рынка
def test_delete_market():

    test_markets = markets.copy()

    market = test_markets[0]

    delete_market(test_markets, market)

    assert market not in test_markets


## запуск тестов
if __name__ == "__main__":

    test_find_by_city()
    test_find_by_state()
    test_find_by_zip()
    test_show_page()
    test_add_review()
    test_get_average_rating()
    test_sort_by_rating()
    test_sort_markets()
    test_calculate_distance()
    test_find_by_distance()
    test_delete_market()

    print("Все тесты пройдены успешно!")