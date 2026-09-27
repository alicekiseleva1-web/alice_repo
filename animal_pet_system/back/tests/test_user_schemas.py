import unittest

from pydantic import ValidationError

from app.schemas.user import (
    CityResolveRequest, CitySuggestRequest, PasswordChange,
    UserCreate, UserLogin, UserUpdate,
)


class RegistrationSchemaTests(unittest.TestCase):
    def setUp(self):
        self.data = {
            "first_name": "Анна", "last_name": "Тестовая", "city_id": 1,
            "phone": "+79990000001", "email": "unit@example.com",
            "password": "unit-test-password",
        }

    def test_regular_registration_does_not_require_shelter(self):
        result = UserCreate(**self.data)
        self.assertFalse(result.is_shelter)
        self.assertIsNone(result.shelter_name)

    def test_shelter_registration_accepts_complete_details(self):
        result = UserCreate(**self.data, is_shelter=True, shelter_name="Тестовый приют",
                            shelter_address="Тестовый адрес", shelter_description="Описание")
        self.assertTrue(result.is_shelter)
        self.assertEqual(result.shelter_name, "Тестовый приют")

    def test_shelter_registration_rejects_incomplete_details(self):
        details = {"shelter_name": "Приют", "shelter_address": "Адрес",
                   "shelter_description": "Описание"}
        for field in details:
            for value in (None, "", "   "):
                with self.subTest(field=field, value=value):
                    with self.assertRaises(ValidationError):
                        UserCreate(**self.data, is_shelter=True, **{**details, field: value})

    def test_registration_password_length_boundaries(self):
        for size in (8, 128):
            with self.subTest(size=size):
                result = UserCreate(**{**self.data, "password": "a" * size})
                self.assertEqual(len(result.password), size)
        for size in (7, 129):
            with self.subTest(size=size):
                with self.assertRaises(ValidationError):
                    UserCreate(**{**self.data, "password": "a" * size})

    def test_login_password_length_boundaries(self):
        for size in (8, 128):
            with self.subTest(size=size):
                result = UserLogin(email="unit@example.com", password="a" * size)
                self.assertEqual(len(result.password), size)
        for size in (7, 129):
            with self.subTest(size=size):
                with self.assertRaises(ValidationError):
                    UserLogin(email="unit@example.com", password="a" * size)


class ProfileSchemaTests(unittest.TestCase):
    def setUp(self):
        self.data = {"first_name": "Анна", "last_name": "Тестовая",
                     "phone": "+79990000001", "email": "unit@example.com", "city_id": 1}

    def test_profile_strips_surrounding_whitespace(self):
        data = {key: f" {value} " if isinstance(value, str) else value
                for key, value in self.data.items()}
        self.assertEqual(UserUpdate(**data).model_dump(), self.data)

    def test_blank_names_are_rejected(self):
        for field in ("first_name", "last_name"):
            with self.subTest(field=field):
                with self.assertRaises(ValidationError):
                    UserUpdate(**{**self.data, field: "   "})

    def test_invalid_contacts_are_rejected(self):
        for field, value in (("email", "invalid"), ("email", "a b@example.com"),
                             ("phone", "abcdefg"), ("phone", "123")):
            with self.subTest(field=field, value=value):
                with self.assertRaises(ValidationError):
                    UserUpdate(**{**self.data, field: value})

    def test_city_id_must_be_positive(self):
        for value in (0, -1):
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    UserUpdate(**{**self.data, "city_id": value})

    def test_role_cannot_be_added_to_profile_update(self):
        with self.assertRaises(ValidationError):
            UserUpdate(**self.data, role_id=4)


class PasswordChangeSchemaTests(unittest.TestCase):
    def setUp(self):
        self.data = {"current_password": "old-test-password", "new_password": "new-test-password",
                     "confirm_password": "new-test-password"}

    def test_matching_new_password_is_accepted(self):
        self.assertEqual(PasswordChange(**self.data).model_dump(), self.data)

    def test_confirmation_must_match(self):
        with self.assertRaisesRegex(ValidationError, "новые пароли не совпадают"):
            PasswordChange(**{**self.data, "confirm_password": "different-password"})

    def test_new_password_must_differ_from_current(self):
        with self.assertRaisesRegex(ValidationError, "новый пароль должен отличаться"):
            PasswordChange(**{**self.data, "new_password": self.data["current_password"],
                              "confirm_password": self.data["current_password"]})

    def test_new_password_length_boundaries(self):
        for size in (8, 128):
            with self.subTest(size=size):
                result = PasswordChange(**{**self.data, "new_password": "a" * size,
                                            "confirm_password": "a" * size})
                self.assertEqual(len(result.new_password), size)
        for size in (7, 129):
            with self.subTest(size=size):
                with self.assertRaises(ValidationError):
                    PasswordChange(**{**self.data, "new_password": "a" * size,
                                      "confirm_password": "a" * size})

    def test_passwords_are_not_trimmed(self):
        result = PasswordChange(current_password=" old-password ",
                                new_password=" new-password ", confirm_password=" new-password ")
        self.assertEqual(result.current_password, " old-password ")
        self.assertEqual(result.new_password, " new-password ")

    def test_extra_fields_are_rejected(self):
        with self.assertRaises(ValidationError):
            PasswordChange(**self.data, user_id=1)


class CitySchemaTests(unittest.TestCase):
    def test_suggestion_query_length_boundaries(self):
        for size in (3, 100):
            with self.subTest(size=size):
                self.assertEqual(len(CitySuggestRequest(query="а" * size).query), size)
        for size in (2, 101):
            with self.subTest(size=size):
                with self.assertRaises(ValidationError):
                    CitySuggestRequest(query="а" * size)

    def test_city_resolution_accepts_name_and_fias_id(self):
        result = CityResolveRequest(city_name="Москва",
                                    city_fias_id="0c5b2444-70a0-4932-980c-b4dc0d3f02b5")
        self.assertEqual(result.city_name, "Москва")

    def test_city_resolution_rejects_wrong_fias_length(self):
        for size in (35, 37):
            with self.subTest(size=size):
                with self.assertRaises(ValidationError):
                    CityResolveRequest(city_name="Москва", city_fias_id="a" * size)
