import struct
import unittest
import zlib

from fastapi.testclient import TestClient

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
        self.client = TestClient(app)
        store.update_photo("student-1", None)
        store.update_photo("student-2", None)
        ana = self.client.post(
            "/auth/login",
            json={"email": "ana@demo.test", "password": "Demo123!"},
        )
        luis = self.client.post(
            "/auth/login",
            json={"email": "luis@demo.test", "password": "Demo123!"},
        )
        self.ana_headers = {
            "Authorization": f"Bearer {ana.json()['access_token']}"
        }
        self.luis_headers = {
            "Authorization": f"Bearer {luis.json()['access_token']}"
        }

    def tearDown(self) -> None:
        self.client.delete("/profiles/me/photo", headers=self.luis_headers)

    def test_uploaded_photo_is_returned_after_fresh_login_and_in_discovery(
        self,
    ) -> None:
        image_bytes = _one_pixel_png()
        uploaded = self.client.post(
            "/profiles/me/photo",
            headers=self.luis_headers,
            files={"photo": ("profile.png", image_bytes, "image/png")},
        )

        self.assertEqual(uploaded.status_code, 200, uploaded.text)
        photo_url = uploaded.json()["photo_url"]
        self.assertIsNotNone(photo_url)

        store.update_photo("student-2", None)
        fresh_login = self.client.post(
            "/auth/login",
            json={"email": "luis@demo.test", "password": "Demo123!"},
        )
        self.assertEqual(fresh_login.status_code, 200)
        fresh_headers = {
            "Authorization": f"Bearer {fresh_login.json()['access_token']}"
        }
        own_profile = self.client.get(
            "/profiles/me", headers=fresh_headers
        )
        self.assertEqual(own_profile.status_code, 200)
        self.assertEqual(own_profile.json()["photo_url"], photo_url)

        discovery = self.client.get("/profiles", headers=self.ana_headers)
        self.assertEqual(discovery.status_code, 200)
        luis_profile = next(
            profile
            for profile in discovery.json()
            if profile["student_id"] == "student-2"
        )
        self.assertEqual(luis_profile["photo_url"], photo_url)

        image_response = self.client.get(photo_url)
        self.assertEqual(image_response.status_code, 200)
        self.assertEqual(image_response.content, image_bytes)
        self.assertEqual(image_response.headers["content-type"], "image/png")

    def test_replacing_photo_leaves_only_the_current_photo(self) -> None:
        first = self.client.post(
            "/profiles/me/photo",
            headers=self.luis_headers,
            files={"photo": ("first.png", _one_pixel_png(), "image/png")},
        )
        second = self.client.post(
            "/profiles/me/photo",
            headers=self.luis_headers,
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


if __name__ == "__main__":
    unittest.main()
