from __future__ import annotations

import os
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from core.conexion import (
    Connection,
    ConnectionService,
    ProfileNotFoundError,
    ReactionAlreadyRecordedError,
    ReactionResult,
    ReactionType,
    SelfReactionError,
)
from core.memoria import InMemoryStore
from core.perfil import Profile, ProfileFilters, ProfileService, ProfileUpdate
from core.usuario import AuthService, AuthenticatedStudent

load_dotenv(Path(__file__).with_name(".env"))
frontend_origins = os.getenv("FRONTEND_ORIGINS")
allowed_origins = (
    [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]
    if frontend_origins
    else ["http://localhost:5500", "http://127.0.0.1:5500"]
)

app = FastAPI(
    title="Tinder UD API",
    description="MVP API for student authentication, profiles, reactions, and matches.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)

store = InMemoryStore()
auth_service = AuthService(store, store)
profile_service = ProfileService(store, store)
connection_service = ConnectionService(store, store)
bearer_scheme = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)


class StudentIdentity(BaseModel):
    id: str
    email: str
    name: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student: StudentIdentity


class ProfileResponse(BaseModel):
    id: str
    student_id: str
    name: str
    biography: str
    faculty: str
    campus: str
    interests: list[str]


class ProfileUpdateRequest(BaseModel):
    biography: str
    faculty: str
    campus: str
    interests: list[str] = Field(default_factory=list)


class MatchResponse(BaseModel):
    id: str
    created_at: str
    other_student: ProfileResponse


class ReactionRequest(BaseModel):
    target_student_id: str = Field(min_length=1)
    type: ReactionType


class ReactionResponse(BaseModel):
    target_student_id: str
    type: ReactionType
    matched: bool
    match: MatchResponse | None = None


def require_student(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    student_id = auth_service.student_id_for_token(credentials.credentials)
    if student_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The access token is invalid or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return student_id


CurrentStudent = Annotated[str, Depends(require_student)]


@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest) -> LoginResponse:
    authenticated = auth_service.login(request.email, request.password)
    if authenticated is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return _login_response(authenticated)


@app.get("/profiles/me", response_model=ProfileResponse)
def get_own_profile(student_id: CurrentStudent) -> ProfileResponse:
    profile = profile_service.get_own_profile(student_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The authenticated student does not have a profile.",
        )
    return _profile_response(profile)


@app.put("/profiles/me", response_model=ProfileResponse)
def update_own_profile(
    request: ProfileUpdateRequest, student_id: CurrentStudent
) -> ProfileResponse:
    profile_update = ProfileUpdate(
        biography=request.biography,
        faculty=request.faculty,
        campus=request.campus,
        interests=tuple(request.interests),
    )
    profile = profile_service.update_own_profile(student_id, profile_update)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The authenticated student does not have a profile.",
        )
    return _profile_response(profile)


@app.get("/profiles", response_model=list[ProfileResponse])
def discover_profiles(
    student_id: CurrentStudent,
    faculty: str | None = None,
    campus: str | None = None,
    interest: str | None = None,
) -> list[ProfileResponse]:
    filters = _profile_filters(faculty, campus, interest)
    return [
        _profile_response(profile)
        for profile in profile_service.discover(student_id, filters)
    ]


@app.get("/profiles/search", response_model=list[ProfileResponse])
def search_profiles(
    student_id: CurrentStudent,
    faculty: str | None = None,
    campus: str | None = None,
    interest: str | None = None,
) -> list[ProfileResponse]:
    filters = _profile_filters(faculty, campus, interest)
    return [
        _profile_response(profile)
        for profile in profile_service.search(student_id, filters)
    ]


@app.post(
    "/reactions",
    response_model=ReactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def react_to_profile(
    request: ReactionRequest, student_id: CurrentStudent
) -> ReactionResponse:
    try:
        result = connection_service.react(
            student_id, request.target_student_id, request.type
        )
    except SelfReactionError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A student cannot react to their own profile.",
        ) from None
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The target student profile was not found.",
        ) from None
    except ReactionAlreadyRecordedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A reaction for this profile has already been recorded.",
        ) from None
    return _reaction_response(result, student_id)


@app.get("/matches", response_model=list[MatchResponse])
def get_matches(student_id: CurrentStudent) -> list[MatchResponse]:
    matches = connection_service.get_matches(student_id)
    responses: list[MatchResponse] = []
    for connection in matches:
        other_student_id = _other_student_id(connection, student_id)
        profile = profile_service.get_own_profile(other_student_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="A matched student profile is missing.",
            )
        responses.append(
            MatchResponse(
                id=connection.id,
                created_at=connection.created_at.isoformat(),
                other_student=_profile_response(profile),
            )
        )
    return responses


def _login_response(student: AuthenticatedStudent) -> LoginResponse:
    return LoginResponse(
        access_token=student.access_token,
        student=StudentIdentity(
            id=student.id,
            email=student.email,
            name=student.name,
        ),
    )


def _profile_response(profile: Profile) -> ProfileResponse:
    return ProfileResponse(
        id=profile.id,
        student_id=profile.student_id,
        name=profile.name,
        biography=profile.biography,
        faculty=profile.faculty,
        campus=profile.campus,
        interests=list(profile.interests),
    )


def _reaction_response(
    result: ReactionResult, student_id: str
) -> ReactionResponse:
    match_response = None
    if result.connection is not None and result.match_created:
        match_response = _match_response_for_reaction(result.connection, student_id)
    return ReactionResponse(
        target_student_id=result.reaction.target_student_id,
        type=result.reaction.type,
        matched=result.match_created,
        match=match_response,
    )


def _match_response_for_reaction(
    connection: Connection, student_id: str
) -> MatchResponse:
    other_student_id = _other_student_id(connection, student_id)
    profile = profile_service.get_own_profile(other_student_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A matched student profile is missing.",
        )
    return MatchResponse(
        id=connection.id,
        created_at=connection.created_at.isoformat(),
        other_student=_profile_response(profile),
    )


def _other_student_id(connection: Connection, student_id: str) -> str:
    if connection.first_student_id == student_id:
        return connection.second_student_id
    return connection.first_student_id


def _profile_filters(
    faculty: str | None, campus: str | None, interest: str | None
) -> ProfileFilters:
    return ProfileFilters(faculty=faculty, campus=campus, interest=interest)