from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import os

# ======================
# Config - use ENV vars in production
# ======================
ACCESS_SECRET_KEY = os.getenv("ACCESS_SECRET_KEY", "change_this_access_key")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "change_this_refresh_key")

ALGORITHM = "HS256"

# Expiry settings (configurable via env vars)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))   # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))        # 7 days
RESET_PASSWORD_EXPIRE_MINUTES = int(os.getenv("RESET_PASSWORD_EXPIRE_MINUTES", 15))

IST = timezone(timedelta(hours=5, minutes=30))

def now_ist_naive():
    now_ist = datetime.now(IST)
    now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")
    return datetime.strptime(now_str, "%Y-%m-%d %H:%M:%S")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a short-lived access JWT token signed with ACCESS_SECRET_KEY
    """
    to_encode = data.copy()
    expire = now_ist_naive() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, ACCESS_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a long-lived refresh JWT token signed with REFRESH_SECRET_KEY
    """
    to_encode = data.copy()
    expire = now_ist_naive() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_reset_password_token(email: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a password reset token containing the user's email as subject.
    """
    to_encode = {"sub": email}
    expire = now_ist_naive() + (expires_delta or timedelta(minutes=RESET_PASSWORD_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, ACCESS_SECRET_KEY, algorithm=ALGORITHM)  # use access secret by default
    return encoded_jwt

def verify_reset_password_token(token: str) -> Optional[str]:
    """
    Verifies reset token and returns email, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, ACCESS_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None
