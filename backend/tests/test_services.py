from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import unittest

from core.conexion import (
    ConnectionService,
    ReactionAlreadyRecordedError,
    ReactionType,
)
from core.memoria import InMemoryStore
from core.perfil import ProfileFilters, ProfileService, ProfileUpdate
from core.usuario import AuthService


class ApplicationServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.store = InMemoryStore()
        self.auth = AuthService(self.store, self.store)
        self.profiles = ProfileService(self.store, self.store)
        self.connections = ConnectionService(self.store, self.store)
        self.ana_id = self.auth.login("ana@demo.test", "Demo123!").id
        self.luis_id = self.auth.login("luis@demo.test", "Demo123!").id

    def test_login_rejects_invalid_password(self) -> None:
        self.assertIsNone(self.auth.login("ana@demo.test", "incorrect"))

    def test_profile_update_is_returned_by_profile_queries(self) -> None:
        updated = self.profiles.update_own_profile(
            self.ana_id,
            ProfileUpdate(
                biography="  New biography  ",
                faculty="Engineering",
                campus="Main",
                interests=(" music ", "music", "reading"),
            ),
        )

        self.assertIsNotNone(updated)
        self.assertEqual(updated.biography, "New biography")
        self.assertEqual(updated.interests, ("music", "reading"))
        self.assertEqual(
            self.profiles.get_own_profile(self.ana_id).faculty, "Engineering"
        )

    def test_reacted_profile_is_hidden_from_discovery_but_searchable(self) -> None:
        self.connections.react(self.ana_id, self.luis_id, ReactionType.DISLIKE)
        filters = ProfileFilters()

        self.assertNotIn(
            self.luis_id,
            {
                profile.student_id
                for profile in self.profiles.discover(self.ana_id, filters)
            },
        )
        self.assertIn(
            self.luis_id,
            {
                profile.student_id
                for profile in self.profiles.search(self.ana_id, filters)
            },
        )

    def test_mutual_likes_create_a_single_match(self) -> None:
        first_result = self.connections.react(
            self.ana_id, self.luis_id, ReactionType.LIKE
        )
        second_result = self.connections.react(
            self.luis_id, self.ana_id, ReactionType.LIKE
        )

        self.assertFalse(first_result.match_created)
        self.assertTrue(second_result.match_created)
        self.assertEqual(len(self.connections.get_matches(self.ana_id)), 1)
        self.assertEqual(len(self.connections.get_matches(self.luis_id)), 1)

    def test_concurrent_mutual_likes_still_create_one_match(self) -> None:
        barrier = Barrier(2)

        def react(student_id: str, target_student_id: str):
            barrier.wait()
            return self.connections.react(
                student_id, target_student_id, ReactionType.LIKE
            )

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(
                executor.map(
                    lambda pair: react(*pair),
                    (
                        (self.ana_id, self.luis_id),
                        (self.luis_id, self.ana_id),
                    ),
                )
            )

        self.assertEqual(sum(result.match_created for result in results), 1)
        self.assertEqual(len(self.connections.get_matches(self.ana_id)), 1)

    def test_dislike_does_not_create_a_match(self) -> None:
        self.connections.react(self.ana_id, self.luis_id, ReactionType.LIKE)
        result = self.connections.react(
            self.luis_id, self.ana_id, ReactionType.DISLIKE
        )

        self.assertFalse(result.match_created)
        self.assertEqual(self.connections.get_matches(self.ana_id), [])

    def test_reaction_cannot_be_changed_or_repeated(self) -> None:
        self.connections.react(self.ana_id, self.luis_id, ReactionType.LIKE)

        with self.assertRaises(ReactionAlreadyRecordedError):
            self.connections.react(self.ana_id, self.luis_id, ReactionType.DISLIKE)

        with self.assertRaises(ReactionAlreadyRecordedError):
            self.connections.react(self.ana_id, self.luis_id, ReactionType.LIKE)


if __name__ == "__main__":
    unittest.main()
