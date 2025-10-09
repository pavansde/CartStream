from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.database import database
from app.models import items, users
from app.schemas import ItemCreate, ItemRead, Message
from typing import List
from app.deps import get_current_shop_owner, get_current_admin_user, get_current_shop_owner_or_admin
from app.crud import create_notification
import os

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
# Public → get item details by ID
# =====================
@router.get("/items/{item_id}", response_model=ItemRead)
async def get_item_detail(item_id: int):
    item = await database.fetch_one(items.select().where(items.c.id == item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {**dict(item), "low_stock_alert": item["stock"] < LOW_STOCK_THRESHOLD}



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
        items.c.image_url,
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
async def create_item(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    image: UploadFile = File(None),
    current_user=Depends(get_current_shop_owner),
):
    image_url = None
    if image:
        image_dir = "static/images"
        os.makedirs(image_dir, exist_ok=True)
        filename = os.path.join(image_dir, image.filename)
        with open(filename, "wb") as buffer:
            buffer.write(await image.read())
        image_url = f"/static/images/{image.filename}"

    item_id = await database.execute(
        items.insert().values(
            title=title,
            description=description,
            price=price,
            stock=stock,
            image_url=image_url,
            owner_id=current_user["id"],
        )
    )

    if stock < LOW_STOCK_THRESHOLD:
        await create_notification(
            user_id=current_user["id"],
            message=f"Low stock alert for '{title}' — only {stock} left.",
            send_email_alert=True,
            item_title=title,
            stock=stock,
        )

    return {
        "id": item_id,
        "title": title,
        "description": description,
        "price": price,
        "stock": stock,
        "image_url": image_url,
        "owner_id": current_user["id"],
        "low_stock_alert": stock < LOW_STOCK_THRESHOLD,
    }


# # =====================
# # Shop Owner & Admin → update item (including stock)
# # =====================
@router.put("/items/{item_id}", response_model=ItemRead)
async def update_item(
    item_id: int,
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    image: UploadFile = File(None),  # optional image upload
    current_user=Depends(get_current_shop_owner_or_admin),
):
    existing = await database.fetch_one(items.select().where(items.c.id == item_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this item")

    image_url = existing["image_url"]
    if image:
        # Save uploaded new image file
        import os
        image_dir = "static/images"
        os.makedirs(image_dir, exist_ok=True)
        filename = os.path.join(image_dir, image.filename)
        with open(filename, "wb") as buffer:
            buffer.write(await image.read())
        image_url = f"/static/images/{image.filename}"

    # Update item in DB with new data and possibly new image_url
    await database.execute(
        items.update()
        .where(items.c.id == item_id)
        .values(
            title=title,
            description=description,
            price=price,
            stock=stock,
            image_url=image_url,
        )
    )

    if stock < LOW_STOCK_THRESHOLD:
        await create_notification(
            user_id=existing["owner_id"],
            message=f"Low stock alert for '{title}' — only {stock} left.",
            send_email_alert=True,
            item_title=title,
            stock=stock,
        )

    return {
        "id": item_id,
        "title": title,
        "description": description,
        "price": price,
        "stock": stock,
        "image_url": image_url,
        "owner_id": existing["owner_id"],
        "low_stock_alert": stock < LOW_STOCK_THRESHOLD,
    }

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
