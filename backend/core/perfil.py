from __future__ import annotations

from dataclasses import dataclass

from .contratos import InteractionRepository, ProfileRepository


@dataclass(frozen=True)
class Profile:
    id: str
    student_id: str
    name: str
    biography: str
    faculty: str
    campus: str
    interests: tuple[str, ...]


@dataclass(frozen=True)
class ProfileFilters:
    faculty: str | None = None
    campus: str | None = None
    interest: str | None = None


@dataclass(frozen=True)
class ProfileUpdate:
    biography: str
    faculty: str
    campus: str
    interests: tuple[str, ...]


class ProfileService:
    def __init__(
        self,
        profiles: ProfileRepository,
        interactions: InteractionRepository,
    ) -> None:
        self._profiles = profiles
        self._interactions = interactions

    def get_own_profile(self, student_id: str) -> Profile | None:
        return self._profiles.find_by_student_id(student_id)

    def update_own_profile(
        self, student_id: str, profile_update: ProfileUpdate
    ) -> Profile | None:
        normalized_update = ProfileUpdate(
            biography=profile_update.biography.strip(),
            faculty=profile_update.faculty.strip(),
            campus=profile_update.campus.strip(),
            interests=tuple(
                dict.fromkeys(
                    interest.strip()
                    for interest in profile_update.interests
                    if interest.strip()
                )
            ),
        )
        return self._profiles.update_for_student(student_id, normalized_update)

    def discover(
        self, student_id: str, filters: ProfileFilters
    ) -> list[Profile]:
        reacted_ids = self._interactions.list_reacted_student_ids(student_id)
        return [
            profile
            for profile in self._profiles.list_profiles(student_id, filters)
            if profile.student_id not in reacted_ids
        ]

    def search(
        self, student_id: str, filters: ProfileFilters
    ) -> list[Profile]:
        return self._profiles.list_profiles(student_id, filters)