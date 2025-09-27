from fastapi import APIRouter, Depends
from app.database import database
from app.models import notifications
from app.deps import get_current_user
from app.schemas import Message, NotificationRead

router = APIRouter()

@router.get("/notifications", response_model=list[NotificationRead])
async def get_notifications(current_user=Depends(get_current_user)):
    query = notifications.select().where(notifications.c.user_id == current_user["id"])
    return await database.fetch_all(query)

@router.put("/notifications/{notification_id}/read", response_model=Message)
async def mark_notification_read(notification_id: int, current_user=Depends(get_current_user)):
    query = notifications.update().where(
        (notifications.c.id == notification_id) &
        (notifications.c.user_id == current_user["id"])
    ).values(is_read=True)
    await database.execute(query)
    return {"message": "Notification marked as read"}

# ✅ Add your new mark-all endpoint here
@router.put("/notifications/mark-all-read", response_model=Message)
async def mark_all_notifications_read(current_user=Depends(get_current_user)):
    query = notifications.update().where(
        notifications.c.user_id == current_user["id"]
    ).values(is_read=True)
    await database.execute(query)
    return {"message": "All notifications marked as read"}
