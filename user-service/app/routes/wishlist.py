from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import database
from app.models import wishlist, items
from app.deps import get_current_user
from app.schemas import WishlistCreate, WishlistRead, Message
from sqlalchemy import select

router = APIRouter()

# =====================
# Customer → Add to Wishlist
# =====================
@router.post("/wishlist/", response_model=Message)
async def add_to_wishlist(data: WishlistCreate, current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can manage wishlist")

    # Check if item exists
    item_data = await database.fetch_one(items.select().where(items.c.id == data.item_id))
    if not item_data:
        raise HTTPException(status_code=404, detail="Item not found")

    # Prevent duplicates
    existing = await database.fetch_one(
        wishlist.select().where(
            (wishlist.c.customer_id == current_user["id"]) &
            (wishlist.c.item_id == data.item_id)
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Item already in wishlist")

    await database.execute(
        wishlist.insert().values(customer_id=current_user["id"], item_id=data.item_id)
    )
    return {"message": "Item added to wishlist"}

# =====================
# Customer → View Wishlist
# =====================
@router.get("/wishlist/", response_model=List[WishlistRead])
async def get_my_wishlist(current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view wishlist")

    query = (
    select(
        wishlist.c.id,
        wishlist.c.customer_id,
        wishlist.c.item_id,
        items.c.id.label("item_id"),
        items.c.title.label("item_title"),
        items.c.description.label("item_description"),
        items.c.price.label("item_price"),
        items.c.image_url.label("item_image_url"),
        items.c.owner_id.label("item_owner_id"),  # <-- Add this line
    )
    .select_from(wishlist.join(items, wishlist.c.item_id == items.c.id))
    .where(wishlist.c.customer_id == current_user["id"])
)
    results = await database.fetch_all(query)

    # Transform rows into nested dicts:
    wishlist_response = []
    for row in results:
        wishlist_response.append({
            "id": row["id"],
            "customer_id": row["customer_id"],
            "item": {
                "id": row["item_id"],
                "title": row["item_title"],
                "description": row["item_description"],
                "price": row["item_price"],
                "image_url": row["item_image_url"],
                "owner_id": row["item_owner_id"],  # Add this line
            }
        })

    print(wishlist_response)
    return wishlist_response


# =====================
# Customer → Remove from Wishlist
# =====================
@router.delete("/wishlist/{wishlist_id}", response_model=Message)
async def remove_from_wishlist(wishlist_id: int, current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can remove wishlist items")

    query = wishlist.delete().where(
        (wishlist.c.id == wishlist_id) &
        (wishlist.c.customer_id == current_user["id"])
    )
    result = await database.execute(query)

    if result == 0:
        raise HTTPException(status_code=404, detail="Wishlist item not found")

    return {"message": "Item removed from wishlist"}

