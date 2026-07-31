## собираем нормальный объект из данных
def create_markets(fmid, name, city, state, zip_code, lat, lon):
    return {
        "id": fmid,
        "name": name,
        "city": city,
        "state": state,
        "zip": zip_code,
        "lat": lat,
        "lon": lon,
        "reviews": []
    }