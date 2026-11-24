import struct
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
import zlib

from fastapi.testclient import TestClient

import app as app_module
from app import app, store


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    payload = chunk_type + data
    return (
        struct.pack(">I", len(data))
        + payload
        + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)
    )


def _one_pixel_png() -> bytes:
    return (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(
            b"IHDR",
            struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0),
        )
        + _png_chunk(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
        + _png_chunk(b"IEND", b"")
    )


class ProfilePhotoApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.uploads_directory = TemporaryDirectory()
        self.original_upload_directory = app_module.upload_directory
        app_module.upload_directory = Path(self.uploads_directory.name)
        static_route = next(
            route
            for route in app.routes
            if getattr(route, "name", None) == "uploads"
        )
        self.static_files = static_route.app
        self.original_static_directory = self.static_files.directory
        self.original_static_directories = self.static_files.all_directories
        self.static_files.directory = self.uploads_directory.name
        self.static_files.all_directories = (self.uploads_directory.name,)
        self.original_profiles = {
            student_id: store.find_by_student_id(student_id)
            for student_id in ("student-1", "student-2", "student-3")
        }
        self.client = TestClient(app)
        self.headers_by_student = {}
        self.email_by_student = {
            "student-1": "ana@demo.test",
            "student-2": "luis@demo.test",
            "student-3": "maria@demo.test",
        }
        for student_id, email in self.email_by_student.items():
            response = self.client.post(
                "/auth/login",
                json={"email": email, "password": "Demo123!"},
            )
            self.headers_by_student[student_id] = {
                "Authorization": f"Bearer {response.json()['access_token']}"
            }

    def tearDown(self) -> None:
        self.client.close()
        for student_id, profile in self.original_profiles.items():
            store.update_photo(student_id, profile.photo_url)
        self.static_files.directory = self.original_static_directory
        self.static_files.all_directories = self.original_static_directories
        app_module.upload_directory = self.original_upload_directory
        self.uploads_directory.cleanup()

    def test_each_demo_student_photo_persists_and_appears_in_discovery(self) -> None:
        image_bytes = _one_pixel_png()
        for student_id, email in self.email_by_student.items():
            with self.subTest(student=student_id):
                uploaded = self.client.post(
                    "/profiles/me/photo",
                    headers=self.headers_by_student[student_id],
                    files={"photo": (f"{student_id}.png", image_bytes, "image/png")},
                )
                self.assertEqual(uploaded.status_code, 200, uploaded.text)
                photo_url = uploaded.json()["photo_url"]
                self.assertIn(app_module._photo_stem(student_id), photo_url)
                relative_path = photo_url.split("?", maxsplit=1)[0].removeprefix(
                    "/uploads/"
                )
                self.assertTrue(
                    (Path(self.uploads_directory.name) / relative_path).is_file()
                )

                store.update_photo(student_id, None)
                fresh_login = self.client.post(
                    "/auth/login",
                    json={"email": email, "password": "Demo123!"},
                )
                self.assertEqual(fresh_login.status_code, 200, fresh_login.text)
                fresh_headers = {
                    "Authorization": f"Bearer {fresh_login.json()['access_token']}"
                }
                own_profile = self.client.get(
                    "/profiles/me", headers=fresh_headers
                )
                self.assertEqual(own_profile.status_code, 200)
                self.assertEqual(own_profile.json()["photo_url"], photo_url)

                observer_id = next(
                    candidate
                    for candidate in self.email_by_student
                    if candidate != student_id
                )
                discovery = self.client.get(
                    "/profiles", headers=self.headers_by_student[observer_id]
                )
                target_profile = next(
                    profile
                    for profile in discovery.json()
                    if profile["student_id"] == student_id
                )
                self.assertEqual(target_profile["photo_url"], photo_url)

                image_response = self.client.get(photo_url)
                self.assertEqual(image_response.status_code, 200)
                self.assertEqual(image_response.content, image_bytes)
                self.assertEqual(
                    image_response.headers["content-type"], "image/png"
                )

    def test_photo_endpoints_require_authentication(self) -> None:
        upload = self.client.post(
            "/profiles/me/photo",
            files={"photo": ("photo.png", _one_pixel_png(), "image/png")},
        )
        deletion = self.client.delete("/profiles/me/photo")

        self.assertEqual(upload.status_code, 401)
        self.assertEqual(deletion.status_code, 401)

    def test_upload_rejects_empty_oversized_unsupported_and_mismatched_images(
        self,
    ) -> None:
        headers = self.headers_by_student["student-1"]
        invalid_files = (
            ("empty", ("empty.png", b"", "image/png"), 400),
            ("unsupported", ("photo.gif", b"GIF89a", "image/gif"), 415),
            ("mismatched", ("photo.png", b"not a png", "image/png"), 415),
            (
                "oversized",
                (
                    "large.png",
                    b"\x89PNG\r\n\x1a\n"
                    + b"x" * (app_module.MAX_PHOTO_SIZE + 1),
                    "image/png",
                ),
                413,
            ),
        )
        for label, file, expected_status in invalid_files:
            with self.subTest(file=label):
                response = self.client.post(
                    "/profiles/me/photo",
                    headers=headers,
                    files={"photo": file},
                )
                self.assertEqual(
                    response.status_code, expected_status, response.text
                )

        self.assertIsNone(
            self.client.get("/profiles/me", headers=headers).json()["photo_url"]
        )
        self.assertEqual(
            list(Path(self.uploads_directory.name).rglob("*.png")), []
        )

    def test_replacing_photo_leaves_only_the_current_photo(self) -> None:
        first = self.client.post(
            "/profiles/me/photo",
            headers=self.headers_by_student["student-2"],
            files={"photo": ("first.png", _one_pixel_png(), "image/png")},
        )
        second = self.client.post(
            "/profiles/me/photo",
            headers=self.headers_by_student["student-2"],
            files={"photo": ("second.png", _one_pixel_png(), "image/png")},
        )

        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertNotEqual(first.json()["photo_url"], second.json()["photo_url"])
        self.assertEqual(
            self.client.get(first.json()["photo_url"]).status_code, 404
        )
        self.assertEqual(
            self.client.get(second.json()["photo_url"]).status_code, 200
        )

    def test_photo_can_be_uploaded_again_after_deletion(self) -> None:
        image_bytes = _one_pixel_png()
        for student_id in self.email_by_student:
            with self.subTest(student=student_id):
                headers = self.headers_by_student[student_id]
                first = self.client.post(
                    "/profiles/me/photo",
                    headers=headers,
                    files={"photo": ("first.png", image_bytes, "image/png")},
                )
                self.assertEqual(first.status_code, 200, first.text)

                deleted = self.client.delete(
                    "/profiles/me/photo", headers=headers
                )
                self.assertEqual(deleted.status_code, 204, deleted.text)
                self.assertEqual(
                    self.client.get("/profiles/me", headers=headers)
                    .json()["photo_url"],
                    None,
                )
                self.assertEqual(
                    self.client.get(first.json()["photo_url"]).status_code,
                    404,
                )

                second = self.client.post(
                    "/profiles/me/photo",
                    headers=headers,
                    files={"photo": ("second.png", image_bytes, "image/png")},
                )
                self.assertEqual(second.status_code, 200, second.text)
                self.assertNotEqual(
                    first.json()["photo_url"], second.json()["photo_url"]
                )
                self.assertEqual(
                    self.client.get(second.json()["photo_url"]).status_code,
                    200,
                )


if __name__ == "__main__":
    unittest.main()
