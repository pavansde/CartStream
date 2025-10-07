from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import database
from app.models import orders, items, order_items, coupons, addresses
from app.deps import get_current_user, get_current_shop_owner, get_current_admin_user
from app.schemas import OrderCreate, OrderRead, OrderUpdateStatus, Message, OrderItemRead
from app.crud import create_notification
from datetime import datetime, timezone, timedelta



LOW_STOCK_THRESHOLD = 5
router = APIRouter()

# =====================
# Customer → Create Order (with stock update + low stock notification)
# =====================
@router.post("/orders/", response_model=Message)
async def create_order(order: OrderCreate, current_user=Depends(get_current_user)):
    print("Reached create_order endpoint", flush=True)

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

        # Validate items and stock, calculate total price
        for item in order.items:
            item_data = await database.fetch_one(items.select().where(items.c.id == item.item_id))
            print(f"Fetched item_data for item_id={item.item_id}: {item_data}", flush=True)
            if not item_data:
                raise HTTPException(status_code=404, detail=f"Item {item.item_id} not found")
            if item_data["stock"] is not None and item_data["stock"] < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough stock for item {item.item_id}")
            total_order_price += item_data["price"] * item.quantity

        print(f"Total order price calculated: {total_order_price}", flush=True)

        inserted_address_id = None

        if hasattr(order, "shipping_address_id") and order.shipping_address_id:
            # Use existing saved address id
            inserted_address_id = order.shipping_address_id
            print(f"Using existing shipping_address_id: {inserted_address_id}", flush=True)
        elif hasattr(order, "shipping_address") and order.shipping_address:
            try:
                address_values = order.shipping_address.dict()
                address_values["user_id"] = current_user["id"]

                # Check for existing identical address
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

        # Apply coupon discount if any
        discount_amount = 0.0
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

        # Insert order with calculated total_price and IST timestamp
        try:
            order_values = {
                "customer_id": current_user["id"],
                "status": "pending",
                "total_price": final_total_price,
                "order_date": now,
                "shipping_address_id": inserted_address_id,
            }
            if hasattr(order, "coupon_code") and order.coupon_code:
                order_values["coupon_code"] = order.coupon_code
            order_id = await database.execute(orders.insert().values(**order_values))
            print(f"Inserted order with ID: {order_id}", flush=True)
        except Exception as e:
            print(f"Exception inserting order: {e}", flush=True)
            raise

        # Insert order items and update stocks
        for item in order.items:
            item_data = await database.fetch_one(items.select().where(items.c.id == item.item_id))
            line_total_price = item_data["price"] * item.quantity
            print(f"Inserting order item: order_id={order_id}, item_id={item.item_id}, quantity={item.quantity}, line_total_price={line_total_price}", flush=True)
            try:
                await database.execute(
                    order_items.insert().values(
                        order_id=order_id,
                        item_id=item.item_id,
                        quantity=item.quantity,
                        line_total_price=line_total_price,
                    )
                )
                print(f"Inserted order item for item_id={item.item_id}", flush=True)
            except Exception as e:
                print(f"Exception inserting order item id={item.item_id}: {e}", flush=True)
                raise
            new_stock = item_data["stock"] - item.quantity
            try:
                await database.execute(
                    items.update().where(items.c.id == item.item_id).values(stock=new_stock)
                )
                print(f"Updated stock for item_id={item.item_id} to {new_stock}", flush=True)
            except Exception as e:
                print(f"Exception updating stock for item_id={item.item_id}: {e}", flush=True)
                raise
            if new_stock < LOW_STOCK_THRESHOLD:
                try:
                    await create_notification(
                        user_id=item_data["owner_id"],
                        message=f"Low stock alert for '{item_data['title']}' — only {new_stock} left.",
                        send_email_alert=True,
                        item_title=item_data["title"],
                        stock=new_stock,
                    )
                    print(f"Sent low stock notification for item_id={item.item_id}", flush=True)
                except Exception as e:
                    print(f"Exception sending notification for item_id={item.item_id}: {e}", flush=True)

        # Increment coupon usage count atomically if coupon applied
        if hasattr(order, "coupon_code") and order.coupon_code:
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

    print("Order created successfully", flush=True)
    return {"message": "Order placed successfully"}





# =====================
# Customer → View Own Orders
# =====================
@router.get("/orders/me", response_model=List[OrderRead])
async def view_my_orders(current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view their orders")

    # Fetch all orders for this customer
    query = orders.select().where(orders.c.customer_id == current_user["id"])
    order_rows = await database.fetch_all(query)

    orders_with_items = []
    for order in order_rows:
        # Fetch order items
        items_query = (
            order_items.select()
            .where(order_items.c.order_id == order.id)
            .join(items, items.c.id == order_items.c.item_id)
            .with_only_columns(
                order_items.c.id,
                order_items.c.item_id,
                order_items.c.quantity,
                items.c.title.label("item_title"),
                items.c.image_url,
                order_items.c.line_total_price, 
            )
        )
        item_rows = await database.fetch_all(items_query)

        # Map item_rows to schema dicts
        item_list = [
            {
                "id": item.id,
                "item_id": item.item_id,
                "quantity": item.quantity,
                "item_title": item.item_title,
                "image_url": item.image_url, 
                "line_total_price": item.line_total_price,
            }
            for item in item_rows
        ]

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
        order_dict["shipping_address"] = shipping_address  # <- This is required!
        order_dict["total_price"] = order.total_price 
        orders_with_items.append(order_dict)

    return orders_with_items


# =====================
# Shop Owner → View Orders for Own Items
# =====================
@router.get("/shop-owner/orders", response_model=List[OrderRead])
async def shop_owner_orders(current_user=Depends(get_current_shop_owner)):
    query = """
        SELECT 
            o.id AS order_id, o.customer_id, o.total_price, o.status, o.coupon_code,
            u.username AS customer_username,
            oi.id AS order_item_id, oi.item_id, oi.quantity, oi.line_total_price,
            i.title AS item_title, i.image_url,
            a.id AS address_id, a.user_id AS address_user_id, a.full_name, a.phone, 
            a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country, a.is_default,
            a.created_at AS address_created_at, a.updated_at AS address_updated_at
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN items i ON oi.item_id = i.id
        JOIN users u ON o.customer_id = u.id
        LEFT JOIN addresses a ON o.shipping_address_id = a.id
        WHERE i.owner_id = :owner_id
    """
    rows = await database.fetch_all(query=query, values={"owner_id": current_user["id"]})

    orders = {}
    for row in rows:
        oid = row["order_id"]
        if oid not in orders:
            orders[oid] = {
                "id": oid,
                "customer_id": row["customer_id"],
                "status": row["status"],
                "coupon_code": row["coupon_code"],
                "total_price": row["total_price"],
                "customer_username": row["customer_username"],
                "shipping_address": {
                    "id": row["address_id"],
                    "user_id": row["address_user_id"],
                    "full_name": row["full_name"],
                    "phone": row["phone"],
                    "address_line1": row["address_line1"],
                    "address_line2": row["address_line2"],
                    "city": row["city"],
                    "state": row["state"],
                    "postal_code": row["postal_code"],
                    "country": row["country"],
                    "is_default": row["is_default"],
                    "created_at": row["address_created_at"],
                    "updated_at": row["address_updated_at"],
                } if row["address_id"] else None,
                "items": [],
            }
        orders[oid]["items"].append({
            "id": row["order_item_id"],
            "item_id": row["item_id"],
            "quantity": row["quantity"],
            "item_title": row["item_title"],
            "line_total_price": row["line_total_price"],
            "image_url": row["image_url"],
        })

    return list(orders.values())


# =====================
# Shop Owner → Update Order Status
# =====================
@router.put("/shop-owner/orders/{order_id}/status", response_model=Message, dependencies=[Depends(get_current_shop_owner)])
async def shop_owner_update_order_status(order_id: int, status_data: OrderUpdateStatus, current_user=Depends(get_current_shop_owner)):
    # Check if this shop owner owns at least one item in this order
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

    await database.execute(
        orders.update().where(orders.c.id == order_id).values(status=status_data.status)
    )
    return {"message": f"Order {order_id} status updated to {status_data.status}"}


# # =====================
# # Admin → View All Orders
# # =====================
@router.get("/admin/orders", response_model=List[OrderRead], dependencies=[Depends(get_current_admin_user)])
async def admin_list_orders():
    query = """
        SELECT o.id AS order_id, o.customer_id, o.total_price, o.status,
               c.username AS customer_username, s.username AS shop_owner_name,
               oi.id AS order_item_id, oi.item_id, oi.quantity, oi.line_total_price,
               i.title AS item_title,
               a.id AS address_id, a.user_id AS address_user_id, a.full_name, a.phone,
               a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country,
               a.is_default, a.created_at AS address_created_at, a.updated_at AS address_updated_at
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN items i ON oi.item_id = i.id
        LEFT JOIN users c ON o.customer_id = c.id
        LEFT JOIN users s ON i.owner_id = s.id
        LEFT JOIN addresses a ON o.shipping_address_id = a.id
    """
    rows = await database.fetch_all(query)
    
    orders = {}
    for row in rows:
        oid = row["order_id"]
        if oid not in orders:
            orders[oid] = {
                "id": oid,
                "customer_id": row["customer_id"],
                "total_price": row["total_price"],
                "status": row["status"],
                "customer_username": row["customer_username"],
                "shop_owner_name": row["shop_owner_name"],
                "shipping_address": {
                    "id": row["address_id"],
                    "user_id": row["address_user_id"],
                    "full_name": row["full_name"],
                    "phone": row["phone"],
                    "address_line1": row["address_line1"],
                    "address_line2": row["address_line2"],
                    "city": row["city"],
                    "state": row["state"],
                    "postal_code": row["postal_code"],
                    "country": row["country"],
                    "is_default": row["is_default"],
                    "created_at": row["address_created_at"],
                    "updated_at": row["address_updated_at"],
                } if row["address_id"] else None,
                "items": [],
            }
        orders[oid]["items"].append({
            "id": row["order_item_id"],
            "item_id": row["item_id"],
            "quantity": row["quantity"],
            "item_title": row["item_title"],
            "line_total_price": row["line_total_price"],
        })
    return list(orders.values())


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

