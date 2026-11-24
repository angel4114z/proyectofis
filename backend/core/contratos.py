from __future__ import annotations

from typing import Protocol, TYPE_CHECKING

if TYPE_CHECKING:
    from .conexion import Connection, Reaction, ReactionResult, ReactionType
    from .perfil import Profile, ProfileFilters, ProfileUpdate
    from .usuario import Student, StudentRegistration
    from .chat import Message


class AccountRepository(Protocol):
    def find_by_email(self, email: str) -> Student | None: ...

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


class MessageRepository(Protocol):
    def create_message(
        self,
        connection_id: str,
        sender_student_id: str,
        text: str,
    ) -> Message: ...

    def list_messages(self, connection_id: str) -> list[Message]: ...