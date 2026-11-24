from __future__ import annotations

from datetime import datetime
from typing import Protocol, TYPE_CHECKING

if TYPE_CHECKING:
    from .conexion import Connection, Reaction, ReactionResult, ReactionType
    from .perfil import Profile, ProfileFilters, ProfileUpdate
    from .usuario import AccountStatus, Student, StudentRegistration
    from .chat import Message
    from .moderacion import Notification, Report


class AccountRepository(Protocol):
    def find_by_email(self, email: str) -> Student | None: ...

    def find_account_by_student_id(self, student_id: str) -> Student | None: ...

    def list_accounts(self) -> list[Student]: ...

    def create_student_with_profile(
        self,
        registration: StudentRegistration,
        password_salt: bytes,
        password_digest: bytes,
    ) -> Student: ...


class SessionRepository(Protocol):
    def create_session(self, student_id: str) -> str: ...

    def find_student_id(self, token: str) -> str | None: ...


class ProfileRepository(Protocol):
    def find_by_student_id(self, student_id: str) -> Profile | None: ...

    def list_profiles(
        self, student_id: str, filters: ProfileFilters
    ) -> list[Profile]: ...

    def update_for_student(
        self, student_id: str, profile_update: ProfileUpdate
    ) -> Profile | None: ...

    def update_photo(
        self, student_id: str, photo_url: str | None
    ) -> Profile | None: ...


class InteractionRepository(Protocol):
    def list_reacted_student_ids(self, student_id: str) -> set[str]: ...

    def record_reaction_and_match(
        self, reaction: Reaction
    ) -> ReactionResult: ...

    def list_matches(self, student_id: str) -> list[Connection]: ...

    def find_match(
        self, connection_id: str
    ) -> Connection | None: ...


# Se actualiza create_message en el protocolo para recibir photo_url opcional.
class MessageRepository(Protocol):
    def create_message(
        self,
        connection_id: str,
        sender_student_id: str,
        text: str,
        photo_url: str | None = None,
    ) -> Message: ...

    def list_messages(self, connection_id: str) -> list[Message]: ...

    def list_messages(self, connection_id: str) -> list[Message]: ...


class ModerationRepository(Protocol):
    def find_account_by_student_id(self, student_id: str) -> Student | None: ...

    def list_accounts(self) -> list[Student]: ...

    def set_account_status(
        self,
        student_id: str,
        status: AccountStatus,
        penalized_until: datetime | None,
    ) -> Student | None: ...

    def create_report(self, report: Report) -> Report: ...

    def list_reports(self) -> list[Report]: ...

    def find_report(self, report_id: str) -> Report | None: ...

    def update_report(self, report: Report) -> Report | None: ...

    def create_notification(self, notification: Notification) -> Notification: ...

    def list_notifications(self, student_id: str) -> list[Notification]: ...

    def complete_report_resolution(
        self,
        report: Report,
        account_student_id: str,
        account_status: AccountStatus,
        penalized_until: datetime | None,
        notifications: tuple[Notification, Notification],
    ) -> Report | None: ...