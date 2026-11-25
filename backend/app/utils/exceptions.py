from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class CloudCartException(HTTPException):
    """Base application exception for CloudCart."""
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An internal server error occurred.",
        error_code: str = "INTERNAL_SERVER_ERROR",
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


class NotFoundException(CloudCartException):
    def __init__(self, resource: str = "Resource", identifier: Any = ""):
        detail = f"{resource} '{identifier}' was not found." if identifier else f"{resource} was not found."
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="RESOURCE_NOT_FOUND",
        )


class BadRequestException(CloudCartException):
    def __init__(self, detail: str = "Bad request parameters.", error_code: str = "BAD_REQUEST"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code=error_code,
        )


class UnauthorizedException(CloudCartException):
    def __init__(
        self,
        detail: str = "Could not validate authentication credentials.",
        headers: Optional[Dict[str, str]] = None,
    ):
        default_headers = {"WWW-Authenticate": "Bearer"}
        if headers:
            default_headers.update(headers)
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
            headers=default_headers,
        )


class ForbiddenException(CloudCartException):
    def __init__(self, detail: str = "You do not have permission to access this resource."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


class ConflictException(CloudCartException):
    def __init__(self, detail: str = "A resource conflict occurred."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="RESOURCE_CONFLICT",
        )
