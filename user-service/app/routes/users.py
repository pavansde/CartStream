from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import os

from app.database import database
from app.models import users
from app.schemas import UserCreate, UserRead, UserLogin, UserUpdate
from app.auth import (
    create_access_token,
    create_refresh_token,
    create_reset_password_token,
    verify_reset_password_token,
)
from app.crud import update_user
from app.deps import get_current_user, get_current_admin_user
from app.email import send_reset_email

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# =====================
# Request Models
# =====================
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# =====================
# Create User
# =====================
@router.post("/users/", response_model=UserRead)
async def create_user(user: UserCreate):
    query = users.select().where(users.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    # Default role is "customer" if not provided or invalid
    role = user.role.lower() if user.role and user.role.lower() in ["admin", "shop_owner", "customer"] else "customer"

    query = users.insert().values(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role
    )
    user_id = await database.execute(query)
    return UserRead(id=user_id, username=user.username, email=user.email)


# =====================
# Login
# =====================
@router.post("/login/")
async def login(user: UserLogin):
    query = users.select().where(users.c.email == user.email)
    db_user = await database.fetch_one(query)

    # Verify password
    if not db_user or not pwd_context.verify(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Create access token
    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={
            "sub": db_user["email"],
            "user_id": db_user["id"],
            "role": db_user["role"]  # role might be 'admin', 'shop_owner', 'customer'
        },
        expires_delta=access_token_expires
    )

    # Create refresh token
    refresh_token = create_refresh_token(
        data={
            "sub": db_user["email"],
            "user_id": db_user["id"],
            "role": db_user["role"]
        }
    )

    # Build user data for frontend
    user_data = {
        "id": db_user["id"],
        "username": db_user["username"],
        "email": db_user["email"],
        "role": db_user["role"]
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_data
    }


# =====================
# Get Current User
# =====================
@router.get("/me")
async def read_current_user(current_user: dict = Depends(get_current_user)):
    # Return full profile to keep user data consistent after refresh
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        # Add other fields if needed
    }

# =====================
# Update Profile
# =====================
@router.put("/me", response_model=UserRead)
async def update_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    if user_update.email and user_update.email != current_user["email"]:
        query = users.select().where(users.c.email == user_update.email)
        existing_user = await database.fetch_one(query)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")

    updated_user = await update_user(current_user["id"], user_update)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return UserRead(
        id=updated_user["id"],
        username=updated_user["username"],
        email=updated_user["email"]
    )

# =====================
# Admin: List Users
# =====================
@router.get("/users/", dependencies=[Depends(get_current_admin_user)])
async def list_all_users():
    query = users.select()
    return await database.fetch_all(query)

# =====================
# Admin: Delete User
# =====================
@router.delete("/users/{user_id}", dependencies=[Depends(get_current_admin_user)])
async def delete_user(user_id: int):
    query = users.delete().where(users.c.id == user_id)
    await database.execute(query)
    return {"message": f"User with id {user_id} deleted."}

# =====================
# Forgot Password
# =====================
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    email = request.email
    query = users.select().where(users.c.email == email)
    db_user = await database.fetch_one(query)

    reset_message = {"message": "If your email is registered, you will receive a password reset link."}

    if not db_user:
        return reset_message

    reset_token = create_reset_password_token(email)

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    background_tasks.add_task(send_reset_email, to_email=email, reset_link=reset_link)

    return reset_message

# =====================
# Reset Password
# =====================
@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest):
    email = verify_reset_password_token(data.token)
    if not email:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": "Invalid or expired token"})

    query = users.select().where(users.c.email == email)
    user = await database.fetch_one(query)
    if not user:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": "User not found"})

    hashed_password = pwd_context.hash(data.new_password)
    update_query = users.update().where(users.c.email == email).values(hashed_password=hashed_password)
    await database.execute(update_query)

    return {"message": "Password successfully reset"}

@router.put("/users/{user_id}", response_model=UserRead, dependencies=[Depends(get_current_admin_user)])
async def admin_update_user(user_id: int, user_update: UserUpdate):
    query = users.select().where(users.c.id == user_id)
    existing_user = await database.fetch_one(query)
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {}

    # Email update (unique check)
    if user_update.email and user_update.email != existing_user["email"]:
        email_check = await database.fetch_one(users.select().where(users.c.email == user_update.email))
        if email_check:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = user_update.email

    # Username update (unique check)
    if user_update.username and user_update.username != existing_user["username"]:
        user_check = await database.fetch_one(users.select().where(users.c.username == user_update.username))
        if user_check:
            raise HTTPException(status_code=400, detail="Username already in use")
        update_data["username"] = user_update.username

    # Password update (hash it)
    if user_update.password:
        update_data["hashed_password"] = pwd_context.hash(user_update.password)

    if user_update.role:
        role_map = {
            "admin": "Admin",
            "shopowner": "ShopOwner",
            "shop_owner": "ShopOwner",
            "shop owner": "ShopOwner",
            "customer": "Customer"
        }
        role_normalized = role_map.get(user_update.role.strip().lower())
    if not role_normalized:
        raise HTTPException(status_code=400, detail="Invalid role")
    update_data["role"] = role_normalized

    # Apply update if there is anything to change
    if update_data:
        await database.execute(
            users.update().where(users.c.id == user_id).values(**update_data)
        )

    updated_user = await database.fetch_one(users.select().where(users.c.id == user_id))
    return UserRead(**updated_user)
