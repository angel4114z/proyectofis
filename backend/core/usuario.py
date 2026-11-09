from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass

from .contratos import AccountRepository, SessionRepository

_PASSWORD_HASH_ITERATIONS = 260_000


@dataclass(frozen=True)
class Student:
    id: str
    email: str
    name: str
    password_salt: bytes
    password_digest: bytes


@dataclass(frozen=True)
class AuthenticatedStudent:
    id: str
    email: str
    name: str
    access_token: str


class AuthService:
    def __init__(
        self,
        accounts: AccountRepository,
        sessions: SessionRepository,
    ) -> None:
        self._accounts = accounts
        self._sessions = sessions

    def login(self, email: str, password: str) -> AuthenticatedStudent | None:
        student = self._accounts.find_by_email(email.strip().lower())
        if student is None or not verify_password(
            password, student.password_salt, student.password_digest
        ):
            return None

        token = self._sessions.create_session(student.id)
        return AuthenticatedStudent(
            id=student.id,
            email=student.email,
            name=student.name,
            access_token=token,
        )

    def student_id_for_token(self, token: str) -> str | None:
        return self._sessions.find_student_id(token)


def hash_password(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PASSWORD_HASH_ITERATIONS
    )


def verify_password(password: str, salt: bytes, expected_digest: bytes) -> bool:
    actual_digest = hash_password(password, salt)
    return hmac.compare_digest(actual_digest, expected_digest)