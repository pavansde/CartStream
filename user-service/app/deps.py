from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.auth import ACCESS_SECRET_KEY, ALGORITHM
from app.database import database
from app.models import users

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Generic: get current authenticated user (could be customer, owner, admin)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, ACCESS_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    query = users.select().where(users.c.email == email)
    user = await database.fetch_one(query)
    if user is None:
        raise credentials_exception
    return user


# Admin‑only
async def get_current_admin_user(token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    if user["role"].lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return user


# Shop owner‑only
async def get_current_shop_owner(token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    if user["role"].lower() != "shopowner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return user


# Customer‑only (regular users)
async def get_current_customer(token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    if user["role"].lower() != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return user
