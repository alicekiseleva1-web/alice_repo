class Market:

    def __init__(
        self,
        name,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        reviews=None
    ):
        self.name = name
        self.city = city
        self.state = state
        self.zip = zip_code
        self.lat = latitude
        self.lon = longitude
        self.reviews = reviews if reviews is not None else []