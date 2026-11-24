from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from core.chat import (
    ChatService,
    EmptyMessageError,
    MatchNotFoundError,
    StudentOutsideMatchError,
)
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
from core.moderacion import (
    InvalidReportError,
    Report,
    ReportAlreadyResolvedError,
    ReportCause,
    ReportNotFoundError,
    ReportService,
)
from core.perfil import Profile, ProfileFilters, ProfileService, ProfileUpdate
from core.usuario import (
    AccountPenalizedError,
    AccountRole,
    AccountStatus,
    AccountSuspendedError,
    AuthService,
    AuthenticatedStudent,
    EmailAlreadyRegisteredError,
    InvalidEmailDomainError,
    Student,
    StudentRegistration,
    WeakPasswordError,
)

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
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

store = InMemoryStore()
admin_email = os.getenv("ADMIN_EMAIL")
admin_password = os.getenv("ADMIN_PASSWORD")
if bool(admin_email) != bool(admin_password):
    raise RuntimeError(
        "Set both ADMIN_EMAIL and ADMIN_PASSWORD to configure an administrator."
    )
if admin_email and admin_password:
    store.configure_administrator(admin_email, admin_password)
auth_service = AuthService(store, store)
profile_service = ProfileService(store, store)
connection_service = ConnectionService(store, store)
chat_service = ChatService(store, store)
report_service = ReportService(store, store, store)
bearer_scheme = HTTPBearer(auto_error=False)

upload_directory = Path(__file__).resolve().parent / "uploads"
upload_directory.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_directory), name="uploads")

MAX_PHOTO_SIZE = 5 * 1024 * 1024
MAX_CHAT_PHOTO_SIZE = 10 * 1024 * 1024
ALLOWED_PHOTO_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class LoginRequest(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)
    faculty: str = ""
    campus: str = ""
    biography: str = ""
    interests: list[str] = Field(default_factory=list)


class StudentIdentity(BaseModel):
    id: str
    email: str
    name: str
    role: AccountRole


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
    photo_url: str | None = None
    photo_urls: list[str] = Field(default_factory=list)


class ProfileUpdateRequest(BaseModel):
    biography: str
    faculty: str
    campus: str
    interests: list[str] = Field(default_factory=list)


class MatchResponse(BaseModel):
    id: str
    connection_id: str
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


class PhotoResponse(BaseModel):
    photo_url: str
    photo_urls: list[str]


class ChatPhotoResponse(BaseModel):
    photo_url: str


class MessageRequest(BaseModel):
    text: str = ""
    photo_url: str | None = None


class MessageResponse(BaseModel):
    id: str
    connection_id: str
    sender_student_id: str
    text: str
    photo_url: str | None = None
    created_at: str


class ReportRequest(BaseModel):
    target_student_id: str = Field(min_length=1)
    connection_id: str = Field(min_length=1)
    cause: ReportCause
    description: str = Field(default="", max_length=1000)


class ReportResolutionRequest(BaseModel):
    confirmed: bool


class AdminReportResponse(BaseModel):
    id: str
    reporter_student_id: str
    reporter_name: str
    reported_student_id: str
    reported_name: str
    connection_id: str
    cause: ReportCause
    description: str
    status: str
    created_at: str
    resolved_at: str | None
    resolved_by: str | None
    messages: list[MessageResponse]


class NotificationResponse(BaseModel):
    id: str
    report_id: str
    message: str
    created_at: str


class ModeratedAccountResponse(BaseModel):
    student_id: str
    name: str
    email: str
    status: AccountStatus


class ReportCreatedResponse(BaseModel):
    id: str
    status: str
    message: str


class ReportResolutionResponse(BaseModel):
    id: str
    status: str
    message: str


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
    try:
        auth_service.ensure_account_access(student_id)
    except AccountSuspendedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is suspended.",
        ) from None
    except AccountPenalizedError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is penalized until {error.penalized_until.isoformat()}.",
        ) from None
    return student_id


CurrentStudent = Annotated[str, Depends(require_student)]


def require_administrator(student_id: CurrentStudent) -> str:
    account = auth_service.account_for_student_id(student_id)
    if account is None or account.role is not AccountRole.ADMINISTRATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required.",
        )
    return student_id


CurrentAdministrator = Annotated[str, Depends(require_administrator)]


@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest) -> LoginResponse:
    try:
        authenticated = auth_service.login(request.email, request.password)
    except AccountSuspendedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta está suspendida por decisión administrativa.",
        ) from None
    except AccountPenalizedError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "La cuenta está penalizada hasta "
                f"{error.penalized_until.isoformat()}."
            ),
        ) from None
    if authenticated is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return _login_response(authenticated)


@app.get("/auth/me", response_model=StudentIdentity)
def get_authenticated_identity(student_id: CurrentStudent) -> StudentIdentity:
    account = auth_service.account_for_student_id(student_id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The authenticated account was not found.",
        )
    return _student_identity(account)


@app.post(
    "/auth/register",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(request: RegisterRequest) -> LoginResponse:
    registration = StudentRegistration(
        email=request.email,
        name=request.name,
        password=request.password,
        faculty=request.faculty,
        campus=request.campus,
        biography=request.biography,
        interests=tuple(request.interests),
    )
    try:
        authenticated = auth_service.register(registration)
    except InvalidEmailDomainError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Solo se permiten correos @gmail.com o @hotmail.com.",
        ) from None
    except WeakPasswordError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La contraseña debe tener al menos 8 caracteres.",
        ) from None
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta registrada con este correo.",
        ) from None
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
                connection_id=connection.id,
                created_at=connection.created_at.isoformat(),
                other_student=_profile_response(profile),
            )
        )
    return responses


@app.post(
    "/reports",
    response_model=ReportCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_chat_report(
    request: ReportRequest, student_id: CurrentStudent
) -> ReportCreatedResponse:
    try:
        report = report_service.submit_report(
            reporter_student_id=student_id,
            reported_student_id=request.target_student_id,
            connection_id=request.connection_id,
            cause=request.cause,
            description=request.description,
        )
    except InvalidReportError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from None
    return ReportCreatedResponse(
        id=report.id,
        status=report.status.value,
        message="El reporte fue enviado para revisión.",
    )


@app.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(student_id: CurrentStudent) -> list[NotificationResponse]:
    return [
        NotificationResponse(
            id=notification.id,
            report_id=notification.report_id,
            message=notification.message,
            created_at=notification.created_at.isoformat(),
        )
        for notification in report_service.list_notifications(student_id)
    ]


@app.get("/admin/reports", response_model=list[AdminReportResponse])
def get_admin_reports(
    administrator_id: CurrentAdministrator,
) -> list[AdminReportResponse]:
    reports = report_service.list_reports()
    return [
        _admin_report_response(report)
        for report in reports
    ]


@app.post(
    "/admin/reports/{report_id}/resolve",
    response_model=ReportResolutionResponse,
)
def resolve_admin_report(
    report_id: str,
    request: ReportResolutionRequest,
    administrator_id: CurrentAdministrator,
) -> ReportResolutionResponse:
    try:
        report = report_service.resolve_report(
            report_id,
            administrator_student_id=administrator_id,
            confirmed=request.confirmed,
        )
    except ReportNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The report was not found.",
        ) from None
    except ReportAlreadyResolvedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The report has already been resolved.",
        ) from None
    message = (
        "El reporte fue confirmado y la cuenta denunciada fue suspendida."
        if request.confirmed
        else "El reporte fue descartado y el denunciante fue penalizado por 3 días."
    )
    return ReportResolutionResponse(
        id=report.id,
        status=report.status.value,
        message=message,
    )


@app.get(
    "/admin/accounts/suspended",
    response_model=list[ModeratedAccountResponse],
)
def get_suspended_accounts(
    administrator_id: CurrentAdministrator,
) -> list[ModeratedAccountResponse]:
    return [
        ModeratedAccountResponse(
            student_id=account.id,
            name=account.name,
            email=account.email,
            status=account.account_status,
        )
        for account in report_service.list_suspended_accounts()
    ]


@app.post("/admin/accounts/{student_id}/reactivate", status_code=204)
def reactivate_suspended_account(
    student_id: str, administrator_id: CurrentAdministrator
) -> None:
    if not report_service.reactivate_account(student_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The suspended student account was not found.",
        )


@app.post("/profiles/me/photo", response_model=PhotoResponse)
async def upload_profile_photo(
    photo: Annotated[UploadFile, File()],
    student_id: CurrentStudent,
) -> PhotoResponse:
    if photo.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, and WebP images are allowed.",
        )

    content = await photo.read(MAX_PHOTO_SIZE + 1)
    if len(content) > MAX_PHOTO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="The profile photo must not exceed 5 MB.",
        )
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected photo is empty.",
        )
    if not _is_allowed_photo_signature(photo.content_type, content):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="The file contents do not match an allowed image format.",
        )

    old_profile = profile_service.get_own_profile(student_id)
    if old_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The authenticated student does not have a profile.",
        )
    extension = ALLOWED_PHOTO_TYPES[photo.content_type]
    profile_directory = upload_directory / _photo_stem(student_id)
    profile_directory.mkdir(parents=True, exist_ok=True)
    existing_photos = _profile_photo_paths(student_id)
    primary_photo = _primary_photo_path(student_id, existing_photos)
    if primary_photo is None:
        filename = f"{_photo_stem(student_id)}-primary-{uuid4().hex}{extension}"
    else:
        primary_photo = _promote_primary_photo(student_id, primary_photo)
        filename = f"profile-{uuid4().hex}{extension}"
    destination = profile_directory / filename
    temporary_destination = profile_directory / f".{uuid4().hex}.tmp"
    try:
        temporary_destination.write_bytes(content)
        temporary_destination.replace(destination)
    finally:
        temporary_destination.unlink(missing_ok=True)

    photo_url = _photo_url_for_path(destination)
    profile = profile_service.update_photo(student_id, photo_url)
    if profile is None:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The authenticated student does not have a profile.",
        )
    primary_photo_url = _photo_url_for_student(student_id)
    profile_service.update_photo(student_id, primary_photo_url)
    return PhotoResponse(
        photo_url=photo_url,
        photo_urls=_photo_urls_for_student(student_id),
    )


@app.delete(
    "/profiles/me/photo/{photo_filename}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_profile_photo_by_filename(
    photo_filename: str, student_id: CurrentStudent
) -> None:
    profile = profile_service.get_own_profile(student_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The authenticated student does not have a profile.",
        )
    photo_path = next(
        (
            path
            for path in _profile_photo_paths(student_id)
            if path.name == photo_filename
        ),
        None,
    )
    if photo_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The profile photo was not found.",
        )
    was_primary = _is_primary_photo(student_id, photo_path)
    photo_path.unlink()
    remaining_photos = _profile_photo_paths(student_id)
    if was_primary and remaining_photos:
        next_primary = _primary_photo_path(student_id, remaining_photos)
        if next_primary is not None:
            _promote_primary_photo(student_id, next_primary)
    _remove_empty_profile_directory(student_id)
    profile_service.update_photo(student_id, _photo_url_for_student(student_id))


@app.delete("/profiles/me/photo", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_photo(student_id: CurrentStudent) -> None:
    profile = profile_service.get_own_profile(student_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The authenticated student does not have a profile.",
        )
    _remove_other_profile_photos(student_id)
    profile_service.update_photo(student_id, None)


@app.post(
    "/matches/{connection_id}/photo",
    response_model=ChatPhotoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_chat_photo(
    connection_id: str,
    photo: Annotated[UploadFile, File()],
    student_id: CurrentStudent,
) -> ChatPhotoResponse:
    try:
        chat_service.list_messages(connection_id, student_id)
    except MatchNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The connection was not found.",
        ) from None
    except StudentOutsideMatchError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The authenticated student is not part of this connection.",
        ) from None

    if photo.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, and WebP images are allowed.",
        )

    content = await photo.read(MAX_CHAT_PHOTO_SIZE + 1)
    if len(content) > MAX_CHAT_PHOTO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="The chat photo must not exceed 10 MB.",
        )
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected photo is empty.",
        )
    if not _is_allowed_photo_signature(photo.content_type, content):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="The file contents do not match an allowed image format.",
        )

    extension = ALLOWED_PHOTO_TYPES[photo.content_type]
    chat_directory = upload_directory / "chat" / connection_id
    chat_directory.mkdir(parents=True, exist_ok=True)
    destination = chat_directory / f"msg-{student_id}-{uuid4().hex}{extension}"
    temporary_destination = chat_directory / f".{uuid4().hex}.tmp"
    try:
        temporary_destination.write_bytes(content)
        temporary_destination.replace(destination)
    finally:
        temporary_destination.unlink(missing_ok=True)

    return ChatPhotoResponse(photo_url=_photo_url_for_path(destination))


@app.get(
    "/matches/{connection_id}/messages",
    response_model=list[MessageResponse],
)
def get_match_messages(
    connection_id: str, student_id: CurrentStudent
) -> list[MessageResponse]:
    try:
        messages = chat_service.list_messages(connection_id, student_id)
    except MatchNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The connection was not found.",
        ) from None
    except StudentOutsideMatchError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The authenticated student is not part of this connection.",
        ) from None
    return [_message_response(message) for message in messages]


@app.post(
    "/matches/{connection_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_match_message(
    connection_id: str,
    request: MessageRequest,
    student_id: CurrentStudent,
) -> MessageResponse:
    try:
        message = chat_service.send_message(
            connection_id,
            student_id,
            request.text,
            photo_url=request.photo_url,
        )
    except MatchNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The connection was not found.",
        ) from None
    except StudentOutsideMatchError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The authenticated student is not part of this connection.",
        ) from None
    except EmptyMessageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The message cannot be empty.",
        ) from None
    return _message_response(message)


def _login_response(student: AuthenticatedStudent) -> LoginResponse:
    return LoginResponse(
        access_token=student.access_token,
        student=StudentIdentity(
            id=student.id,
            email=student.email,
            name=student.name,
            role=student.role,
        ),
    )


def _student_identity(student: Student) -> StudentIdentity:
    return StudentIdentity(
        id=student.id,
        email=student.email,
        name=student.name,
        role=student.role,
    )


def _admin_report_response(report: Report) -> AdminReportResponse:
    reporter = auth_service.account_for_student_id(report.reporter_student_id)
    reported = auth_service.account_for_student_id(report.reported_student_id)
    if reporter is None or reported is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A report references an account that no longer exists.",
        )
    return AdminReportResponse(
        id=report.id,
        reporter_student_id=report.reporter_student_id,
        reporter_name=reporter.name,
        reported_student_id=report.reported_student_id,
        reported_name=reported.name,
        connection_id=report.connection_id,
        cause=report.cause,
        description=report.description,
        status=report.status.value,
        created_at=report.created_at.isoformat(),
        resolved_at=report.resolved_at.isoformat() if report.resolved_at else None,
        resolved_by=report.resolved_by,
        messages=[
            _message_response(message)
            for message in report_service.messages_for_report(report)
        ],
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
        photo_url=_photo_url_for_student(profile.student_id),
        photo_urls=_photo_urls_for_student(profile.student_id),
    )


def _message_response(message) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        connection_id=message.connection_id,
        sender_student_id=message.sender_student_id,
        text=message.text,
        photo_url=message.photo_url,
        created_at=message.created_at.isoformat(),
    )


def _photo_stem(student_id: str) -> str:
    digest = hashlib.sha256(student_id.encode("utf-8")).hexdigest()
    return f"profile-{digest}"


def _profile_photo_paths(student_id: str) -> list[Path]:
    stem = _photo_stem(student_id)
    legacy_prefix = f"{student_id}-"
    legacy_paths = [
        path
        for path in upload_directory.iterdir()
        if path.is_file()
        and path.suffix in ALLOWED_PHOTO_TYPES.values()
        and (path.stem.startswith(f"{stem}-") or path.name.startswith(legacy_prefix))
    ]
    profile_directory = upload_directory / stem
    if profile_directory.is_dir():
        legacy_paths.extend(
            path
            for path in profile_directory.iterdir()
            if path.is_file() and path.suffix in ALLOWED_PHOTO_TYPES.values()
        )
    return legacy_paths


def _photo_url_for_student(student_id: str) -> str | None:
    paths = _profile_photo_paths(student_id)
    primary_photo = _primary_photo_path(student_id, paths)
    return _photo_url_for_path(primary_photo) if primary_photo else None


def _photo_urls_for_student(student_id: str) -> list[str]:
    paths = _profile_photo_paths(student_id)
    primary_photo = _primary_photo_path(student_id, paths)
    if primary_photo is None:
        return []
    remaining = sorted(
        (path for path in paths if path != primary_photo),
        key=lambda path: (path.stat().st_mtime_ns, path.name),
    )
    return [
        _photo_url_for_path(path) for path in [primary_photo, *remaining]
    ]


def _is_primary_photo(student_id: str, path: Path) -> bool:
    return path.stem.startswith(f"{_photo_stem(student_id)}-primary-")


def _primary_photo_path(
    student_id: str, paths: list[Path]
) -> Path | None:
    if not paths:
        return None
    marked_primary = next(
        (path for path in paths if _is_primary_photo(student_id, path)),
        None,
    )
    if marked_primary:
        return marked_primary
    return max(paths, key=lambda path: (path.stat().st_mtime_ns, path.name))


def _promote_primary_photo(student_id: str, path: Path) -> Path:
    if _is_primary_photo(student_id, path):
        return path
    destination = path.with_name(
        f"{_photo_stem(student_id)}-primary-{uuid4().hex}{path.suffix}"
    )
    path.replace(destination)
    return destination


def _photo_url_for_path(path: Path) -> str:
    modified_at = path.stat().st_mtime_ns
    relative_path = path.relative_to(upload_directory).as_posix()
    return f"/uploads/{relative_path}?v={modified_at}"


def _remove_other_profile_photos(
    student_id: str, keep: Path | None = None
) -> None:
    for path in _profile_photo_paths(student_id):
        if keep is None or path != keep:
            path.unlink(missing_ok=True)
    _remove_empty_profile_directory(student_id)


def _remove_empty_profile_directory(student_id: str) -> None:
    profile_directory = upload_directory / _photo_stem(student_id)
    if profile_directory.is_dir() and not any(profile_directory.iterdir()):
        profile_directory.rmdir()


def _is_allowed_photo_signature(content_type: str, content: bytes) -> bool:
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return content.startswith(b"RIFF") and content[8:12] == b"WEBP"
    return False


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
        connection_id=connection.id,
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