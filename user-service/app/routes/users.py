from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status, File, UploadFile, Form
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import os
from datetime import datetime
import secrets
from app.database import database
from app.models import users, user_profiles
from app.schemas import UserCreate, UserRead, UserLogin, UserUpdate, UserProfileInDBBase, UserProfileUpdateForm
from app.auth import (
    create_access_token,
    create_refresh_token,
    create_reset_password_token,
    verify_reset_password_token,
)
from app.crud import update_user, update_user_profile, get_user_profile, create_user_profile
from app.deps import get_current_user, get_current_admin_user
from app.email import send_reset_email, send_verification_email, send_welcome_email
import logging

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

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# =====================
# Create User
# =====================
@router.post("/users/", response_model=UserRead)
async def create_user(user: UserCreate, background_tasks: BackgroundTasks):
    query = users.select().where(users.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    role = user.role.lower() if user.role and user.role.lower() in ["admin", "shop_owner", "customer"] else "customer"

    verification_token = secrets.token_urlsafe(32)
    # Optionally add expiry: datetime.utcnow() + timedelta(hours=24)

    query = users.insert().values(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role,
        is_verified=False,
        verification_token=verification_token
    )
    user_id = await database.execute(query)

    # Send verification email in background
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://10.10.10.187:3000")
    verify_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    # background_tasks.add_task(send_verification_email, to_email=user.email, verify_link=verify_link)
    logging.info(f"Scheduling verification email to {user.email} with link {verify_link}")

    background_tasks.add_task(send_verification_email, to_email=user.email, verification_link=verify_link)


    return UserRead(id=user_id, username=user.username, email=user.email, role=role)


# =====================
# Verify Email
# =====================
@router.get("/verify-email")
async def verify_email(token: str):
    user = await database.fetch_one(users.select().where(users.c.verification_token == token))
    if not user:
        print("Token invalid or expired:", token)
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if user["is_verified"]:
        print("User already verified:", user["email"])
        return {"message": "Email already verified"}
    await database.execute(users.update().where(users.c.id == user["id"]).values(is_verified=True, verification_token=None))
    send_welcome_email(to_email=user["email"], username=user["username"])
    print("Verification successful for:", user["email"])
    return {"message": "Email successfully verified"}




# # =====================
# # Login
# # =====================
@router.post("/login/")
async def login(user: UserLogin):  # UserLogin now accepts 'identifier' (email or number) and 'password'
    # Try finding by email first
    query = users.select().where(users.c.email == user.identifier)
    db_user = await database.fetch_one(query)

    # If not found, try finding by mobile number via user_profiles
    if not db_user:
        profile_query = user_profiles.select().where(user_profiles.c.contact_number == user.identifier)
        profile = await database.fetch_one(profile_query)
        if profile:
            user_id = profile["user_id"]
            query = users.select().where(users.c.id == user_id)
            db_user = await database.fetch_one(query)

    # Check if user exists and is verified
    if not db_user or db_user["is_verified"] != 1:
        raise HTTPException(status_code=400, detail="Invalid email/number or user not verified")

    # Verify password
    if not pwd_context.verify(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Fetch profile picture info
    profile_query = user_profiles.select().where(user_profiles.c.user_id == db_user["id"])
    profile = await database.fetch_one(profile_query)
    profile_picture = profile["profile_picture"] if profile else None

    # Generate tokens and response (same as before)
    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={
            "sub": db_user["email"],
            "user_id": db_user["id"],
            "role": db_user["role"]
        },
        expires_delta=access_token_expires
    )

    refresh_token = create_refresh_token(
        data={
            "sub": db_user["email"],
            "user_id": db_user["id"],
            "role": db_user["role"]
        }
    )

    user_data = {
        "id": db_user["id"],
        "username": db_user["username"],
        "email": db_user["email"],
        "role": db_user["role"],
        "profile_picture": profile_picture,
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
async def update_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    # Check if email update is requested and email is new
    if user_update.email and user_update.email != current_user["email"]:
        query = users.select().where(users.c.email == user_update.email)
        existing_user = await database.fetch_one(query)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")

    # Call your update function to modify user
    updated_user = await update_user(current_user["id"], user_update)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return UserRead(
        id=updated_user["id"],
        username=updated_user["username"],
        email=updated_user["email"]
    )


# =====================
# Get Current User Profile
# =====================
@router.get("/me/profile", response_model=UserProfileInDBBase)
async def read_current_user_profile(current_user: dict = Depends(get_current_user)):
    try:
        # Fetch user core info (email)
        user_query = users.select().where(users.c.id == current_user["id"])
        user = await database.fetch_one(user_query)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch extended profile info
        profile_query = user_profiles.select().where(user_profiles.c.user_id == current_user["id"])
        profile = await database.fetch_one(profile_query)

        # Assemble combined response dict
        response = {
            "user_id": user["id"],
            "full_name": profile["full_name"] if profile else None,
            "profile_picture": profile["profile_picture"] if profile else None,
            "contact_number": profile["contact_number"] if profile else None,
            "date_of_birth": profile["date_of_birth"].isoformat() if profile and profile["date_of_birth"] else None,
            "bio": profile["bio"] if profile else None,
            "email": user["email"],
            "created_at": profile["created_at"] if profile else None,
            "updated_at": profile["updated_at"] if profile else None,
        }
        print(response, flush=True)
        return response
    except Exception as e:
        import logging
        logging.error(f"Error fetching user profile for user {current_user['id']}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# =====================
# Update Current User Profile
# =====================
@router.put("/me/profile", response_model=UserProfileInDBBase)
async def update_current_user_profile(
    full_name: str = Form(None, alias="fullName"),
    email: str = Form(...),
    contact_number: str = Form(None, alias="contactNumber"),
    date_of_birth: str = Form(None, alias="dateOfBirth"),
    bio: str = Form(None),
    image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user),
):
    # Validate if email update is requested
    if email != current_user["email"]:
        query = users.select().where(users.c.email == email)
        existing_user = await database.fetch_one(query)
        if existing_user and existing_user["id"] != current_user["id"]:
            raise HTTPException(status_code=400, detail="Email already in use")

        # Update email in users table
        await database.execute(
            users.update()
            .where(users.c.id == current_user["id"])
            .values(email=email)
        )

    # Prepare dictionary of update fields for user_profiles table
    update_data = {
        "full_name": full_name,
        "contact_number": contact_number,
        "bio": bio,
    }
    # parse date_of_birth string to date (optional)
    if date_of_birth:
        try:
            update_data["date_of_birth"] = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format for dateOfBirth, expected YYYY-MM-DD")

    # Handle uploaded profile picture file
    if image:
        image_dir = "static/profile_pictures"
        os.makedirs(image_dir, exist_ok=True)
        filepath = os.path.join(image_dir, image.filename)
        with open(filepath, "wb") as buffer:
            buffer.write(await image.read())
        update_data["profile_picture"] = f"/{filepath}"

    # Remove None values from update_data
    update_data = {k: v for k, v in update_data.items() if v is not None}

    # Check if user profile exists
    query = user_profiles.select().where(user_profiles.c.user_id == current_user["id"])
    existing_profile = await database.fetch_one(query)

    if existing_profile:
        # Update existing profile
        if update_data:  # Only update if data present
            await database.execute(
                user_profiles.update()
                .where(user_profiles.c.user_id == current_user["id"])
                .values(**update_data)
            )
    else:
        # Create new profile entry
        if not update_data:
            raise HTTPException(status_code=400, detail="No profile data to update")
        create_data = update_data
        create_data["user_id"] = current_user["id"]
        await database.execute(user_profiles.insert().values(**create_data))

    # Fetch updated data from both tables
    user = await database.fetch_one(users.select().where(users.c.id == current_user["id"]))
    profile = await database.fetch_one(user_profiles.select().where(user_profiles.c.user_id == current_user["id"]))

    # Return combined response, converting date_of_birth to ISO string if present
    return {
        "user_id": user["id"],
        "full_name": profile["full_name"] if profile else None,
        "profile_picture": profile["profile_picture"] if profile else None,
        "contact_number": profile["contact_number"] if profile else None,
        "date_of_birth": profile["date_of_birth"].isoformat() if profile and profile["date_of_birth"] else None,
        "bio": profile["bio"] if profile else None,
        "email": user["email"],
        "created_at": profile["created_at"] if profile else None,
        "updated_at": profile["updated_at"] if profile else None,
    }


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

# =====================
# Admin: Update User
# =====================
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
            "admin": "admin",
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

@router.put("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    user = await database.fetch_one(users.select().where(users.c.id == current_user["id"]))

    if not pwd_context.verify(data.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    hashed_new = pwd_context.hash(data.new_password)
    await database.execute(users.update().where(users.c.id == user["id"]).values(hashed_password=hashed_new))
    return {"message": "Password updated successfully"}