from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.database import database
from app.models import carts, items, product_variants, variant_images
from app.schemas import CartItemAdd, CartItemUpdate, CartItem, Message, ItemRead
from app.deps import get_current_user
import traceback
from sqlalchemy import select, and_

router = APIRouter()

# =====================
# Get current user's cart items
# =====================
@router.get("/", response_model=List[CartItem])
async def get_cart(current_user=Depends(get_current_user)):
    try:
        query = """
            SELECT 
                c.id,
                c.user_id,
                c.item_id,
                c.variant_id,
                c.quantity,
                i.title as item_title,
                i.description as item_description,
                i.owner_id as item_owner_id,
                -- Selected variant data
                pv.id as selected_variant_id,
                pv.item_id as selected_variant_item_id,  # Add this
                pv.color as selected_variant_color,
                pv.size as selected_variant_size,
                pv.price as selected_variant_price,
                pv.stock as selected_variant_stock,
                pv.image_url as selected_variant_image_url
            FROM carts c
            JOIN items i ON c.item_id = i.id
            LEFT JOIN product_variants pv ON c.variant_id = pv.id
            WHERE c.user_id = :user_id
            ORDER BY c.created_at DESC
        """
        results = await database.fetch_all(query, values={"user_id": current_user["id"]})

        cart_response = []
        for row in results:
            # Get all variants for this item
            variants_query = """
                SELECT 
                    pv.id,
                    pv.item_id,  # This is required for ProductVariantRead
                    pv.color,
                    pv.size, 
                    pv.price,
                    pv.stock,
                    pv.image_url
                FROM product_variants pv
                WHERE pv.item_id = :item_id
                ORDER BY pv.id
            """
            item_variants = await database.fetch_all(
                variants_query, 
                values={"item_id": row["item_id"]}
            )
            
            # Build variants list for ItemRead
            variants_list = []
            for variant in item_variants:
                variants_list.append({
                    "id": variant["id"],
                    "item_id": variant["item_id"],  # Required field
                    "color": variant["color"],
                    "size": variant["size"],
                    "price": variant["price"],
                    "stock": variant["stock"],
                    "image_url": variant["image_url"]
                })
            
            # Use variant image if available
            image_url = row["selected_variant_image_url"]
            
            # Calculate low stock alert based on selected variant
            low_stock_alert = False
            if row["selected_variant_id"]:
                low_stock_alert = (row["selected_variant_stock"] or 0) < 10
            elif variants_list:
                low_stock_alert = (variants_list[0]["stock"] or 0) < 10
            
            cart_response.append({
                "id": row["id"],
                "quantity": row["quantity"],
                "variant_id": row["variant_id"],
                "item": {
                    "id": row["item_id"],
                    "title": row["item_title"],
                    "description": row["item_description"],
                    "owner_id": row["item_owner_id"],
                    "image_url": image_url,
                    "low_stock_alert": low_stock_alert,
                    "variants": variants_list
                },
                "item_id": row["item_id"],    # Add this field at top level
                "user_id": row["user_id"],    # Add this field at top level
            })


        return cart_response
    except Exception as e:
        print(f"Error in get_cart: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch cart items")


# =====================
# Add or update an item quantity in cart
# =====================
@router.post("/items", response_model=CartItem)
async def add_or_update_item(data: CartItemAdd, current_user=Depends(get_current_user)):
    try:
        print(f"🔧 add_or_update_item called with: {data}")
        
        # Validate item_id exists
        item_exists = await database.fetch_one(
            items.select().where(items.c.id == data.item_id)
        )
        if not item_exists:
            raise HTTPException(status_code=400, detail="Invalid item_id: item not found")

        # Validate variant_id exists if provided
        if data.variant_id is not None:
            variant_exists = await database.fetch_one(
                product_variants.select().where(
                    and_(
                        product_variants.c.id == data.variant_id,
                        product_variants.c.item_id == data.item_id
                    )
                )
            )
            if not variant_exists:
                raise HTTPException(status_code=400, detail="Invalid variant_id: variant not found for this item")

        # Check for existing cart item
        existing_query = carts.select().where(
            and_(
                carts.c.user_id == current_user["id"],
                carts.c.item_id == data.item_id,
                carts.c.variant_id == data.variant_id
            )
        )
        existing = await database.fetch_one(existing_query)

        if existing:
            # Update existing cart item
            print(f"🔄 Updating existing cart item {existing['id']}")
            update_query = (
                carts.update()
                .where(
                    and_(
                        carts.c.user_id == current_user["id"],
                        carts.c.item_id == data.item_id,
                        carts.c.variant_id == data.variant_id
                    )
                )
                .values(quantity=data.quantity)
            )
            await database.execute(update_query)
            cart_item_id = existing["id"]
        else:
            # Create new cart item
            print(f"🆕 Creating new cart item")
            insert_query = carts.insert().values(
                user_id=current_user["id"],
                item_id=data.item_id,
                variant_id=data.variant_id,
                quantity=data.quantity
            )
            cart_item_id = await database.execute(insert_query)

        # Fetch the complete cart item for response
        cart_query = """
            SELECT 
                c.id,
                c.user_id,
                c.item_id,
                c.variant_id,
                c.quantity,
                i.title as item_title,
                i.description as item_description,
                i.owner_id as item_owner_id,
                pv.id as selected_variant_id,
                pv.item_id as selected_variant_item_id,  # Add this
                pv.color as selected_variant_color,
                pv.size as selected_variant_size,
                pv.price as selected_variant_price,
                pv.stock as selected_variant_stock,
                pv.image_url as selected_variant_image_url
            FROM carts c
            JOIN items i ON c.item_id = i.id
            LEFT JOIN product_variants pv ON c.variant_id = pv.id
            WHERE c.id = :cart_item_id
        """
        cart_item_data = await database.fetch_one(
            cart_query,
            values={"cart_item_id": cart_item_id}
        )

        if not cart_item_data:
            raise HTTPException(status_code=404, detail="Cart item not found after creation")

        # Get all variants for this item
        variants_query = """
            SELECT 
                pv.id,
                pv.item_id,  # This is required for ProductVariantRead
                pv.color,
                pv.size, 
                pv.price,
                pv.stock,
                pv.image_url
            FROM product_variants pv
            WHERE pv.item_id = :item_id
            ORDER BY pv.id
        """
        item_variants = await database.fetch_all(
            variants_query, 
            values={"item_id": cart_item_data["item_id"]}
        )
        
        # Build variants list
        variants_list = []
        for variant in item_variants:
            variants_list.append({
                "id": variant["id"],
                "item_id": variant["item_id"],  # Required field
                "color": variant["color"],
                "size": variant["size"],
                "price": variant["price"],
                "stock": variant["stock"],
                "image_url": variant["image_url"]
            })
        
        # Calculate low stock alert
        low_stock_alert = False
        if cart_item_data["selected_variant_id"]:
            low_stock_alert = (cart_item_data["selected_variant_stock"] or 0) < 10
        elif variants_list:
            low_stock_alert = (variants_list[0]["stock"] or 0) < 10

        # Create the response objects
        item_obj = ItemRead(
            id=cart_item_data["item_id"],
            title=cart_item_data["item_title"],
            description=cart_item_data["item_description"],
            owner_id=cart_item_data["item_owner_id"],
            image_url=cart_item_data["selected_variant_image_url"],
            low_stock_alert=low_stock_alert,
            variants=variants_list
        )

        cart_item_obj = CartItem(
            id=cart_item_data["id"],
            item=item_obj,
            quantity=cart_item_data["quantity"],
            variant_id=cart_item_data["variant_id"],
            item_id=cart_item_data["item_id"],
            user_id=cart_item_data["user_id"],
            created_at = cart_item_data["created_at"] if "created_at" in cart_item_data else None,
            updated_at = cart_item_data["updated_at"] if "updated_at" in cart_item_data else None

        )

        print(f"✅ Returning cart item: {cart_item_obj}")
        return cart_item_obj

    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Error in add_or_update_item: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to add/update cart item")


# =====================
# Remove an item from the cart
# =====================
@router.delete("/items/{cart_item_id}", response_model=Message)
async def remove_item(cart_item_id: int, current_user=Depends(get_current_user)):
    try:
        # First verify the cart item belongs to the current user
        cart_item = await database.fetch_one(
            carts.select().where(
                and_(
                    carts.c.id == cart_item_id,
                    carts.c.user_id == current_user["id"]
                )
            )
        )
        
        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        delete_query = carts.delete().where(
            and_(
                carts.c.id == cart_item_id,
                carts.c.user_id == current_user["id"]
            )
        )
        result = await database.execute(delete_query)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Cart item not found")
            
        return {"message": f"Cart item {cart_item_id} removed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in remove_item: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove cart item")


# =====================
# Replace entire cart items
# =====================
@router.put("/", response_model=List[CartItem])
async def replace_cart(items_data: List[CartItemAdd], current_user=Depends(get_current_user)):
    try:
        # Clear existing cart
        delete_query = carts.delete().where(carts.c.user_id == current_user["id"])
        await database.execute(delete_query)

        # Add new items
        for item_data in items_data:
            insert_query = carts.insert().values(
                user_id=current_user["id"],
                item_id=item_data.item_id,
                variant_id=item_data.variant_id,
                quantity=item_data.quantity
            )
            await database.execute(insert_query)

        return await get_cart(current_user=current_user)
    
    except Exception as e:
        print(f"Error in replace_cart: {e}")
        raise HTTPException(status_code=500, detail="Failed to replace cart")


# =====================
# Clear entire cart
# =====================
@router.delete("/", response_model=Message)
async def clear_cart(current_user=Depends(get_current_user)):
    try:
        delete_query = carts.delete().where(carts.c.user_id == current_user["id"])
        result = await database.execute(delete_query)
        
        return {"message": "Cart cleared successfully"}
    
    except Exception as e:
        print(f"Error in clear_cart: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cart")