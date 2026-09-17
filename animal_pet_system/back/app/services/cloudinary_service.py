import os

import cloudinary
import cloudinary.uploader

from app.db import load_local_env


ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def configure_cloudinary():
    load_local_env()

    required_settings = (
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
    )
    missing_settings = [
        setting for setting in required_settings if not os.getenv(setting)
    ]

    if missing_settings:
        missing = ", ".join(missing_settings)
        raise RuntimeError(
            f"Не заданы настройки Cloudinary: {missing}. Проверьте back/.env"
        )

    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )


def validate_image(file):
    if file.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise RuntimeError("Можно загрузить только JPEG, PNG или WebP")

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_IMAGE_SIZE_BYTES:
        raise RuntimeError("Размер изображения не должен превышать 5 МБ")


def upload_image(file):
    configure_cloudinary()
    validate_image(file)

    try:
        result = cloudinary.uploader.upload(
            file.file,
            resource_type="image",
            folder="animal_help",
            allowed_formats=["jpg", "jpeg", "png", "webp"],
        )
    except Exception as error:
        raise RuntimeError("Не удалось загрузить изображение в Cloudinary") from error

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


def delete_image(public_id):
    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception:
        pass
