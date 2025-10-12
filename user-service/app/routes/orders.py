from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from app.database import database
from app.models import orders, items, order_items, coupons, addresses, users, product_variants
from app.deps import get_current_user, get_current_shop_owner, get_current_admin_user
from app.schemas import OrderCreate, OrderRead, OrderUpdateStatus, Message, OrderItemRead, PaymentInitiateRequest, PhonePeWebhookPayload
from app.crud import create_notification
from datetime import datetime, timezone, timedelta
from app.email import send_order_confirmation, send_order_status_notification
import asyncio
import uuid



LOW_STOCK_THRESHOLD = 5
router = APIRouter()

# =====================
# Customer → Create Order (with stock update + low stock notification)
# =====================
@router.post("/orders/", response_model=Message)
async def create_order(order: OrderCreate, current_user=Depends(get_current_user)):
    print("Reached create_order endpoint", flush=True)
    print(f"Order data received: {order.dict()}", flush=True)

    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can place orders")

    if not (hasattr(order, "shipping_address") or hasattr(order, "shipping_address_id")):
        raise HTTPException(status_code=400, detail="Shipping address or shipping_address_id is required")

    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")
    now = datetime.strptime(now_str, "%Y-%m-%d %H:%M:%S")

    async with database.transaction():
        total_order_price = 0
        # Use a list to store item data instead of a map to handle same item_id with different variants
        item_data_list = []
        variant_data_map = {}
        
        for item in order.items:
            # Fetch base item data (no price/stock here anymore)
            item_data = await database.fetch_one(items.select().where(items.c.id == item.item_id))
            if not item_data:
                raise HTTPException(status_code=404, detail=f"Item {item.item_id} not found")
            
            # EVERY ITEM MUST HAVE A VARIANT IN THE NEW SCHEMA
            if not hasattr(item, "variant_id") or not item.variant_id:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Item {item.item_id} requires a variant selection. Please select color/size."
                )
            
            # Fetch variant data (price and stock are here now)
            variant_data = await database.fetch_one(
                product_variants.select().where(product_variants.c.id == item.variant_id)
            )
            if not variant_data:
                raise HTTPException(status_code=404, detail=f"Variant {item.variant_id} not found")
            
            if variant_data["item_id"] != item.item_id:
                raise HTTPException(status_code=400, detail=f"Variant {item.variant_id} does not belong to item {item.item_id}")
            
            # Check variant stock
            if variant_data["stock"] is not None and variant_data["stock"] < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Not enough stock for {item_data['title']} - {variant_data.get('color', 'selected variant')}. Only {variant_data['stock']} available."
                )
            
            # Use variant price (required since items table no longer has price)
            if variant_data["price"] is None:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Variant {item.variant_id} for item {item.item_id} has no price configured"
                )
            
            price_to_use = variant_data["price"]
            stock_to_check = variant_data["stock"]
            
            variant_data_map[item.variant_id] = variant_data
            
            # Store item data with unique identifier to handle same item_id with different variants
            item_key = f"{item.item_id}_{item.variant_id}"
            item_data_list.append({
                "item_key": item_key,
                "item_id": item.item_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "base_data": item_data,
                "stock": stock_to_check,
                "price": price_to_use
            })
            
            total_order_price += price_to_use * item.quantity
            print(f"Using variant {item.variant_id} for item {item.item_id}: stock={stock_to_check}, price={price_to_use}", flush=True)

        print(f"Total order price calculated: {total_order_price}", flush=True)

        inserted_address_id = None
        if hasattr(order, "shipping_address_id") and order.shipping_address_id:
            inserted_address_id = order.shipping_address_id
            print(f"Using existing shipping_address_id: {inserted_address_id}", flush=True)
        elif hasattr(order, "shipping_address") and order.shipping_address:
            try:
                address_values = order.shipping_address.dict()
                address_values["user_id"] = current_user["id"]

                query = (
                    addresses.select()
                    .where(addresses.c.user_id == current_user["id"])
                    .where(addresses.c.full_name == address_values["full_name"])
                    .where(addresses.c.phone == address_values["phone"])
                    .where(addresses.c.address_line1 == address_values["address_line1"])
                    .where(
                        (addresses.c.address_line2 == address_values.get("address_line2"))
                        | ((addresses.c.address_line2.is_(None)) & (address_values.get("address_line2") == ""))
                    )
                    .where(addresses.c.city == address_values["city"])
                    .where(addresses.c.state == address_values["state"])
                    .where(addresses.c.postal_code == address_values["postal_code"])
                    .where(addresses.c.country == address_values["country"])
                )
                existing_address = await database.fetch_one(query)

                if existing_address:
                    inserted_address_id = existing_address["id"]
                    print(f"Reusing existing address with id {inserted_address_id}", flush=True)
                else:
                    inserted_address_id = await database.execute(addresses.insert().values(**address_values))
                    print(f"Saved new shipping address with id {inserted_address_id} for user_id={current_user['id']}", flush=True)

            except Exception as e:
                print(f"Failed to save shipping address: {e}", flush=True)
                raise HTTPException(status_code=500, detail="Failed to save shipping address")
        else:
            raise HTTPException(status_code=400, detail="Shipping address data is required")

        discount_amount = 0.0
        coupon = None
        if hasattr(order, "coupon_code") and order.coupon_code:
            coupon = await database.fetch_one(coupons.select().where(coupons.c.code == order.coupon_code))
            print(f"Coupon fetched: {coupon}", flush=True)
            if coupon:
                if coupon.discount_type == "percentage":
                    discount_amount = total_order_price * (coupon.discount_value / 100)
                elif coupon.discount_type == "fixed":
                    discount_amount = coupon.discount_value
                discount_amount = min(discount_amount, total_order_price)
                print(f"Discount amount calculated: {discount_amount}", flush=True)

        shipping_charge = order.shipping_charge or 0.0
        print(f"Shipping charge applied: {shipping_charge}", flush=True)

        final_total_price = total_order_price - discount_amount + shipping_charge
        print(f"Final total price after discount and shipping: {final_total_price}", flush=True)
        transaction_id = getattr(order, "transaction_id", None)

        try:
            order_values = {
                "customer_id": current_user["id"],
                "status": "pending",
                "total_price": final_total_price,
                "order_date": now,
                "shipping_address_id": inserted_address_id,
            }
            if transaction_id:
                order_values["transaction_id"] = transaction_id
            if coupon:
                order_values["coupon_code"] = coupon.code
            order_id = await database.execute(orders.insert().values(**order_values))
            print(f"Inserted order with ID: {order_id}", flush=True)
        except Exception as e:
            print(f"Exception inserting order: {e}", flush=True)
            raise

        # Insert order items and update variant stocks - FIXED: Using item_data_list instead of order.items
        for item_data in item_data_list:
            line_total_price = item_data["price"] * item_data["quantity"]
            
            print(f"Inserting order item: order_id={order_id}, item_id={item_data['item_id']}, variant_id={item_data['variant_id']}, quantity={item_data['quantity']}, line_total_price={line_total_price}", flush=True)
            
            try:
                # Insert order item with variant information
                order_item_values = {
                    "order_id": order_id,
                    "item_id": item_data["item_id"],
                    "quantity": item_data["quantity"],
                    "line_total_price": line_total_price,
                    "variant_id": item_data["variant_id"],  # Always include variant_id now
                }
                
                await database.execute(order_items.insert().values(**order_item_values))
                print(f"Inserted order item for item_id={item_data['item_id']}, variant_id={item_data['variant_id']}", flush=True)
            except Exception as e:
                print(f"Exception inserting order item id={item_data['item_id']}: {e}", flush=True)
                raise
            
            # Update variant stock (stock is only in variants table now)
            new_stock = item_data["stock"] - item_data["quantity"]
            
            try:
                await database.execute(
                    product_variants.update()
                    .where(product_variants.c.id == item_data["variant_id"])
                    .values(stock=new_stock)
                )
                print(f"Updated variant stock for variant_id={item_data['variant_id']} to {new_stock}", flush=True)
            except Exception as e:
                print(f"Exception updating variant stock for variant_id={item_data['variant_id']}: {e}", flush=True)
                raise
            
            # Send low stock notification if needed
            if new_stock < LOW_STOCK_THRESHOLD:
                try:
                    item_title = item_data["base_data"]["title"]
                    variant = variant_data_map[item_data["variant_id"]]
                    
                    # Build variant description
                    variant_info = []
                    if variant["color"]:
                        variant_info.append(f"Color: {variant['color']}")
                    if variant["size"]:
                        variant_info.append(f"Size: {variant['size']}")
                    
                    variant_description = f" ({', '.join(variant_info)})" if variant_info else " (selected variant)"
                    
                    await create_notification(
                        user_id=item_data["base_data"]["owner_id"],
                        message=f"Low stock alert for '{item_title}{variant_description}' — only {new_stock} left.",
                        send_email_alert=True,
                        item_title=f"{item_title}{variant_description}",
                        stock=new_stock,
                    )
                    print(f"Sent low stock notification for item_id={item_data['item_id']}", flush=True)
                except Exception as e:
                    print(f"Exception sending notification for item_id={item_data['item_id']}: {e}", flush=True)

        # Increment coupon usage count atomically if coupon applied
        if coupon:
            try:
                new_used_count = (coupon.used_count or 0) + 1
                await database.execute(
                    coupons.update()
                    .where(coupons.c.id == coupon.id)
                    .values(used_count=new_used_count)
                )
                print(f"Coupon usage incremented to {new_used_count}", flush=True)
            except Exception as e:
                print(f"Error incrementing coupon usage: {e}", flush=True)

        # Prepare order summary for emails - FIXED: Using item_data_list
        order_summary_lines = []
        for item_data in item_data_list:
            variant = variant_data_map[item_data["variant_id"]]
            item_title = item_data["base_data"]["title"]
            
            # Add variant info to title
            variant_info = []
            if variant["color"]:
                variant_info.append(variant["color"])
            if variant["size"]:
                variant_info.append(variant["size"])
            
            if variant_info:
                item_title += f" ({', '.join(variant_info)})"
            
            line_total = item_data["price"] * item_data["quantity"]
            order_summary_lines.append(f"{item_title} x {item_data['quantity']} - ₹{line_total:.2f}")

        full_order_summary = "\n".join(order_summary_lines)
        total_amount_str = f"₹{final_total_price:.2f}"

        # Send confirmation to customer
        send_order_confirmation(
            to_email=current_user["email"],
            order_id=order_id,
            order_summary=full_order_summary,
            total_amount=total_amount_str,
            recipient_role="customer"
        )

        # Group items by shop owner - FIXED: Using item_data_list
        shop_owner_orders = {}
        for item_data in item_data_list:
            owner_id = item_data["base_data"]["owner_id"]
            if owner_id not in shop_owner_orders:
                shop_owner_orders[owner_id] = []
            shop_owner_orders[owner_id].append(item_data)

        # Send confirmation to each shop owner
        for owner_id, items_group in shop_owner_orders.items():
            owner = await database.fetch_one(users.select().where(users.c.id == owner_id))
            if not owner:
                continue
            
            shop_order_summary_lines = []
            shop_order_total = 0
            for item_data in items_group:
                variant = variant_data_map[item_data["variant_id"]]
                item_title = item_data["base_data"]["title"]
                
                # Add variant info to title for shop owner
                variant_info = []
                if variant["color"]:
                    variant_info.append(variant["color"])
                if variant["size"]:
                    variant_info.append(variant["size"])
                
                if variant_info:
                    item_title += f" ({', '.join(variant_info)})"
                
                line_total = item_data["price"] * item_data["quantity"]
                shop_order_total += line_total
                shop_order_summary_lines.append(f"{item_title} x {item_data['quantity']} - ₹{line_total:.2f}")
            
            shop_order_summary = "\n".join(shop_order_summary_lines)

            send_order_confirmation(
                to_email=owner["email"],
                order_id=order_id,
                order_summary=shop_order_summary,
                total_amount=f"₹{shop_order_total:.2f}",
                recipient_role="shopowner"
            )

    print("Order created successfully", flush=True)
    return {"message": "Order placed successfully"}


# # =====================
# # Customer → View Own Orders
# # =====================
@router.get("/orders/me", response_model=List[OrderRead])
async def view_my_orders(current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view their orders")

    # Fetch all orders for this customer
    query = orders.select().where(orders.c.customer_id == current_user["id"])
    order_rows = await database.fetch_all(query)

    orders_with_items = []
    for order in order_rows:
        # Fetch order items with complete variant information
        items_query = (
            order_items.select()
            .where(order_items.c.order_id == order.id)
            .join(items, items.c.id == order_items.c.item_id)
            .join(product_variants, product_variants.c.id == order_items.c.variant_id, isouter=True)
            .with_only_columns(
                order_items.c.id,
                order_items.c.item_id,
                order_items.c.quantity,
                order_items.c.variant_id,
                items.c.title.label("item_title"),
                product_variants.c.image_url.label("variant_image_url"),
                product_variants.c.color.label("variant_color"),
                product_variants.c.size.label("variant_size"),
                product_variants.c.price.label("variant_price"),
                order_items.c.line_total_price,
            )
        )
        item_rows = await database.fetch_all(items_query)

        # Map item_rows to schema dicts
        item_list = []
        for item in item_rows:
            # Build enhanced item title with variant info
            item_title = item.item_title
            variant_info = []
            if item.variant_color:
                variant_info.append(item.variant_color)
            if item.variant_size:
                variant_info.append(item.variant_size)
            
            if variant_info:
                item_title += f" ({', '.join(variant_info)})"
            
            item_data = {
                "id": item.id,
                "item_id": item.item_id,
                "quantity": item.quantity,
                "variant_id": item.variant_id,
                "item_title": item_title,  # Enhanced title with variant info
                "image_url": item.variant_image_url,  # Always use variant image
                "line_total_price": item.line_total_price,
                "variant_color": item.variant_color,
                "variant_size": item.variant_size,
                "variant_price": item.variant_price,
            }
            item_list.append(item_data)

        # Fetch shipping address for this order
        address_query = addresses.select().where(addresses.c.id == order.shipping_address_id)
        address_row = await database.fetch_one(address_query)
        shipping_address = None
        if address_row:
            shipping_address = {
                "id": address_row.id,
                "user_id": address_row.user_id,
                "full_name": address_row.full_name,
                "phone": address_row.phone,
                "address_line1": address_row.address_line1,
                "address_line2": address_row.address_line2,
                "city": address_row.city,
                "state": address_row.state,
                "postal_code": address_row.postal_code,
                "country": address_row.country,
                "is_default": address_row.is_default,
                "created_at": address_row.created_at,
                "updated_at": address_row.updated_at,
            }

        # Build result dict matching the OrderRead schema
        order_dict = dict(order)
        order_dict["items"] = item_list
        order_dict["shipping_address"] = shipping_address
        order_dict["total_price"] = order.total_price 
        orders_with_items.append(order_dict)

    return orders_with_items


# =====================
# Shop Owner → View Orders for Own Items
# =====================
@router.get("/shop-owner/orders", response_model=List[OrderRead])
async def shop_owner_orders(current_user=Depends(get_current_shop_owner)):
    # First, fetch all orders that contain items owned by this shop owner
    orders_query = """
        SELECT DISTINCT 
            o.id, o.customer_id, o.total_price, o.status, o.coupon_code, 
            o.shipping_address_id, o.order_date,
            owner.username as shop_owner_name  -- Add shop owner name
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN items i ON oi.item_id = i.id
        JOIN users owner ON i.owner_id = owner.id  -- Join with users table for shop owner
        WHERE i.owner_id = :owner_id
        ORDER BY o.order_date DESC
    """
    order_rows = await database.fetch_all(query=orders_query, values={"owner_id": current_user["id"]})

    orders_with_items = []
    for order in order_rows:
        # Fetch order items with complete variant information for items owned by this shop owner
        items_query = """
            SELECT 
                oi.id,
                oi.item_id,
                oi.quantity,
                oi.variant_id,
                oi.line_total_price,
                i.title AS item_title,
                pv.color AS variant_color,
                pv.size AS variant_size,
                pv.price AS variant_price,
                -- Get the primary variant image (first image by display_order)
                (SELECT vi.image_url 
                 FROM variant_images vi 
                 WHERE vi.variant_id = pv.id 
                 ORDER BY vi.display_order ASC 
                 LIMIT 1) AS image_url,
                owner.username as shop_owner_name,  -- Add shop owner name to items
                i.owner_id as item_owner_id         -- Add item owner ID
            FROM order_items oi
            JOIN items i ON oi.item_id = i.id
            LEFT JOIN product_variants pv ON oi.variant_id = pv.id
            JOIN users owner ON i.owner_id = owner.id  -- Join with users table
            WHERE oi.order_id = :order_id AND i.owner_id = :owner_id
        """
        item_rows = await database.fetch_all(
            query=items_query, 
            values={"order_id": order.id, "owner_id": current_user["id"]}
        )

        # Map item_rows to schema dicts with enhanced item titles
        item_list = []
        for item in item_rows:
            # Build enhanced item title with variant info
            item_title = item.item_title
            variant_info = []
            if item.variant_color:
                variant_info.append(item.variant_color)
            if item.variant_size:
                variant_info.append(item.variant_size)
            
            if variant_info:
                item_title += f" ({', '.join(variant_info)})"
            
            item_data = {
                "id": item.id,
                "item_id": item.item_id,
                "quantity": item.quantity,
                "variant_id": item.variant_id,
                "item_title": item_title,
                "image_url": item.image_url,
                "line_total_price": item.line_total_price,
                "variant_color": item.variant_color,
                "variant_size": item.variant_size,
                "variant_price": item.variant_price,
                "shop_owner_name": item.shop_owner_name,  # Include shop owner name
                "item_owner_id": item.item_owner_id,      # Include item owner ID
            }
            item_list.append(item_data)

        # Fetch shipping address for this order
        shipping_address = None
        if order.shipping_address_id:
            address_query = addresses.select().where(addresses.c.id == order.shipping_address_id)
            address_row = await database.fetch_one(address_query)
            if address_row:
                shipping_address = {
                    "id": address_row.id,
                    "user_id": address_row.user_id,
                    "full_name": address_row.full_name,
                    "phone": address_row.phone,
                    "address_line1": address_row.address_line1,
                    "address_line2": address_row.address_line2,
                    "city": address_row.city,
                    "state": address_row.state,
                    "postal_code": address_row.postal_code,
                    "country": address_row.country,
                    "is_default": address_row.is_default,
                    "created_at": address_row.created_at,
                    "updated_at": address_row.updated_at,
                }

        # Fetch customer username
        customer_query = "SELECT username FROM users WHERE id = :customer_id"
        customer_row = await database.fetch_one(
            query=customer_query, 
            values={"customer_id": order.customer_id}
        )

        # Build result dict matching the OrderRead schema
        order_dict = {
            "id": order.id,
            "customer_id": order.customer_id,
            "total_price": order.total_price,
            "status": order.status,
            "coupon_code": order.coupon_code,
            "customer_username": customer_row["username"] if customer_row else None,
            "items": item_list,
            "shipping_address": shipping_address,
            "order_date": order.order_date,
            "shop_owner_name": order.shop_owner_name,  # Include shop owner name at order level
        }
        orders_with_items.append(order_dict)

    return orders_with_items


# =====================
# Shop Owner → Update Order Status
# =====================
@router.put("/shop-owner/orders/{order_id}/status", response_model=Message, dependencies=[Depends(get_current_shop_owner)])
async def shop_owner_update_order_status(order_id: int, status_data: OrderUpdateStatus, current_user=Depends(get_current_shop_owner)):
    # Authorize shop owner for this order
    query = """
        SELECT 1 FROM order_items oi
        JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = :order_id AND i.owner_id = :owner_id
        LIMIT 1
    """
    authorized = await database.fetch_one(query=query, values={"order_id": order_id, "owner_id": current_user["id"]})
    if not authorized:
        raise HTTPException(status_code=403, detail="Not authorized to update this order")

    existing_order = await database.fetch_one(orders.select().where(orders.c.id == order_id))
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update order status
    await database.execute(
        orders.update().where(orders.c.id == order_id).values(status=status_data.status)
    )

    # Send shipping notification email if status is "shipped"
    if status_data.status.lower() in ["processing", "shipped", "delivered", "cancelled"]:
        # Get customer email from order info
        customer_id = existing_order["customer_id"]
        customer = await database.fetch_one(users.select().where(users.c.id == customer_id))
        if customer:
            tracking_number = status_data.tracking_number if hasattr(status_data, "tracking_number") else "N/A"
            send_order_status_notification(
                to_email=customer["email"],
                order_id=order_id,
                status=status_data.status,
                tracking_number=tracking_number
            )

    return {"message": f"Order {order_id} status updated to {status_data.status}"}

# =====================
# Admin → View All Orders
# =====================
@router.get("/admin/orders", response_model=List[OrderRead], dependencies=[Depends(get_current_admin_user)])
async def admin_list_orders():
    # First, fetch all orders
    orders_query = """
        SELECT DISTINCT 
            o.id, o.customer_id, o.total_price, o.status, o.coupon_code,
            o.shipping_address_id, o.order_date,
            c.username AS customer_username
        FROM orders o
        LEFT JOIN users c ON o.customer_id = c.id
        ORDER BY o.order_date DESC
    """
    order_rows = await database.fetch_all(orders_query)

    orders_with_items = []
    for order in order_rows:
        # Fetch order items with complete variant information
        items_query = """
            SELECT 
                oi.id,
                oi.item_id,
                oi.quantity,
                oi.variant_id,
                oi.line_total_price,
                i.title AS item_title,
                pv.color AS variant_color,
                pv.size AS variant_size,
                pv.price AS variant_price,
                -- Get the primary variant image (first image by display_order)
                (SELECT vi.image_url 
                 FROM variant_images vi 
                 WHERE vi.variant_id = pv.id 
                 ORDER BY vi.display_order ASC 
                 LIMIT 1) AS image_url,
                s.username as shop_owner_name,
                i.owner_id as item_owner_id
            FROM order_items oi
            JOIN items i ON oi.item_id = i.id
            LEFT JOIN product_variants pv ON oi.variant_id = pv.id
            LEFT JOIN users s ON i.owner_id = s.id
            WHERE oi.order_id = :order_id
        """
        item_rows = await database.fetch_all(
            query=items_query, 
            values={"order_id": order.id}
        )

        # Map item_rows to schema dicts with enhanced item titles
        item_list = []
        for item in item_rows:
            # Build enhanced item title with variant info
            item_title = item.item_title
            variant_info = []
            if item.variant_color:
                variant_info.append(item.variant_color)
            if item.variant_size:
                variant_info.append(item.variant_size)
            
            if variant_info:
                item_title += f" ({', '.join(variant_info)})"
            
            item_data = {
                "id": item.id,
                "item_id": item.item_id,
                "quantity": item.quantity,
                "variant_id": item.variant_id,
                "item_title": item_title,
                "image_url": item.image_url,
                "line_total_price": item.line_total_price,
                "variant_color": item.variant_color,
                "variant_size": item.variant_size,
                "variant_price": item.variant_price,
                "shop_owner_name": item.shop_owner_name,
                "item_owner_id": item.item_owner_id,
            }
            item_list.append(item_data)

        # Fetch shipping address for this order
        shipping_address = None
        if order.shipping_address_id:
            address_query = addresses.select().where(addresses.c.id == order.shipping_address_id)
            address_row = await database.fetch_one(address_query)
            if address_row:
                shipping_address = {
                    "id": address_row.id,
                    "user_id": address_row.user_id,
                    "full_name": address_row.full_name,
                    "phone": address_row.phone,
                    "address_line1": address_row.address_line1,
                    "address_line2": address_row.address_line2,
                    "city": address_row.city,
                    "state": address_row.state,
                    "postal_code": address_row.postal_code,
                    "country": address_row.country,
                    "is_default": address_row.is_default,
                    "created_at": address_row.created_at,
                    "updated_at": address_row.updated_at,
                }

        # Build result dict matching the OrderRead schema
        order_dict = {
            "id": order.id,
            "customer_id": order.customer_id,
            "total_price": order.total_price,
            "status": order.status,
            "coupon_code": order.coupon_code,
            "customer_username": order.customer_username,
            "items": item_list,
            "shipping_address": shipping_address,
            "order_date": order.order_date,
            "shop_owner_name": item_list[0].get("shop_owner_name") if item_list else None,
        }
        orders_with_items.append(order_dict)

    return orders_with_items

# =====================
# Admin → Update Order Status
# =====================
@router.put("/admin/orders/{order_id}", response_model=Message, dependencies=[Depends(get_current_admin_user)])
async def update_order_status(order_id: int, status_data: OrderUpdateStatus):
    existing_order = await database.fetch_one(orders.select().where(orders.c.id == order_id))
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")

    await database.execute(
        orders.update().where(orders.c.id == order_id).values(status=status_data.status)
    )
    return {"message": f"Order {order_id} status updated to {status_data.status}"}




# =====================
# Customer → Get Order Invoice
# =====================
@router.get("/orders/{order_id}/invoice")
async def get_order_invoice(order_id: int, current_user=Depends(get_current_user)):
    # Verify the order belongs to the current user
    order_query = orders.select().where(
        (orders.c.id == order_id) & 
        (orders.c.customer_id == current_user["id"])
    )
    order = await database.fetch_one(order_query)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Fetch complete invoice data with variant information
    invoice_query = """
    SELECT 
        o.id as order_id,
        o.order_date,
        o.total_price,
        o.status,
        o.coupon_code,
        o.transaction_id,
        u.username as customer_name,
        u.email as customer_email,
        up.contact_number as customer_phone,
        a.full_name as shipping_name,
        a.phone as shipping_phone,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.postal_code,
        a.country,
        oi.quantity,
        oi.line_total_price,
        oi.variant_id,
        i.title as item_title,
        i.description,
        pv.color as variant_color,
        pv.size as variant_size,
        pv.price as variant_price,
        pv.image_url as variant_image_url,
        c.discount_type,
        c.discount_value,
        c.code as coupon_code
    FROM orders o
    LEFT JOIN users u ON o.customer_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN addresses a ON o.shipping_address_id = a.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
    LEFT JOIN product_variants pv ON oi.variant_id = pv.id
    LEFT JOIN coupons c ON o.coupon_code = c.code
    WHERE o.id = :order_id
    """
    
    rows = await database.fetch_all(invoice_query, values={"order_id": order_id})
    
    if not rows:
        raise HTTPException(status_code=404, detail="Invoice data not found")

    # Structure the invoice data
    invoice_data = {
        "order_id": rows[0]["order_id"],
        "order_date": rows[0]["order_date"],
        "total_price": float(rows[0]["total_price"]),
        "status": rows[0]["status"],
        "transaction_id": rows[0]["transaction_id"],
        "customer": {
            "name": rows[0]["customer_name"],
            "email": rows[0]["customer_email"],
            "phone": rows[0]["customer_phone"]
        },
        "shipping_address": {
            "full_name": rows[0]["shipping_name"],
            "phone": rows[0]["shipping_phone"],
            "address_line1": rows[0]["address_line1"],
            "address_line2": rows[0]["address_line2"] or "",
            "city": rows[0]["city"],
            "state": rows[0]["state"],
            "postal_code": rows[0]["postal_code"],
            "country": rows[0]["country"]
        },
        "items": [],
        "coupon": None,
        "subtotal": 0.0,
        "discount_amount": 0.0,
        "shipping_charge": 0.0  # Will be calculated
    }

    # Calculate subtotal from items
    subtotal = 0

    # Add items with variant information
    for row in rows:
        if row["item_title"]:  # Only add if there's an item
            # Build item title with variant information
            item_title = row["item_title"]
            variant_info = []
            
            if row["variant_color"]:
                variant_info.append(row["variant_color"])
            if row["variant_size"]:
                variant_info.append(row["variant_size"])
            
            if variant_info:
                item_title += f" ({', '.join(variant_info)})"
            
            # Use variant price (this is the actual price used in the order)
            unit_price = float(row["variant_price"])
            line_total = float(row["line_total_price"])
            subtotal += line_total

            # Use variant image if available, otherwise fallback
            image_url = row["variant_image_url"]

            invoice_data["items"].append({
                "item_title": item_title,
                "description": row["description"],
                "image_url": image_url,
                "unit_price": unit_price,
                "quantity": row["quantity"],
                "line_total_price": line_total,
                "variant_id": row["variant_id"],
                "variant_color": row["variant_color"],
                "variant_size": row["variant_size"]
            })

    # Update subtotal
    invoice_data["subtotal"] = subtotal

    # Add coupon info if exists
    if rows[0]["coupon_code"]:
        invoice_data["coupon"] = {
            "code": rows[0]["coupon_code"],
            "discount_type": rows[0]["discount_type"],
            "discount_value": float(rows[0]["discount_value"])
        }

        # Calculate discount amount for display
        if rows[0]["discount_type"] == "percentage":
            discount_amount = subtotal * (float(rows[0]["discount_value"]) / 100)
        else:  # fixed
            discount_amount = float(rows[0]["discount_value"])
        
        invoice_data["discount_amount"] = discount_amount

        # Calculate shipping charge as the difference between total and (subtotal - discount)
        calculated_total_after_discount = subtotal - discount_amount
        actual_total = float(rows[0]["total_price"])
        shipping_charge = actual_total - calculated_total_after_discount
        invoice_data["shipping_charge"] = max(0.0, shipping_charge)
    else:
        # Calculate shipping charge when no coupon
        actual_total = float(rows[0]["total_price"])
        shipping_charge = actual_total - subtotal
        invoice_data["shipping_charge"] = max(0.0, shipping_charge)
        invoice_data["discount_amount"] = 0.0

    return invoice_data