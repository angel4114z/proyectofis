from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
from enum import Enum
from uuid import uuid4

from .contratos import (
    InteractionRepository,
    MessageRepository,
    ModerationRepository,
)
from .usuario import AccountRole, AccountStatus


class ReportCause(str, Enum):
    HARASSMENT = "acoso"
    SPAM = "spam"
    FAKE_PROFILE = "perfil_falso"
    INAPPROPRIATE_CONTENT = "contenido_inapropiado"
    OTHER = "otro"


class ReportStatus(str, Enum):
    PENDING = "pendiente"
    RESOLVED = "resuelto"
    DISCARDED = "descartado"


@dataclass(frozen=True)
class Report:
    id: str
    reporter_student_id: str
    reported_student_id: str
    connection_id: str
    cause: ReportCause
    description: str
    status: ReportStatus
    created_at: datetime
    resolved_at: datetime | None = None
    resolved_by: str | None = None


@dataclass(frozen=True)
class Notification:
    id: str
    student_id: str
    report_id: str
    message: str
    created_at: datetime


class ReportNotFoundError(Exception):
    pass


class ReportAlreadyResolvedError(Exception):
    pass


class InvalidReportError(Exception):
    pass


class ReportService:
    PENALTY_DURATION = timedelta(days=3)

    def __init__(
        self,
        reports: ModerationRepository,
        interactions: InteractionRepository,
        messages: MessageRepository,
    ) -> None:
        self._reports = reports
        self._interactions = interactions
        self._messages = messages

    def submit_report(
        self,
        reporter_student_id: str,
        reported_student_id: str,
        connection_id: str,
        cause: ReportCause,
        description: str,
    ) -> Report:
        if reporter_student_id == reported_student_id:
            raise InvalidReportError("A student cannot report themselves.")
        if cause is ReportCause.OTHER and not description.strip():
            raise InvalidReportError(
                "A description is required when the cause is 'other'."
            )
        reporter = self._reports.find_account_by_student_id(reporter_student_id)
        reported = self._reports.find_account_by_student_id(reported_student_id)
        if (
            reporter is None
            or reporter.role is not AccountRole.STUDENT
            or reported is None
            or reported.role is not AccountRole.STUDENT
        ):
            raise InvalidReportError("The reported student was not found.")
        connection = self._interactions.find_match(connection_id)
        if connection is None or {
            reporter_student_id,
            reported_student_id,
        } != {
            connection.first_student_id,
            connection.second_student_id,
        }:
            raise InvalidReportError(
                "A report can only be made against a participant in this chat."
            )

        report = Report(
            id=str(uuid4()),
            reporter_student_id=reporter_student_id,
            reported_student_id=reported_student_id,
            connection_id=connection_id,
            cause=cause,
            description=description.strip(),
            status=ReportStatus.PENDING,
            created_at=datetime.now(timezone.utc),
        )
        self._reports.create_report(report)
        return report

    def list_reports(self) -> list[Report]:
        return self._reports.list_reports()

    def messages_for_report(self, report: Report):
        return self._messages.list_messages(report.connection_id)

    def resolve_report(
        self,
        report_id: str,
        administrator_student_id: str,
        confirmed: bool,
    ) -> Report:
        report = self._reports.find_report(report_id)
        if report is None:
            raise ReportNotFoundError
        if report.status is not ReportStatus.PENDING:
            raise ReportAlreadyResolvedError

        now = datetime.now(timezone.utc)
        if confirmed:
            updated_report = replace(
                report,
                status=ReportStatus.RESOLVED,
                resolved_at=now,
                resolved_by=administrator_student_id,
            )
            reporter_message = (
                f"Tu reporte sobre {report.reported_student_id} fue confirmado. "
                "La cuenta fue suspendida."
            )
            reported_message = (
                "Tu cuenta fue suspendida tras la revisión de un reporte."
            )
            account_student_id = report.reported_student_id
            account_status = AccountStatus.SUSPENDED
            penalized_until = None
        else:
            updated_report = replace(
                report,
                status=ReportStatus.DISCARDED,
                resolved_at=now,
                resolved_by=administrator_student_id,
            )
            reporter_message = (
                "Tu reporte fue descartado. Tu cuenta queda penalizada durante "
                "3 días."
            )
            reported_message = "El reporte recibido sobre tu cuenta fue descartado."
            account_student_id = report.reporter_student_id
            account_status = AccountStatus.ACTIVE
            penalized_until = now + self.PENALTY_DURATION

        notifications = (
            Notification(
                id=str(uuid4()),
                student_id=report.reporter_student_id,
                report_id=report.id,
                message=reporter_message,
                created_at=now,
            ),
            Notification(
                id=str(uuid4()),
                student_id=report.reported_student_id,
                report_id=report.id,
                message=reported_message,
                created_at=now,
            ),
        )
        resolved_report = self._reports.complete_report_resolution(
            updated_report,
            account_student_id,
            account_status,
            penalized_until,
            notifications,
        )
        if resolved_report is not None:
            return resolved_report
        current_report = self._reports.find_report(report_id)
        if current_report is None:
            raise ReportNotFoundError
        raise ReportAlreadyResolvedError

    def list_notifications(self, student_id: str) -> list[Notification]:
        return self._reports.list_notifications(student_id)

    def reactivate_account(self, student_id: str) -> bool:
        account = self._reports.find_account_by_student_id(student_id)
        if (
            account is None
            or account.role is not AccountRole.STUDENT
            or account.account_status is not AccountStatus.SUSPENDED
        ):
            return False
        self._reports.set_account_status(
            student_id, AccountStatus.ACTIVE, penalized_until=None
        )
        return True

    def list_suspended_accounts(self):
        return [
            account
            for account in self._reports.list_accounts()
            if account.role is AccountRole.STUDENT
            and account.account_status is AccountStatus.SUSPENDED
        ]
