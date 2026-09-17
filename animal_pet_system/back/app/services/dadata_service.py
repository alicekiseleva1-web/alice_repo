import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.db import load_local_env


DADATA_URL = (
    "https://suggestions.dadata.ru/"
    "suggestions/api/4_1/rs/suggest/address"
)


def suggest_cities(query):
    load_local_env()

    token = os.getenv("DADATA_API_KEY")

    if not token:
        raise RuntimeError("Не задан DADATA_API_KEY в back/.env")

    payload = json.dumps(
        {
            "query": query,
            "count": 5,
            "from_bound": {"value": "city"},
            "to_bound": {"value": "city"},
        }
    ).encode("utf-8")

    request = Request(
        DADATA_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Token {token}",
        },
        method="POST",
    )

    try:

        with urlopen(request, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))

    except HTTPError as error:

        if error.code in (401, 403):
            raise RuntimeError("DaData отклонила API-ключ") from error

        raise RuntimeError("DaData временно недоступна") from error

    except URLError as error:
        raise RuntimeError("Не удалось подключиться к DaData") from error

    suggestions = []

    for suggestion in result.get("suggestions", []):

        data = suggestion.get("data", {})
        city_name = data.get("city")
        city_fias_id = data.get("city_fias_id")

        if city_name and city_fias_id:
            suggestions.append(
                {
                    "city_name": city_name,
                    "city_fias_id": city_fias_id,
                    "label": suggestion.get("value", city_name),
                }
            )

    return suggestions
