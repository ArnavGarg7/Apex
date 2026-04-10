"""
backend/dependencies.py
FastAPI dependency injection — Firebase token verification.
"""
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.services.firebase_service import verify_token

security = HTTPBearer()


async def require_auth(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Verify Firebase Bearer token.
    Raises 401 if missing or invalid.
    """
    token = credentials.credentials
    decoded = await verify_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail='Invalid or expired authentication token')
    return decoded
