from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum

from .contratos import InteractionRepository, ProfileRepository


class ReactionType(str, Enum):
    LIKE = "like"
    DISLIKE = "dislike"


@dataclass(frozen=True)
class Reaction:
    student_id: str
    target_student_id: str
    type: ReactionType
    created_at: datetime


@dataclass(frozen=True)
class Connection:
    id: str
    first_student_id: str
    second_student_id: str
    created_at: datetime


@dataclass(frozen=True)
class ReactionResult:
    reaction: Reaction
    connection: Connection | None
    match_created: bool
    already_reacted: bool


class ReactionAlreadyRecordedError(Exception):
    pass


class ProfileNotFoundError(Exception):
    pass


class SelfReactionError(Exception):
    pass


class ConnectionService:
    def __init__(
        self,
        interactions: InteractionRepository,
        profiles: ProfileRepository,
    ) -> None:
        self._interactions = interactions
        self._profiles = profiles

    def react(
        self,
        student_id: str,
        target_student_id: str,
        reaction_type: ReactionType,
    ) -> ReactionResult:
        if student_id == target_student_id:
            raise SelfReactionError
        if self._profiles.find_by_student_id(target_student_id) is None:
            raise ProfileNotFoundError

        reaction = Reaction(
            student_id=student_id,
            target_student_id=target_student_id,
            type=reaction_type,
            created_at=datetime.now(timezone.utc),
        )
        result = self._interactions.record_reaction_and_match(reaction)
        if result.already_reacted:
            raise ReactionAlreadyRecordedError
        return result

    def get_matches(self, student_id: str) -> list[Connection]:
        return self._interactions.list_matches(student_id)