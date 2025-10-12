from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.database import database
from app.models import items, users, product_variants, variant_images
from app.schemas import ItemRead, Message, ProductVariantRead
from typing import List,Optional
from app.deps import get_current_shop_owner, get_current_admin_user, get_current_shop_owner_or_admin
from app.crud import create_notification
import os
import time

LOW_STOCK_THRESHOLD = 5
router = APIRouter()

# =====================
# Public → list all items
# =====================
@router.get("/items/", response_model=List[ItemRead])
async def list_items():
    try:
        items_results = await database.fetch_all(items.select())
        items_list = []
        for item in items_results:
            item_dict = dict(item)
            variants_results = await database.fetch_all(
                product_variants.select().where(product_variants.c.item_id == item["id"])
            )
            variants_list = []
            for variant in variants_results:
                variant_dict = dict(variant)
                images_results = await database.fetch_all(
                    variant_images.select()
                    .where(variant_images.c.variant_id == variant["id"])
                    .order_by(variant_images.c.display_order)
                )
                variant_dict["images"] = [img["image_url"] for img in images_results]
                variants_list.append(variant_dict)
            item_dict["variants"] = variants_list
            items_list.append(item_dict)
        return items_list
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e


# =====================
# Shop Owner → list own items with low stock alert and variants
# =====================
@router.get("/items/mine", response_model=List[ItemRead])
async def list_my_items(current_user=Depends(get_current_shop_owner)):
    # First, get all items
    items_query = items.select().where(items.c.owner_id == current_user["id"])
    items_results = await database.fetch_all(items_query)
    
    if not items_results:
        return []
    
    item_ids = [item["id"] for item in items_results]
    
    # Get all variants for these items
    variants_query = """
    SELECT 
        pv.*,
        (
            SELECT JSON_ARRAYAGG(
                vi.image_url
            )
            FROM variant_images vi
            WHERE vi.variant_id = pv.id
            ORDER BY vi.display_order
        ) as variant_images
    FROM product_variants pv
    WHERE pv.item_id IN :item_ids
    """
    
    variants_results = await database.fetch_all(
        variants_query, 
        {"item_ids": tuple(item_ids)}
    )
    
    # Organize variants by item_id and parse JSON
    variants_by_item = {}
    for variant in variants_results:
        item_id = variant["item_id"]
        if item_id not in variants_by_item:
            variants_by_item[item_id] = []
        
        # Parse the JSON string to Python list (list of image URLs)
        images_data = variant["variant_images"]
        if isinstance(images_data, str):
            import json
            try:
                images_list = json.loads(images_data)
            except json.JSONDecodeError:
                images_list = []
        else:
            images_list = images_data or []
        
        variant_data = {
            "id": variant["id"],
            "item_id": variant["item_id"],
            "size": variant["size"],
            "color": variant["color"],
            "price": float(variant["price"]) if variant["price"] else None,
            "stock": variant["stock"],
            "image_url": variant["image_url"],
            "images": images_list  # This should be List[str] - just image URLs
        }
        
        variants_by_item[item_id].append(variant_data)
    
    # Build final response
    response_items = []
    for item in items_results:
        item_variants = variants_by_item.get(item["id"], [])
        
        # Check for low stock alert (any variant has low stock)
        low_stock_alert = any(
            variant["stock"] is not None and variant["stock"] < LOW_STOCK_THRESHOLD
            for variant in item_variants
        )
        
        response_items.append({
            **dict(item),
            "variants": item_variants,
            "low_stock_alert": low_stock_alert
        })
    
    return response_items


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
# Public → get item details with variants
# =====================
@router.get("/items/{item_id}/detail")
async def get_item_detail(item_id: int):
    # Get base item
    item = await database.fetch_one(items.select().where(items.c.id == item_id))
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get variants
    variants = await database.fetch_all(
        product_variants.select().where(product_variants.c.item_id == item_id)
    )
    
    variants_with_images = []
    for variant in variants:
        # Get ALL images for this variant from variant_images table
        variant_images_list = await database.fetch_all(
            variant_images.select().where(variant_images.c.variant_id == variant["id"]).order_by(variant_images.c.display_order)
        )
        
        # Create list of all image URLs including the primary image_url
        all_images = [img["image_url"] for img in variant_images_list]
        
        variants_with_images.append({
            **dict(variant),
            "images": all_images  # This should include BOTH images
        })
    
    return {
        **dict(item),
        "variants": variants_with_images
    }

# =====================
# Admin → list all items with detailed variant info
# =====================
@router.get("/admin/items", dependencies=[Depends(get_current_admin_user)])
async def admin_list_items():
    # First get all items
    items_query = """
        SELECT 
            i.id,
            i.title,
            i.description,
            i.owner_id,
            u.username as owner_username,
            u.email as owner_email
        FROM items i
        LEFT JOIN users u ON i.owner_id = u.id
        ORDER BY i.id
    """
    
    items_results = await database.fetch_all(items_query)
    
    # Then get variants for each item
    items_with_variants = []
    for item in items_results:
        variants_query = """
            SELECT 
                pv.id,
                pv.color,
                pv.size,
                pv.price,
                pv.stock,
                (SELECT vi.image_url 
                 FROM variant_images vi 
                 WHERE vi.variant_id = pv.id 
                 ORDER BY vi.display_order ASC 
                 LIMIT 1) as image_url
            FROM product_variants pv
            WHERE pv.item_id = :item_id
            ORDER BY pv.id
        """
        variants = await database.fetch_all(
            query=variants_query, 
            values={"item_id": item["id"]}
        )
        
        total_stock = sum(variant["stock"] or 0 for variant in variants)
        prices = [variant["price"] for variant in variants if variant["price"] is not None]
        
        items_with_variants.append({
            "id": item["id"],
            "title": item["title"],
            "description": item["description"],
            "owner_id": item["owner_id"],
            "owner_username": item["owner_username"],
            "owner_email": item["owner_email"],
            "variants": variants,
            "variant_count": len(variants),
            "min_price": min(prices) if prices else None,
            "max_price": max(prices) if prices else None,
            "total_stock": total_stock,
            "low_stock_alert": total_stock < LOW_STOCK_THRESHOLD
        })
    
    return items_with_variants

# # =====================
# # Shop Owner → create new item with stock
# # =====================
@router.post("/items/", response_model=ItemRead)
async def create_item(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    owner_id=Depends(get_current_shop_owner),
):
    item_id = await database.execute(
        items.insert().values(
            title=title,
            description=description,
            # stock=0,
            owner_id=owner_id["id"],
        )
    )
    return {
        "id": item_id,
        "title": title,
        "description": description,
        "owner_id": owner_id["id"],
        "low_stock_alert": False,
        "variants": [],
        "image_url": None,
    }


# ==================
# Shop Owner → update item (including stock)
# ==================
@router.put("/items/{item_id}", response_model=ItemRead)
async def update_item(
    item_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    current_user=Depends(get_current_shop_owner_or_admin),
):
    existing = await database.fetch_one(items.select().where(items.c.id == item_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this item")

    await database.execute(
        items.update()
        .where(items.c.id == item_id)
        .values(
            title=title,
            description=description,
        )
    )

    # Fetch updated item to return current stock/price should be computed on variants
    updated = await database.fetch_one(items.select().where(items.c.id == item_id))
    return {
        "id": updated["id"],
        "title": updated["title"],
        "description": updated["description"],
        "owner_id": updated["owner_id"],
        "price": 0,
        "stock": 0,
        "image_url": None,
        "low_stock_alert": False,
    }


# ===== Variant Routes with Multiple Images Support =====

@router.post("/items/{item_id}/variants/", response_model=ProductVariantRead)
async def create_variant(
    item_id: int,
    size: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    stock: int = Form(0),
    image: UploadFile = File(None),  # Single image (backward compatible)
    images: List[UploadFile] = File(None),  # Multiple images
    current_user=Depends(get_current_shop_owner_or_admin),
):
    # Validate item ownership
    existing_item = await database.fetch_one(items.select().where(items.c.id == item_id))
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing_item["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to add variants to this item")

    # Create variant first
    variant_id = await database.execute(
        product_variants.insert().values(
            item_id=item_id,
            size=size,
            color=color,
            price=price,
            stock=stock,
            image_url=None,
        )
    )

    # Handle image uploads - support both single and multiple
    image_urls = []
    all_images = []
    
    # Handle single image (backward compatible)
    if image and image.filename:
        all_images.append(image)
    
    # Handle multiple images
    if images:
        all_images.extend([img for img in images if img and img.filename])

    # Upload all images
    for i, img in enumerate(all_images):
        image_dir = "static/images/variants"
        os.makedirs(image_dir, exist_ok=True)
        file_extension = os.path.splitext(img.filename)[1]
        filename = f"variant_{variant_id}_{i}_{int(time.time())}{file_extension}"
        file_path = os.path.join(image_dir, filename)
        
        with open(file_path, "wb") as buffer:
            content = await img.read()
            buffer.write(content)
        
        image_url = f"/static/images/variants/{filename}"
        image_urls.append(image_url)
        
        # Insert into variant_images table
        await database.execute(
            variant_images.insert().values(
                variant_id=variant_id,
                image_url=image_url,
                display_order=i
            )
        )

    # Set first image as primary
    primary_image_url = image_urls[0] if image_urls else None
    if primary_image_url:
        await database.execute(
            product_variants.update()
            .where(product_variants.c.id == variant_id)
            .values(image_url=primary_image_url)
        )

    # Low stock notification
    if stock < LOW_STOCK_THRESHOLD:
        await create_notification(
            user_id=existing_item["owner_id"],
            message=f"Low stock alert for variant of '{existing_item['title']}' — only {stock} left.",
            send_email_alert=True,
            item_title=existing_item["title"],
            stock=stock,
        )

    # Fetch the created variant
    variant = await database.fetch_one(
        product_variants.select().where(product_variants.c.id == variant_id)
    )
    
    return {
        "id": variant_id,
        "item_id": item_id,
        "size": size,
        "color": color,
        "price": price,
        "stock": stock,
        "image_url": primary_image_url,
        "images": image_urls,
    }

@router.put("/variants/{variant_id}", response_model=ProductVariantRead)
async def update_variant(
    variant_id: int,
    size: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    stock: int = Form(...),
    images: List[UploadFile] = File(None),  # Allow adding more images during update
    current_user=Depends(get_current_shop_owner_or_admin),
):
    existing_variant = await database.fetch_one(product_variants.select().where(product_variants.c.id == variant_id))
    if not existing_variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    # Validate owner of base item
    base_item = await database.fetch_one(items.select().where(items.c.id == existing_variant["item_id"]))
    if base_item["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this variant")

    # Handle new image uploads if provided
    new_image_urls = []
    if images:
        # Get current highest display order
        current_images = await database.fetch_all(
            variant_images.select().where(variant_images.c.variant_id == variant_id).order_by(variant_images.c.display_order.desc())
        )
        next_order = current_images[0]["display_order"] + 1 if current_images else 0

        for i, image in enumerate(images):
            if image and image.filename:
                image_dir = "static/images/variants"
                os.makedirs(image_dir, exist_ok=True)
                file_extension = os.path.splitext(image.filename)[1]
                filename = f"variant_{variant_id}_{next_order + i}_{int(time.time())}{file_extension}"
                file_path = os.path.join(image_dir, filename)
                
                with open(file_path, "wb") as buffer:
                    content = await image.read()
                    buffer.write(content)
                
                image_url = f"/static/images/variants/{filename}"
                new_image_urls.append(image_url)
                
                await database.execute(
                    variant_images.insert().values(
                        variant_id=variant_id,
                        image_url=image_url,
                        display_order=next_order + i
                    )
                )

    # Update variant details
    await database.execute(
        product_variants.update().where(product_variants.c.id == variant_id).values(
            size=size,
            color=color,
            price=price,
            stock=stock,
            # Keep existing image_url unless new images were added
            image_url=existing_variant["image_url"] if not new_image_urls else new_image_urls[0]
        )
    )

    if stock < LOW_STOCK_THRESHOLD:
        await create_notification(
            user_id=base_item["owner_id"],
            message=f"Low stock alert for variant of '{base_item['title']}' — only {stock} left.",
            send_email_alert=True,
            item_title=base_item["title"],
            stock=stock,
        )

    # Fetch updated variant with all images
    updated_variant = await database.fetch_one(product_variants.select().where(product_variants.c.id == variant_id))
    variant_images_list = await database.fetch_all(
        variant_images.select().where(variant_images.c.variant_id == variant_id).order_by(variant_images.c.display_order)
    )
    all_images = [img["image_url"] for img in variant_images_list]

    return {
        **dict(updated_variant),
        "images": all_images
    }


@router.delete("/variants/{variant_id}", response_model=dict)
async def delete_variant(
    variant_id: int,
    current_user=Depends(get_current_shop_owner_or_admin),
):
    existing_variant = await database.fetch_one(product_variants.select().where(product_variants.c.id == variant_id))
    if not existing_variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    base_item = await database.fetch_one(items.select().where(items.c.id == existing_variant["item_id"]))
    if base_item["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this variant")

    await database.execute(product_variants.delete().where(product_variants.c.id == variant_id))
    return {"message": f"Variant {variant_id} deleted"}


# ===== New Image Management Routes =====

@router.get("/variants/{variant_id}/images")
async def get_variant_images(variant_id: int):
    """Get all images for a variant"""
    images = await database.fetch_all(
        variant_images.select().where(variant_images.c.variant_id == variant_id).order_by(variant_images.c.display_order)
    )
    return [dict(image) for image in images]


@router.post("/variants/{variant_id}/images")
async def add_variant_images(
    variant_id: int,
    images: List[UploadFile] = File(...),
    current_user=Depends(get_current_shop_owner_or_admin),
):
    """Add more images to an existing variant"""
    # Verify variant ownership
    existing_variant = await database.fetch_one(product_variants.select().where(product_variants.c.id == variant_id))
    if not existing_variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    base_item = await database.fetch_one(items.select().where(items.c.id == existing_variant["item_id"]))
    if base_item["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get current highest display order
    current_images = await database.fetch_all(
        variant_images.select().where(variant_images.c.variant_id == variant_id).order_by(variant_images.c.display_order.desc())
    )
    next_order = current_images[0]["display_order"] + 1 if current_images else 0

    image_urls = []
    for i, image in enumerate(images):
        if image and image.filename:
            image_dir = "static/images/variants"
            os.makedirs(image_dir, exist_ok=True)
            file_extension = os.path.splitext(image.filename)[1]
            filename = f"variant_{variant_id}_{next_order + i}_{int(time.time())}{file_extension}"
            file_path = os.path.join(image_dir, filename)
            
            with open(file_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)
            
            image_url = f"/static/images/variants/{filename}"
            image_urls.append(image_url)
            
            await database.execute(
                variant_images.insert().values(
                    variant_id=variant_id,
                    image_url=image_url,
                    display_order=next_order + i
                )
            )

    return {"message": f"Added {len(image_urls)} images", "images": image_urls}


@router.delete("/variant-images/{image_id}")
async def delete_variant_image(
    image_id: int,
    current_user=Depends(get_current_shop_owner_or_admin),
):
    """Delete a specific variant image"""
    image_record = await database.fetch_one(variant_images.select().where(variant_images.c.id == image_id))
    if not image_record:
        raise HTTPException(status_code=404, detail="Image not found")

    # Verify ownership through variant -> item
    variant = await database.fetch_one(product_variants.select().where(product_variants.c.id == image_record["variant_id"]))
    base_item = await database.fetch_one(items.select().where(items.c.id == variant["item_id"]))
    
    if base_item["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await database.execute(variant_images.delete().where(variant_images.c.id == image_id))
    
    # If this was the primary image, update the variant's image_url
    if variant["image_url"] == image_record["image_url"]:
        # Set the next available image as primary, or None if no images left
        remaining_images = await database.fetch_all(
            variant_images.select().where(variant_images.c.variant_id == variant["id"]).order_by(variant_images.c.display_order)
        )
        new_primary = remaining_images[0]["image_url"] if remaining_images else None
        
        await database.execute(
            product_variants.update()
            .where(product_variants.c.id == variant["id"])
            .values(image_url=new_primary)
        )

    return {"message": "Image deleted"}

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
