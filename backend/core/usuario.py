from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum

from .contratos import AccountRepository, SessionRepository

_PASSWORD_HASH_ITERATIONS = 260_000
_ALLOWED_EMAIL_DOMAINS = ("@gmail.com", "@hotmail.com")
_MIN_PASSWORD_LENGTH = 8


class AccountRole(str, Enum):
    STUDENT = "estudiante"
    ADMINISTRATOR = "administrador"


class AccountStatus(str, Enum):
    ACTIVE = "activa"
    SUSPENDED = "suspendida"


class EmailAlreadyRegisteredError(Exception):
    """Raised when attempting to register a student with an existing email."""


class InvalidEmailDomainError(Exception):
    """Raised when attempting to register with an unsupported email domain."""


class WeakPasswordError(Exception):
    """Raised when attempting to register with a password shorter than 8 characters."""


class AccountSuspendedError(Exception):
    """Raised when a suspended account attempts to access the application."""


class AccountPenalizedError(Exception):
    def __init__(self, penalized_until: datetime) -> None:
        self.penalized_until = penalized_until
        super().__init__("The account is penalized.")


@dataclass(frozen=True)
class Student:
    id: str
    email: str
    name: str
    password_salt: bytes
    password_digest: bytes
    role: AccountRole = AccountRole.STUDENT
    account_status: AccountStatus = AccountStatus.ACTIVE
    penalized_until: datetime | None = None


@dataclass(frozen=True)
class StudentRegistration:
    email: str
    name: str
    password: str
    faculty: str = ""
    campus: str = ""
    biography: str = ""
    interests: tuple[str, ...] = ()


@dataclass(frozen=True)
class AuthenticatedStudent:
    id: str
    email: str
    name: str
    access_token: str
    role: AccountRole


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
        self.ensure_account_access(student.id)

        token = self._sessions.create_session(student.id)
        return AuthenticatedStudent(
            id=student.id,
            email=student.email,
            name=student.name,
            access_token=token,
            role=student.role,
        )

    def register(self, registration: StudentRegistration) -> AuthenticatedStudent:
        normalized_email = registration.email.strip().lower()
        if not normalized_email.endswith(_ALLOWED_EMAIL_DOMAINS):
            raise InvalidEmailDomainError(normalized_email)

        if len(registration.password) < _MIN_PASSWORD_LENGTH:
            raise WeakPasswordError(
                f"Password must be at least {_MIN_PASSWORD_LENGTH} characters long."
            )

        if self._accounts.find_by_email(normalized_email) is not None:
            raise EmailAlreadyRegisteredError(normalized_email)

        salt = secrets.token_bytes(16)
        digest = hash_password(registration.password, salt)
        normalized_registration = StudentRegistration(
            email=normalized_email,
            name=registration.name.strip(),
            password=registration.password,
            faculty=registration.faculty.strip(),
            campus=registration.campus.strip(),
            biography=registration.biography.strip(),
            interests=tuple(
                dict.fromkeys(
                    interest.strip()
                    for interest in registration.interests
                    if interest.strip()
                )
            ),
        )
        student = self._accounts.create_student_with_profile(
            normalized_registration, salt, digest
        )
        token = self._sessions.create_session(student.id)
        return AuthenticatedStudent(
            id=student.id,
            email=student.email,
            name=student.name,
            access_token=token,
            role=AccountRole.STUDENT,
        )

    def student_id_for_token(self, token: str) -> str | None:
        return self._sessions.find_student_id(token)

    def account_for_student_id(self, student_id: str) -> Student | None:
        return self._accounts.find_account_by_student_id(student_id)

    def ensure_account_access(self, student_id: str) -> Student:
        student = self.account_for_student_id(student_id)
        if student is None:
            raise AccountSuspendedError
        if student.account_status is AccountStatus.SUSPENDED:
            raise AccountSuspendedError
        if student.penalized_until and student.penalized_until > datetime.now(
            timezone.utc
        ):
            raise AccountPenalizedError(student.penalized_until)
        return student


def hash_password(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PASSWORD_HASH_ITERATIONS
    )


def verify_password(password: str, salt: bytes, expected_digest: bytes) -> bool:
    actual_digest = hash_password(password, salt)
    return hmac.compare_digest(actual_digest, expected_digest)