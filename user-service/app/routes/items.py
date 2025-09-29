from fastapi import APIRouter, Depends, HTTPException
from app.database import database
from app.models import items, users
from app.schemas import ItemCreate, ItemRead, Message
from typing import List
from app.deps import get_current_shop_owner, get_current_admin_user
from app.crud import create_notification

LOW_STOCK_THRESHOLD = 5
router = APIRouter()

# =====================
# Public → list all items
# =====================
@router.get("/items/", response_model=List[ItemRead])
async def list_items():
    query = items.select()
    results = await database.fetch_all(query)
    # Add low_stock_alert property
    return [
        {**dict(item), "low_stock_alert": item["stock"] < LOW_STOCK_THRESHOLD}
        for item in results
    ]


# =====================
# Shop Owner → list own items with low stock alert
# =====================
@router.get("/items/mine", response_model=List[ItemRead])
async def list_my_items(current_user=Depends(get_current_shop_owner)):
    query = items.select().where(items.c.owner_id == current_user["id"])
    results = await database.fetch_all(query)
    return [
        {**dict(item), "low_stock_alert": dict(item).get("stock", 0) < LOW_STOCK_THRESHOLD}
        for item in results
    ]

# =====================
# Admin → list all items with owner info and low stock alert
# =====================
@router.get("/admin/items", dependencies=[Depends(get_current_admin_user)])
async def admin_list_items():
    # print("Reached admin_list_items endpoint", flush=True)
    query = (
    items.outerjoin(users, items.c.owner_id == users.c.id)
    .select()
    .with_only_columns(
        items.c.id,
        items.c.title,
        items.c.description,
        items.c.price,
        items.c.stock,
        users.c.username.label("owner_username"),
        users.c.email.label("owner_email"),
    )
)

    results = await database.fetch_all(query)
    # print(results)
    return [
        {**dict(row), "low_stock_alert": dict(row).get("stock", 0) < LOW_STOCK_THRESHOLD}
        for row in results
    ]

# =====================
# Shop Owner → create new item with stock
# =====================
@router.post("/items/", response_model=ItemRead)
async def create_item(item: ItemCreate, current_user=Depends(get_current_shop_owner)):
    item_id = await database.execute(
        items.insert().values(
            title=item.title,
            description=item.description,
            price=item.price,
            stock=item.stock,
            image_url=item.image_url,  # <-- save image_url
            owner_id=current_user["id"],
        )
    )
    
    if item.stock < LOW_STOCK_THRESHOLD:
        await create_notification(
            user_id=current_user["id"],
            message=f"Low stock alert for '{item.title}' — only {item.stock} left.",
            send_email_alert=True,
            item_title=item.title,
            stock=item.stock,
        )
    
    return {
        **item.dict(),
        "id": item_id,
        "owner_id": current_user["id"],
        "low_stock_alert": item.stock < LOW_STOCK_THRESHOLD,
    }


# =====================
# Shop Owner & Admin → update item (including stock)
# =====================
@router.put("/items/{item_id}", response_model=ItemRead)
async def update_item(item_id: int, item: ItemCreate, current_user=Depends(get_current_shop_owner)):
    existing = await database.fetch_one(items.select().where(items.c.id == item_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")

    if existing["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this item")

    await database.execute(items.update().where(items.c.id == item_id).values(**item.dict()))

    # Low stock notification if dropped below threshold
    if item.stock < LOW_STOCK_THRESHOLD:
        await create_notification(
            user_id=existing["owner_id"],
            message=f"Low stock alert for '{item.title}' — only {item.stock} left.",
            send_email_alert=True,
            item_title=item.title,
            stock=item.stock
        )


    return {**item.dict(), "id": item_id, "owner_id": existing["owner_id"], "low_stock_alert": item.stock < LOW_STOCK_THRESHOLD}

# =====================
# Shop Owner & Admin → delete item
# =====================
@router.delete("/items/{item_id}", response_model=Message)
async def delete_item(item_id: int, current_user=Depends(get_current_shop_owner)):
    existing = await database.fetch_one(items.select().where(items.c.id == item_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")

    if existing["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")

    await database.execute(items.delete().where(items.c.id == item_id))
    return {"message": f"Item {item_id} deleted"}

# =====================
# Admin-only → delete item
# =====================
@router.delete("/admin/items/{item_id}", dependencies=[Depends(get_current_admin_user)], response_model=Message)
async def admin_delete_item(item_id: int):
    await database.execute(items.delete().where(items.c.id == item_id))
    return {"message": f"Admin deleted item {item_id}"}
