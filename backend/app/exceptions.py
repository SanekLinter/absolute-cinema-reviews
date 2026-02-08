from fastapi import HTTPException
from typing import Optional, Any


class AppException(HTTPException):
    status_code = 500
    default_detail = "Application error"
    
    def __init__(self, detail: Optional[str] = None, **kwargs: Any):
        super().__init__(
            status_code=self.status_code,
            detail=detail or self.default_detail,
            **kwargs
        )


class UserNotFoundError(AppException):
    status_code = 404
    default_detail = "User not found"
    
    def __init__(self, detail: Optional[str] = None, **kwargs: Any):
        super().__init__(detail=detail, **kwargs)


class UserAlreadyExistsError(AppException):
    status_code = 400
    default_detail = "User already exists"
    
    def __init__(self, detail: Optional[str] = None, **kwargs: Any):
        super().__init__(detail=detail, **kwargs)


class AuthenticationError(AppException):
    status_code = 401
    default_detail = "Invalid credentials"
    
    def __init__(self, detail: Optional[str] = None, **kwargs: Any):
        headers = kwargs.pop('headers', {})
        headers.update({"WWW-Authenticate": "Bearer"})
        super().__init__(detail=detail, headers=headers, **kwargs)


class PermissionDeniedError(AppException):
    status_code = 403
    default_detail = "Permission denied"
    
    def __init__(self, detail: Optional[str] = None, **kwargs: Any):
        super().__init__(detail=detail, **kwargs)


class ReviewNotFoundError(AppException):
    status_code = 404
    default_detail = "Review not found"
    
    def __init__(self, detail: Optional[str] = None, **kwargs: Any):
        super().__init__(detail=detail, **kwargs)


class InvalidReviewStateError(AppException):
    status_code = 400
    default_detail = "Invalid review state"
    
    def __init__(self, detail: Optional[str] = None, **kwargs: Any):
        super().__init__(detail=detail, **kwargs)
