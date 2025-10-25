from app.database import database
from app.models import users, notifications, user_profiles  
from passlib.context import CryptContext
from app.schemas import UserUpdate
from datetime import datetime, timezone, timedelta
from app.email_service import send_low_stock_email

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ======================
# Existing update_user
# ======================
async def update_user(user_id: int, user_update: UserUpdate):
    update_data = user_update.dict(exclude_unset=True)
    if 'password' in update_data:
        # Hash new password before saving
        update_data['hashed_password'] = pwd_context.hash(update_data.pop('password'))
    
    query = users.update().where(users.c.id == user_id).values(**update_data)
    await database.execute(query)
    
    select_query = users.select().where(users.c.id == user_id)
    updated_user = await database.fetch_one(select_query)
    return updated_user

# ======================
# Notifications CRUD
# ======================
async def create_notification(user_id: int, message: str, send_email_alert: bool = False, item_title: str = None, stock: int = None):
    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")
    now = datetime.strptime(now_str, "%Y-%m-%d %H:%M:%S")

    # Insert in DB with IST datetime naive
    query = notifications.insert().values(
        user_id=user_id,
        message=message,
        is_read=False,
        created_at=now
    )
    await database.execute(query)

    # Optional email alert
    if send_email_alert and item_title and stock is not None:
        owner = await database.fetch_one(users.select().where(users.c.id == user_id))
        if owner and owner["email"]:
            send_low_stock_email(owner["email"], item_title, stock)

async def get_user_notifications(user_id: int):
    query = notifications.select().where(notifications.c.user_id == user_id).order_by(notifications.c.created_at.desc())
    return await database.fetch_all(query)

async def mark_notification_read(notification_id: int, user_id: int):
    query = notifications.update().where(
        (notifications.c.id == notification_id) & (notifications.c.user_id == user_id)
    ).values(is_read=True)
    await database.execute(query)

# ======================
# User Profile CRUD
# ======================

async def get_user_profile(user_id: int):
    query = user_profiles.select().where(user_profiles.c.user_id == user_id)
    profile = await database.fetch_one(query)
    return profile


async def create_user_profile(user_id: int, profile_data: dict):
    profile_data["user_id"] = user_id
    query = user_profiles.insert().values(**profile_data)
    await database.execute(query)
    return await get_user_profile(user_id)


async def update_user_profile(user_id: int, profile_data: dict):
    query = user_profiles.update().where(user_profiles.c.user_id == user_id).values(**profile_data)
    await database.execute(query)
    return await get_user_profile(user_id)