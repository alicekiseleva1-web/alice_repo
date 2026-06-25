import math
import zip_util


def haversine(lat1, lon1, lat2, lon2):
    """Вычисление расстояния между двумя точками в милях."""
    r = 3958.8  # радиус Земли в милях

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1) * math.cos(lat2) *
         math.sin(dlon / 2) ** 2)

    c = 2 * math.asin(math.sqrt(a))

    return r * c


def main():
    zip_codes = zip_util.read_zip_all()

    zip_dict = {}
    city_state_dict = {}

    # загружаем данные
    for zipcode, lat, lon, city, state, county in zip_codes:
        zip_dict[zipcode] = {
            "lat": lat,
            "lon": lon,
            "city": city,
            "state": state,
            "county": county
        }

        key = (city.upper(), state.upper())

        if key not in city_state_dict:
            city_state_dict[key] = []

        city_state_dict[key].append(zipcode)

    # repl
    while True:
        command = input("Command ('loc', 'zip', 'dist', 'end') => ").strip().lower()

        if command == "end":
            print("Done")
            break

        elif command == "loc":
            zipcode = input("Enter a ZIP Code to lookup => ").strip()

            if zipcode not in zip_dict:
                print("ZIP Code not found")
                continue

            data = zip_dict[zipcode]

            print(f"ZIP Code {zipcode} is in {data['city']}, {data['state']}, {data['county']} county")
            print(f"coordinates: ({data['lat']:.6f}, {data['lon']:.6f})")

        elif command == "zip":
            city = input("Enter a city name to lookup => ").strip()
            state = input("Enter the state name to lookup => ").strip()

            key = (city.upper(), state.upper())

            if key not in city_state_dict:
                print("City/State not found")
                continue

            zips = sorted(city_state_dict[key])

            print(f"The following ZIP Code(s) found for {city.title()}, {state.upper()}: {', '.join(zips)}")

        elif command == "dist":
            zip1 = input("Enter the first ZIP Code => ").strip()
            zip2 = input("Enter the second ZIP Code => ").strip()

            if zip1 not in zip_dict or zip2 not in zip_dict:
                print("ZIP Code not found")
                continue

            lat1, lon1 = zip_dict[zip1]["lat"], zip_dict[zip1]["lon"]
            lat2, lon2 = zip_dict[zip2]["lat"], zip_dict[zip2]["lon"]

            distance = haversine(lat1, lon1, lat2, lon2)

            print(f"The distance between {zip1} and {zip2} is {distance:.2f} miles")

        else:
            print("Invalid command, ignoring")


if __name__ == "__main__":
    main()
