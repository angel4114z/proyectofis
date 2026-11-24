from __future__ import annotations

from datetime import datetime, timezone
import unittest
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient

import app as app_module
from app import app
from core.chat import ChatService
from core.conexion import ConnectionService
from core.memoria import InMemoryStore
from core.moderacion import ReportService
from core.perfil import ProfileService
from core.usuario import AuthService


class ModerationApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.original_services = (
            app_module.store,
            app_module.auth_service,
            app_module.profile_service,
            app_module.connection_service,
            app_module.chat_service,
            app_module.report_service,
        )
        self.store = InMemoryStore()
        self.administrator = self.store.configure_administrator(
            "moderator@gmail.com", "Moderation123!"
        )
        app_module.store = self.store
        app_module.auth_service = AuthService(self.store, self.store)
        app_module.profile_service = ProfileService(self.store, self.store)
        app_module.connection_service = ConnectionService(self.store, self.store)
        app_module.chat_service = ChatService(self.store, self.store)
        app_module.report_service = ReportService(
            self.store, self.store, self.store
        )
        self.client = TestClient(app)
        self.tokens = {}
        for student_id, email in (
            ("student-1", "ana@demo.test"),
            ("student-2", "luis@demo.test"),
        ):
            login = self.client.post(
                "/auth/login",
                json={"email": email, "password": "Demo123!"},
            )
            self.assertEqual(login.status_code, 200, login.text)
            self.tokens[student_id] = login.json()["access_token"]
        admin_login = self.client.post(
            "/auth/login",
            json={
                "email": "moderator@gmail.com",
                "password": "Moderation123!",
            },
        )
        self.assertEqual(admin_login.status_code, 200, admin_login.text)
        self.assertEqual(admin_login.json()["student"]["role"], "administrador")
        self.admin_headers = {
            "Authorization": f"Bearer {admin_login.json()['access_token']}"
        }
        self.student_headers = {
            student_id: {"Authorization": f"Bearer {token}"}
            for student_id, token in self.tokens.items()
        }
        self.connection_id = self._create_match()

    def tearDown(self) -> None:
        self.client.close()
        (
            app_module.store,
            app_module.auth_service,
            app_module.profile_service,
            app_module.connection_service,
            app_module.chat_service,
            app_module.report_service,
        ) = self.original_services

    def _create_match(self) -> str:
        self.client.post(
            "/reactions",
            headers=self.student_headers["student-1"],
            json={"target_student_id": "student-2", "type": "like"},
        )
        response = self.client.post(
            "/reactions",
            headers=self.student_headers["student-2"],
            json={"target_student_id": "student-1", "type": "like"},
        )
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()["match"]["connection_id"]

    def _submit_report(self, cause: str = "acoso") -> dict:
        response = self.client.post(
            "/reports",
            headers=self.student_headers["student-1"],
            json={
                "target_student_id": "student-2",
                "connection_id": self.connection_id,
                "cause": cause,
                "description": "Comportamiento reportado en el chat.",
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_confirmed_report_suspends_and_admin_can_reactivate(self) -> None:
        sent = self.client.post(
            f"/matches/{self.connection_id}/messages",
            headers=self.student_headers["student-1"],
            json={"text": "Mensaje relevante para moderación"},
        )
        self.assertEqual(sent.status_code, 201, sent.text)
        report = self._submit_report()
        self.assertEqual(report["status"], "pendiente")

        forbidden = self.client.get(
            "/admin/reports", headers=self.student_headers["student-1"]
        )
        self.assertEqual(forbidden.status_code, 403)
        reports = self.client.get("/admin/reports", headers=self.admin_headers)
        self.assertEqual(reports.status_code, 200, reports.text)
        review = next(item for item in reports.json() if item["id"] == report["id"])
        self.assertEqual(review["cause"], "acoso")
        self.assertEqual(len(review["messages"]), 1)
        self.assertEqual(review["messages"][0]["text"], "Mensaje relevante para moderación")

        resolved = self.client.post(
            f"/admin/reports/{report['id']}/resolve",
            headers=self.admin_headers,
            json={"confirmed": True},
        )
        self.assertEqual(resolved.status_code, 200, resolved.text)
        self.assertEqual(resolved.json()["status"], "resuelto")
        repeated_resolution = self.client.post(
            f"/admin/reports/{report['id']}/resolve",
            headers=self.admin_headers,
            json={"confirmed": False},
        )
        self.assertEqual(repeated_resolution.status_code, 409)
        self.assertEqual(
            self.client.get(
                "/profiles/me", headers=self.student_headers["student-2"]
            ).status_code,
            403,
        )
        suspended = self.client.get(
            "/admin/accounts/suspended", headers=self.admin_headers
        )
        self.assertEqual(
            [account["student_id"] for account in suspended.json()],
            ["student-2"],
        )
        self.assertEqual(
            len(
                self.client.get(
                    "/notifications", headers=self.student_headers["student-1"]
                ).json()
            ),
            1,
        )

        reactivated = self.client.post(
            "/admin/accounts/student-2/reactivate",
            headers=self.admin_headers,
        )
        self.assertEqual(reactivated.status_code, 204)
        self.assertEqual(
            self.client.get(
                "/auth/me", headers=self.student_headers["student-2"]
            ).status_code,
            200,
        )

    def test_discarded_report_penalizes_reporter_for_three_days(self) -> None:
        report = self._submit_report("spam")
        response = self.client.post(
            f"/admin/reports/{report['id']}/resolve",
            headers=self.admin_headers,
            json={"confirmed": False},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["status"], "descartado")
        penalized_reporter = self.store.find_account_by_student_id("student-1")
        self.assertIsNotNone(penalized_reporter.penalized_until)
        self.assertGreater(
            (penalized_reporter.penalized_until - datetime.now(timezone.utc)).total_seconds(),
            3 * 24 * 60 * 60 - 10,
        )
        self.assertEqual(
            self.client.get(
                "/auth/me", headers=self.student_headers["student-1"]
            ).status_code,
            403,
        )
        self.assertEqual(
            len(
                self.client.get(
                    "/notifications", headers=self.student_headers["student-2"]
                ).json()
            ),
            1,
        )

    def test_reports_require_a_chat_with_the_reported_student(self) -> None:
        wrong_participant = self.client.post(
            "/reports",
            headers=self.student_headers["student-1"],
            json={
                "target_student_id": "student-3",
                "connection_id": self.connection_id,
                "cause": "otro",
                "description": "Detalle",
            },
        )
        missing_other_description = self.client.post(
            "/reports",
            headers=self.student_headers["student-1"],
            json={
                "target_student_id": "student-2",
                "connection_id": self.connection_id,
                "cause": "otro",
            },
        )
        unauthenticated = self.client.post(
            "/reports",
            json={
                "target_student_id": "student-2",
                "connection_id": self.connection_id,
                "cause": "acoso",
            },
        )

        self.assertEqual(wrong_participant.status_code, 400)
        self.assertEqual(missing_other_description.status_code, 400)
        self.assertEqual(unauthenticated.status_code, 401)

    def test_only_one_concurrent_resolution_has_effects(self) -> None:
        report = self._submit_report()

        def resolve(confirmed: bool) -> int:
            return self.client.post(
                f"/admin/reports/{report['id']}/resolve",
                headers=self.admin_headers,
                json={"confirmed": confirmed},
            ).status_code

        with ThreadPoolExecutor(max_workers=2) as executor:
            statuses = sorted(executor.map(resolve, (True, False)))

        self.assertEqual(statuses, [200, 409])
        notifications = self.client.get(
            "/notifications", headers=self.student_headers["student-1"]
        )
        self.assertEqual(notifications.status_code, 200)
        self.assertEqual(len(notifications.json()), 1)


if __name__ == "__main__":
    unittest.main()
