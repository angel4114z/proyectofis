from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

from .contratos import InteractionRepository, MessageRepository


@dataclass(frozen=True)
class Message:
    id: str
    connection_id: str
    sender_student_id: str
    text: str
    created_at: datetime


class MatchNotFoundError(Exception):
    pass


class StudentOutsideMatchError(Exception):
    pass


class EmptyMessageError(Exception):
    pass


class ChatService:
    def __init__(
        self,
        messages: MessageRepository,
        interactions: InteractionRepository,
    ) -> None:
        self._messages = messages
        self._interactions = interactions

    def list_messages(
        self, connection_id: str, student_id: str
    ) -> list[Message]:
        connection = self._require_participant(connection_id, student_id)
        return self._messages.list_messages(connection.id)

    def send_message(
        self, connection_id: str, student_id: str, text: str
    ) -> Message:
        connection = self._require_participant(connection_id, student_id)
        normalized_text = text.strip()
        if not normalized_text:
            raise EmptyMessageError
        return self._messages.create_message(
            connection_id=connection.id,
            sender_student_id=student_id,
            text=normalized_text,
        )

    def _require_participant(
        self, connection_id: str, student_id: str
    ):
        connection = self._interactions.find_match(connection_id)
        if connection is None:
            raise MatchNotFoundError
        if student_id not in (
            connection.first_student_id,
            connection.second_student_id,
        ):
            raise StudentOutsideMatchError
        return connection
