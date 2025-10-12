from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import database
from app.models import wishlist, items, product_variants, variant_images
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
# Customer → View Wishlist (simple approach)
# =====================
@router.get("/wishlist/", response_model=List[WishlistRead])
async def get_my_wishlist(current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view wishlist")

    # First get wishlist items
    wishlist_query = """
        SELECT w.id, w.customer_id, w.item_id
        FROM wishlist w
        WHERE w.customer_id = :customer_id
        ORDER BY w.id
    """
    wishlist_items = await database.fetch_all(
        wishlist_query, 
        values={"customer_id": current_user["id"]}
    )

    wishlist_response = []
    for wishlist_item in wishlist_items:
        # Get item details with first variant info
        item_query = """
            SELECT 
                i.title,
                i.description,
                i.owner_id,
                pv.price,
                pv.color,
                pv.size,
                (SELECT vi.image_url 
                 FROM variant_images vi 
                 WHERE vi.variant_id = pv.id 
                 ORDER BY vi.display_order ASC 
                 LIMIT 1) as image_url
            FROM items i
            LEFT JOIN product_variants pv ON i.id = pv.item_id
            WHERE i.id = :item_id
            ORDER BY pv.id
            LIMIT 1
        """
        item_data = await database.fetch_one(
            item_query, 
            values={"item_id": wishlist_item["item_id"]}
        )

        if item_data:
            # Build enhanced item title with variant info
            item_title = item_data["title"]
            variant_info = []
            if item_data["color"]:
                variant_info.append(item_data["color"])
            if item_data["size"]:
                variant_info.append(item_data["size"])
            
            if variant_info:
                item_title += f" ({', '.join(variant_info)})"
            
            wishlist_response.append({
                "id": wishlist_item["id"],
                "customer_id": wishlist_item["customer_id"],
                "item": {
                    "id": wishlist_item["item_id"],
                    "title": item_title,
                    "description": item_data["description"],
                    "price": item_data["price"],  # This might be None if no variants exist
                    "image_url": item_data["image_url"],
                    "owner_id": item_data["owner_id"],
                    "variant_color": item_data["color"],
                    "variant_size": item_data["size"],
                }
            })

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