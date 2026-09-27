import io
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services import cloudinary_service


class ImageValidationTests(unittest.TestCase):
    def make_file(self, size=10, content_type="image/png"):
        stream = io.BytesIO(b"x" * size)
        self.addCleanup(stream.close)
        return SimpleNamespace(file=stream, content_type=content_type)

    def test_allowed_mime_types_are_accepted(self):
        for content_type in ("image/jpeg", "image/png", "image/webp"):
            with self.subTest(content_type=content_type):
                self.assertIsNone(cloudinary_service.validate_image(self.make_file(content_type=content_type)))

    def test_unsupported_mime_types_are_rejected(self):
        for content_type in ("text/plain", "image/gif", "application/octet-stream", None):
            with self.subTest(content_type=content_type):
                with self.assertRaisesRegex(RuntimeError, "только JPEG, PNG или WebP"):
                    cloudinary_service.validate_image(self.make_file(content_type=content_type))

    def test_empty_file_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "пустой файл"):
            cloudinary_service.validate_image(self.make_file(size=0))

    def test_exact_size_limit_is_accepted(self):
        self.assertEqual(cloudinary_service.MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024)
        self.assertIsNone(cloudinary_service.validate_image(self.make_file(size=5 * 1024 * 1024)))

    def test_file_above_size_limit_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "не должен превышать 5 МБ"):
            cloudinary_service.validate_image(self.make_file(size=5 * 1024 * 1024 + 1))

    def test_validation_rewinds_stream(self):
        file = self.make_file()
        file.file.seek(5)
        cloudinary_service.validate_image(file)
        self.assertEqual(file.file.tell(), 0)


class CloudinaryAdapterTests(unittest.TestCase):
    def setUp(self):
        self.configure = self.patch("configure_cloudinary")
        self.upload = self.patch("cloudinary.uploader.upload")
        self.destroy = self.patch("cloudinary.uploader.destroy")
        stream = io.BytesIO(b"test-image-bytes")
        self.addCleanup(stream.close)
        self.file = SimpleNamespace(file=stream, content_type="image/png")

    def patch(self, target):
        patcher = patch("app.services.cloudinary_service." + target)
        mock = patcher.start()
        self.addCleanup(patcher.stop)
        return mock

    def test_upload_returns_secure_url_and_public_id(self):
        self.upload.return_value = {"secure_url": "https://example.com/test.png",
                                    "public_id": "unit-test/image"}
        result = cloudinary_service.upload_image(self.file)
        self.assertEqual(result, {"url": "https://example.com/test.png", "public_id": "unit-test/image"})
        self.configure.assert_called_once_with()
        self.upload.assert_called_once_with(self.file.file, resource_type="image", folder="animal_help",
                                            allowed_formats=["jpg", "jpeg", "png", "webp"])

    def test_invalid_file_is_not_sent_to_cloudinary(self):
        self.file.content_type = "text/plain"
        with self.assertRaises(RuntimeError):
            cloudinary_service.upload_image(self.file)
        self.upload.assert_not_called()

    def test_upload_error_is_translated(self):
        self.upload.side_effect = RuntimeError("simulated provider failure")
        with self.assertRaisesRegex(RuntimeError, "Не удалось загрузить изображение в Cloudinary"):
            cloudinary_service.upload_image(self.file)

    def test_delete_accepts_success_and_missing_file(self):
        for status in ("ok", "not found"):
            with self.subTest(status=status):
                self.destroy.return_value = {"result": status}
                self.assertTrue(cloudinary_service.delete_image("unit-test/image"))
                self.destroy.assert_called_with("unit-test/image", resource_type="image", invalidate=True)

    def test_delete_returns_false_on_provider_failure(self):
        self.destroy.side_effect = RuntimeError("simulated provider failure")
        self.assertFalse(cloudinary_service.delete_image("unit-test/image"))

    def test_delete_returns_false_on_unexpected_result(self):
        self.destroy.return_value = {"result": "error"}
        self.assertFalse(cloudinary_service.delete_image("unit-test/image"))
