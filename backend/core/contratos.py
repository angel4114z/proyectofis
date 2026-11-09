from __future__ import annotations

from typing import Protocol, TYPE_CHECKING

if TYPE_CHECKING:
    from .conexion import Connection, Reaction, ReactionResult, ReactionType
    from .perfil import Profile, ProfileFilters, ProfileUpdate
    from .usuario import Student


class AccountRepository(Protocol):
    def find_by_email(self, email: str) -> Student | None: ...


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


class InteractionRepository(Protocol):
    def list_reacted_student_ids(self, student_id: str) -> set[str]: ...

    def record_reaction_and_match(
        self, reaction: Reaction
    ) -> ReactionResult: ...

    def list_matches(self, student_id: str) -> list[Connection]: ...
