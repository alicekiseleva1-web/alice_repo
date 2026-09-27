import base64
import unittest

from app.security import hash_password, verify_password


class PasswordSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = "unit-test-password"
        cls.saved_hash = hash_password(cls.password)

    def test_hash_uses_expected_algorithm_and_parameters(self):
        algorithm, iterations, salt, digest = self.saved_hash.split("$")
        self.assertEqual(algorithm, "pbkdf2_sha256")
        self.assertEqual(int(iterations), 600_000)
        self.assertEqual(len(base64.b64decode(salt)), 16)
        self.assertEqual(len(base64.b64decode(digest)), 32)
        self.assertNotIn(self.password, self.saved_hash)

    def test_correct_password_is_accepted(self):
        self.assertTrue(verify_password(self.password, self.saved_hash))

    def test_incorrect_password_is_rejected(self):
        self.assertFalse(verify_password("incorrect-password", self.saved_hash))

    def test_same_password_produces_different_salts(self):
        other_hash = hash_password(self.password)
        self.assertNotEqual(self.saved_hash.split("$")[2], other_hash.split("$")[2])
        self.assertNotEqual(self.saved_hash, other_hash)
        self.assertTrue(verify_password(self.password, other_hash))

    def test_unicode_password_round_trip(self):
        password = "Пароль-для-теста-🐾"
        self.assertTrue(verify_password(password, hash_password(password)))

    def test_password_whitespace_is_significant(self):
        password = " password-with-spaces "
        saved_hash = hash_password(password)
        self.assertTrue(verify_password(password, saved_hash))
        self.assertFalse(verify_password(password.strip(), saved_hash))

    def test_non_string_hash_is_rejected(self):
        for value in (None, 123, b"hash"):
            with self.subTest(value=value):
                self.assertFalse(verify_password(self.password, value))

    def test_malformed_hash_is_rejected(self):
        for value in (
            "", "test_hash", "pbkdf2_sha256$600000",
            "other$600000$c2FsdA==$aGFzaA==",
            "pbkdf2_sha256$invalid$c2FsdA==$aGFzaA==",
            "pbkdf2_sha256$0$c2FsdA==$aGFzaA==",
            "pbkdf2_sha256$600000$a$a",
        ):
            with self.subTest(value=value):
                self.assertFalse(verify_password(self.password, value))
