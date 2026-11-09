from __future__ import annotations

import secrets
import threading
from dataclasses import replace
from datetime import datetime, timezone
from uuid import uuid4

from .conexion import (
    Connection,
    Reaction,
    ReactionResult,
    ReactionType,
)
from .perfil import Profile, ProfileFilters, ProfileUpdate
from .usuario import Student, hash_password


class InMemoryStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._students: dict[str, Student] = {}
        self._student_ids_by_email: dict[str, str] = {}
        self._sessions: dict[str, str] = {}
        self._profiles: dict[str, Profile] = {}
        self._reactions: dict[tuple[str, str], Reaction] = {}
        self._connections: dict[tuple[str, str], Connection] = {}
        self._add_demo_students()

    def _add_demo_students(self) -> None:
        demo_students = (
            (
                "student-1",
                "ana@demo.test",
                "Ana Torres",
                "Ingeniería",
                "Macarena",
                "Busco conocer personas nuevas. Me gusta aprender y salir a caminar.",
                ("música", "senderismo", "lectura"),
            ),
            (
                "student-2",
                "luis@demo.test",
                "Luis Rojas",
                "Artes",
                "Macarena",
                "Disfruto la fotografía, la música y los planes tranquilos.",
                ("música", "fotografía", "cine"),
            ),
            (
                "student-3",
                "maria@demo.test",
                "María Gómez",
                "Ciencias",
                "Tecnológica",
                "Me interesan la ciencia, la lectura y conocer otros lugares.",
                ("lectura", "ciencia", "senderismo"),
            ),
        )
        password = "Demo123!"
        for (
            student_id,
            email,
            name,
            faculty,
            campus,
            biography,
            interests,
        ) in demo_students:
            salt = secrets.token_bytes(16)
            student = Student(
                id=student_id,
                email=email,
                name=name,
                password_salt=salt,
                password_digest=hash_password(password, salt),
            )
            self._students[student_id] = student
            self._student_ids_by_email[email] = student_id
            self._profiles[student_id] = Profile(
                id=f"profile-{student_id}",
                student_id=student_id,
                name=name,
                biography=biography,
                faculty=faculty,
                campus=campus,
                interests=interests,
            )

    def find_by_email(self, email: str) -> Student | None:
        with self._lock:
            student_id = self._student_ids_by_email.get(email)
            return self._students.get(student_id) if student_id else None

    def create_session(self, student_id: str) -> str:
        with self._lock:
            token = secrets.token_urlsafe(32)
            self._sessions[token] = student_id
            return token

    def find_student_id(self, token: str) -> str | None:
        with self._lock:
            return self._sessions.get(token)

    def find_by_student_id(self, student_id: str) -> Profile | None:
        with self._lock:
            return self._profiles.get(student_id)

    def list_profiles(
        self, student_id: str, filters: ProfileFilters
    ) -> list[Profile]:
        with self._lock:
            normalized_faculty = self._normalize_filter(filters.faculty)
            normalized_campus = self._normalize_filter(filters.campus)
            normalized_interest = self._normalize_filter(filters.interest)
            results: list[Profile] = []

            for profile in self._profiles.values():
                if profile.student_id == student_id:
                    continue
                if normalized_faculty and (
                    profile.faculty.casefold() != normalized_faculty
                ):
                    continue
                if normalized_campus and (
                    profile.campus.casefold() != normalized_campus
                ):
                    continue
                if normalized_interest and not any(
                    interest.casefold() == normalized_interest
                    for interest in profile.interests
                ):
                    continue
                results.append(profile)
            return results

    def update_for_student(
        self, student_id: str, profile_update: ProfileUpdate
    ) -> Profile | None:
        with self._lock:
            profile = self._profiles.get(student_id)
            if profile is None:
                return None
            updated_profile = replace(
                profile,
                biography=profile_update.biography,
                faculty=profile_update.faculty,
                campus=profile_update.campus,
                interests=profile_update.interests,
            )
            self._profiles[student_id] = updated_profile
            return updated_profile

    def list_reacted_student_ids(self, student_id: str) -> set[str]:
        with self._lock:
            return {
                target_id
                for reacting_id, target_id in self._reactions
                if reacting_id == student_id
            }

    def record_reaction_and_match(self, reaction: Reaction) -> ReactionResult:
        with self._lock:
            reaction_key = (reaction.student_id, reaction.target_student_id)
            existing_reaction = self._reactions.get(reaction_key)
            if existing_reaction is not None:
                return ReactionResult(
                    reaction=existing_reaction,
                    connection=None,
                    match_created=False,
                    already_reacted=True,
                )

            self._reactions[reaction_key] = reaction
            connection: Connection | None = None
            match_created = False
            reverse_reaction = self._reactions.get(
                (reaction.target_student_id, reaction.student_id)
            )
            if (
                reaction.type is ReactionType.LIKE
                and reverse_reaction is not None
                and reverse_reaction.type is ReactionType.LIKE
            ):
                pair_key = tuple(sorted(reaction_key))
                connection = self._connections.get(pair_key)
                if connection is None:
                    first_student_id, second_student_id = pair_key
                    connection = Connection(
                        id=str(uuid4()),
                        first_student_id=first_student_id,
                        second_student_id=second_student_id,
                        created_at=datetime.now(timezone.utc),
                    )
                    self._connections[pair_key] = connection
                    match_created = True

            return ReactionResult(
                reaction=reaction,
                connection=connection,
                match_created=match_created,
                already_reacted=False,
            )

    def list_matches(self, student_id: str) -> list[Connection]:
        with self._lock:
            return [
                connection
                for connection in self._connections.values()
                if student_id
                in (connection.first_student_id, connection.second_student_id)
            ]

    @staticmethod
    def _normalize_filter(value: str | None) -> str | None:
        return value.strip().casefold() if value and value.strip() else None
