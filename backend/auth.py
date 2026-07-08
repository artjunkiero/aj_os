"""Authentication utilities for ART JUNKIE OS."""
import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request, Depends

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])


def create_client_token(customer_id: str, phone: str) -> str:
    payload = {
        "sub": customer_id,
        "phone": phone,
        "role": "client",
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "type": "client",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response, access_token: str, refresh_token: str | None = None):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
    samesite="none",
        max_age=43200,
        path="/",
    )
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
    samesite="none",
            max_age=604800,
            path="/",
        )


def clear_auth_cookies(response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("client_token", path="/")


def set_client_cookie(response, token: str):
    response.set_cookie(
        key="client_token",
        value=token,
        httponly=True,
        secure=True,
    samesite="none",
        max_age=2592000,
        path="/",
    )


async def get_current_user(request: Request) -> dict:
    """Get current authenticated staff user."""
    from server import db  # local import to avoid circular
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Nu ești autentificat")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token invalid")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilizator inexistent")
        if not user.get("active", True):
            raise HTTPException(status_code=403, detail="Cont dezactivat")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesiunea a expirat")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalid")


def require_roles(*roles):
    async def _dep(user: dict = Depends(get_current_user)):
        if user["role"] not in roles and user["role"] != "super_admin":
            raise HTTPException(status_code=403, detail="Acces interzis")
        return user
    return _dep


async def get_current_client(request: Request) -> dict:
    from server import db
    token = request.cookies.get("client_token")
    if not token:
        raise HTTPException(status_code=401, detail="Portal client neautentificat")
    try:
        payload = decode_token(token)
        if payload.get("type") != "client":
            raise HTTPException(status_code=401, detail="Token invalid")
        customer = await db.customers.find_one({"id": payload["sub"]}, {"_id": 0})
        if not customer:
            raise HTTPException(status_code=401, detail="Client inexistent")
        return customer
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesiune expirată")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalid")
