from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import database
from app.models import carts, items
from app.schemas import CartItemAdd, CartItemUpdate, CartItem, Message, ItemRead
from app.deps import get_current_user
from sqlalchemy import select

router = APIRouter()

# =====================
# Get current user's cart items
# =====================
@router.get("/", response_model=List[CartItem])
async def get_cart(current_user=Depends(get_current_user)):
    query = (
        select(
            carts.c.id,
            carts.c.user_id,
            carts.c.item_id,
            carts.c.quantity,
            items.c.id.label("item_id"),
            items.c.title.label("item_title"),
            items.c.description.label("item_description"),
            items.c.price.label("item_price"),
            items.c.stock.label("item_stock"),
            items.c.owner_id.label("item_owner_id"),
            items.c.image_url.label("item_image_url"),
        )
        .select_from(carts.join(items, carts.c.item_id == items.c.id))
        .where(carts.c.user_id == current_user["id"])
    )
    results = await database.fetch_all(query)

    cart_response = []
    for row in results:
        cart_response.append({
            "id": row["id"],
            "quantity": row["quantity"],
            "item": {
                "id": row["item_id"],
                "title": row["item_title"],
                "description": row["item_description"],
                "price": row["item_price"],
                "stock": row["item_stock"],
                "owner_id": row["item_owner_id"],
                "image_url": row["item_image_url"],
                "low_stock_alert": False,  # calculate if needed
            },
        })

    return cart_response


# =====================
# Add or update an item quantity in cart
# =====================
@router.post("/items", response_model=CartItem)
async def add_or_update_item(data: CartItemAdd, current_user=Depends(get_current_user)):
    # Validate item_id exists
    item_exists = await database.fetch_one(items.select().where(items.c.id == data.item_id))
    if not item_exists:
        raise HTTPException(status_code=400, detail="Invalid item_id: item not found")

    existing_query = carts.select().where(
        (carts.c.user_id == current_user["id"]) & (carts.c.item_id == data.item_id)
    )
    existing = await database.fetch_one(existing_query)

    if existing:
        update_query = (
            carts.update()
            .where((carts.c.user_id == current_user["id"]) & (carts.c.item_id == data.item_id))
            .values(quantity=data.quantity)
        )
        await database.execute(update_query)
        cart_item_id = existing["id"]
    else:
        insert_query = carts.insert().values(
            user_id=current_user["id"], item_id=data.item_id, quantity=data.quantity
        )
        cart_item_id = await database.execute(insert_query)

    # Fetch item for response construction
    item = await database.fetch_one(items.select().where(items.c.id == data.item_id))

    item_obj = ItemRead(
        id=item["id"],
        title=item["title"],
        price=item["price"],
        stock=item["stock"],
        owner_id=item["owner_id"] if "owner_id" in item else 0,
        image_url=item["image_url"] if "image_url" in item else None,
        low_stock_alert=False,
    )

    cart_item_obj = CartItem(
        id=cart_item_id,
        item=item_obj,
        quantity=data.quantity,
    )
    return cart_item_obj

# =====================
# Remove an item from the cart
# =====================
@router.delete("/items/{cart_item_id}", response_model=Message)
async def remove_item(cart_item_id: int, current_user=Depends(get_current_user)):
    delete_query = carts.delete().where(
        (carts.c.id == cart_item_id) & (carts.c.user_id == current_user["id"])
    )
    result = await database.execute(delete_query)
    if result == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": f"Cart item {cart_item_id} removed successfully"}




# =====================
# Replace entire cart items
# =====================
@router.put("/", response_model=List[CartItem])
async def replace_cart(items_data: List[CartItemAdd], current_user=Depends(get_current_user)):
    delete_query = carts.delete().where(carts.c.user_id == current_user["id"])
    await database.execute(delete_query)

    for item_data in items_data:
        insert_query = carts.insert().values(
            user_id=current_user["id"], item_id=item_data.item_id, quantity=item_data.quantity
        )
        await database.execute(insert_query)

    return await get_cart(current_user=current_user)

# =====================
# Clear entire cart
# =====================
@router.delete("/", response_model=Message)
async def clear_cart(current_user=Depends(get_current_user)):
    delete_query = carts.delete().where(carts.c.user_id == current_user["id"])
    await database.execute(delete_query)
    return {"message": "Cart cleared"}
