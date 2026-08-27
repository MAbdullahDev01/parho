import hmac

from fastapi import Header, HTTPException, status

from app.core.config import settings

# Checks to see if secret received from request is same as stored secret in settings. If not, raises 403 error.
def require_internal_secret(x_internal_secret: str | None = Header(default=None)) -> None:
    expected = settings.INTERNAL_API_SECRET
    if not expected or not x_internal_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Internal API access is not available.",
        )

    if not hmac.compare_digest(
        x_internal_secret.encode("utf-8"), expected.encode("utf-8")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Internal API access is not available.",
        )