import unittest

from pydantic import ValidationError

from app.schemas.animal import AnimalUpdate
from app.schemas.help_request import HelpRequestCreate, HelpRequestStatusUpdate, HelpRequestUpdate
from app.schemas.photo import PhotoCreate
from app.schemas.report import ReportUpdate
from app.schemas.shelter import ShelterUpdate


class DomainSchemaTests(unittest.TestCase):
    def setUp(self):
        self.animal = {
            "user_id": 1, "name": "Барсик", "breed": "Метис", "gender_id": 1,
            "age": 0, "color": "Серый", "city_id": 1, "description": "Тестовое описание",
        }
        self.report = {"user_id": 1, "report_type_id": 4, "title": "Ищет дом",
                       "description": "Тестовое описание", "location": "Москва"}
        self.help_request = {"user_id": 2, "shelter_id": 1, "title": "Нужен корм",
                             "description": "Тестовая заявка", "help_category_id": 3}
        self.shelter = {"name": "Тестовый приют", "address": "Тестовый адрес",
                        "description": "Тестовое описание"}

    def test_valid_domain_models(self):
        for model, data in ((AnimalUpdate, self.animal), (ReportUpdate, self.report),
                            (HelpRequestCreate, self.help_request), (ShelterUpdate, self.shelter)):
            with self.subTest(model=model.__name__):
                self.assertEqual(model(**data).model_dump(), data)

    def test_animal_age_must_be_nonnegative_integer(self):
        self.assertEqual(AnimalUpdate(**self.animal).age, 0)
        for age in (-1, 1.5):
            with self.subTest(age=age):
                with self.assertRaises(ValidationError) as caught:
                    AnimalUpdate(**{**self.animal, "age": age})
                self.assertEqual(caught.exception.errors()[0]["loc"], ("age",))

    def test_reference_ids_must_be_positive(self):
        cases = (
            (AnimalUpdate, self.animal, ("user_id", "gender_id", "city_id")),
            (ReportUpdate, self.report, ("user_id", "report_type_id")),
            (HelpRequestCreate, self.help_request, ("user_id", "shelter_id", "help_category_id")),
        )
        for model, data, fields in cases:
            for field in fields:
                for value in (0, -1):
                    with self.subTest(model=model.__name__, field=field, value=value):
                        with self.assertRaises(ValidationError) as caught:
                            model(**{**data, field: value})
                        self.assertEqual(caught.exception.errors()[0]["loc"], (field,))

    def test_blank_domain_text_is_rejected(self):
        cases = (
            (AnimalUpdate, self.animal, ("name", "breed", "color", "description")),
            (ReportUpdate, self.report, ("title", "description", "location")),
            (HelpRequestCreate, self.help_request, ("title", "description")),
            (ShelterUpdate, self.shelter, ("name", "address", "description")),
        )
        for model, data, fields in cases:
            for field in fields:
                with self.subTest(model=model.__name__, field=field):
                    with self.assertRaises(ValidationError):
                        model(**{**data, field: "   "})

    def test_domain_text_is_trimmed(self):
        for model, data in ((AnimalUpdate, self.animal), (ReportUpdate, self.report),
                            (HelpRequestCreate, self.help_request), (ShelterUpdate, self.shelter)):
            with self.subTest(model=model.__name__):
                padded = {key: f" {value} " if isinstance(value, str) else value
                          for key, value in data.items()}
                self.assertEqual(model(**padded).model_dump(), data)

    def test_report_title_length_boundaries(self):
        self.assertEqual(len(ReportUpdate(**{**self.report, "title": "a" * 255}).title), 255)
        with self.assertRaises(ValidationError):
            ReportUpdate(**{**self.report, "title": "a" * 256})

    def test_extra_fields_cannot_change_ownership_or_status(self):
        for model, data, extra in (
            (AnimalUpdate, self.animal, {"owner_id": 2}),
            (ReportUpdate, self.report, {"animal_id": 2}),
            (HelpRequestCreate, self.help_request, {"help_request_status_id": 3}),
        ):
            with self.subTest(model=model.__name__):
                with self.assertRaises(ValidationError) as caught:
                    model(**data, **extra)
                self.assertEqual(caught.exception.errors()[0]["type"], "extra_forbidden")

    def test_help_category_is_required_for_create_and_update(self):
        data = {key: value for key, value in self.help_request.items() if key != "help_category_id"}
        for model in (HelpRequestCreate, HelpRequestUpdate):
            if model is HelpRequestUpdate:
                data = {key: value for key, value in data.items() if key != "shelter_id"}
            with self.subTest(model=model.__name__):
                with self.assertRaises(ValidationError) as caught:
                    model(**data)
                self.assertEqual(caught.exception.errors()[0]["loc"], ("help_category_id",))

    def test_help_status_requires_positive_ids(self):
        data = {"user_id": 2, "help_request_status_id": 1}
        self.assertEqual(HelpRequestStatusUpdate(**data).model_dump(), data)
        for field in data:
            with self.subTest(field=field):
                with self.assertRaises(ValidationError):
                    HelpRequestStatusUpdate(**{**data, field: 0})

    def test_photo_report_is_optional_but_user_is_required(self):
        data = {"animal_id": 1, "url": "https://example.com/test.jpg"}
        result = PhotoCreate(**data, user_id=1)
        self.assertIsNone(result.report_id)
        with self.assertRaises(ValidationError):
            PhotoCreate(**data)
        with self.assertRaises(ValidationError):
            PhotoCreate(**data, user_id=0)
