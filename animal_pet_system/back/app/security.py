import base64
import hashlib
import hmac
import secrets


HASH_NAME = "sha256"
ITERATIONS = 600_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        HASH_NAME,
        password.encode("utf-8"),
        salt,
        ITERATIONS,
    )

    salt_value = base64.b64encode(salt).decode("ascii")
    hash_value = base64.b64encode(password_hash).decode("ascii")

    return f"pbkdf2_{HASH_NAME}${ITERATIONS}${salt_value}${hash_value}"


def verify_password(password: str, saved_hash: str) -> bool:
    try:
        algorithm, iterations, salt_value, hash_value = saved_hash.split("$")

        if algorithm != f"pbkdf2_{HASH_NAME}":
            return False

        salt = base64.b64decode(salt_value)
        expected_hash = base64.b64decode(hash_value)
        actual_hash = hashlib.pbkdf2_hmac(
            HASH_NAME,
            password.encode("utf-8"),
            salt,
            int(iterations),
        )

        return hmac.compare_digest(actual_hash, expected_hash)
    except (ValueError, TypeError):
        return False
