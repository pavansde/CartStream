from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from app.database import database
from app.models import orders, items, order_items, coupons, addresses, users
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
        # Fetch and cache item data to avoid multiple DB calls
        item_data_map = {}
        for item in order.items:
            item_data = await database.fetch_one(items.select().where(items.c.id == item.item_id))
            if not item_data:
                raise HTTPException(status_code=404, detail=f"Item {item.item_id} not found")
            if item_data["stock"] is not None and item_data["stock"] < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough stock for item {item.item_id}")
            item_data_map[item.item_id] = item_data
            total_order_price += item_data["price"] * item.quantity

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

        # Insert order items and update stocks
        for item in order.items:
            item_data = item_data_map[item.item_id]
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

        # Prepare order summary for emails
        full_order_summary = "\n".join(
            [f"{item_data_map[item.item_id]['title']} x {item.quantity} - ₹{item_data_map[item.item_id]['price'] * item.quantity:.2f}" for item in order.items]
        )
        total_amount_str = f"₹{final_total_price:.2f}"

        # Send confirmation to customer
        send_order_confirmation(
            to_email=current_user["email"],
            order_id=order_id,
            order_summary=full_order_summary,
            total_amount=total_amount_str,
            recipient_role="customer"
        )

        # Group items by shop owner
        shop_owner_orders = {}
        for item in order.items:
            item_data = item_data_map[item.item_id]
            owner_id = item_data["owner_id"]
            shop_owner_orders.setdefault(owner_id, []).append(item)

        # Send confirmation to each shop owner
        for owner_id, items_group in shop_owner_orders.items():
            owner = await database.fetch_one(users.select().where(users.c.id == owner_id))
            if not owner:
                continue
            shop_order_summary = "\n".join(
                [f"{item_data_map[item.item_id]['title']} x {item.quantity} - ₹{item_data_map[item.item_id]['price'] * item.quantity:.2f}" for item in items_group]
            )
            shop_order_total = sum(item_data_map[item.item_id]['price'] * item.quantity for item in items_group)

            # Optional customization for shop owner message
            shop_owner_message = {shop_order_summary}

            send_order_confirmation(
                to_email=owner["email"],
                order_id=order_id,
                order_summary=shop_owner_message,
                total_amount=f"₹{shop_order_total:.2f}",
                recipient_role="shopowner"
            )

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

    # Fetch complete invoice data with correct column names
    invoice_query = """
    SELECT 
        o.id as order_id,
        o.order_date,
        o.total_price,
        o.status,
        o.coupon_code,
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
        i.title as item_title,
        i.description,
        i.image_url,
        i.price as unit_price,
        c.discount_type,
        c.discount_value,
        c.code as coupon_code
    FROM orders o
    LEFT JOIN users u ON o.customer_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN addresses a ON o.shipping_address_id = a.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
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
        "total_price": rows[0]["total_price"],
        "status": rows[0]["status"],
        "customer": {
            "name": rows[0]["customer_name"],
            "email": rows[0]["customer_email"],
            "phone": rows[0]["customer_phone"]
        },
        "shipping_address": {
            "full_name": rows[0]["shipping_name"],
            "phone": rows[0]["shipping_phone"],
            "address_line1": rows[0]["address_line1"],
            "address_line2": rows[0]["address_line2"],
            "city": rows[0]["city"],
            "state": rows[0]["state"],
            "postal_code": rows[0]["postal_code"],
            "country": rows[0]["country"]
        },
        "items": [],
        "coupon": None
    }

    # Add items
    for row in rows:
        if row["item_title"]:  # Only add if there's an item
            invoice_data["items"].append({
                "item_title": row["item_title"],
                "description": row["description"],
                "image_url": row["image_url"],
                "unit_price": row["unit_price"],
                "quantity": row["quantity"],
                "line_total_price": row["line_total_price"]
            })

    # Add coupon info if exists
    if rows[0]["coupon_code"]:
        invoice_data["coupon"] = {
            "code": rows[0]["coupon_code"],
            "discount_type": rows[0]["discount_type"],
            "discount_value": rows[0]["discount_value"]
        }

    return invoice_data


# =====================
# PhonePe Payment
# =====================
@router.post("/payment/phonepe/initiate")
async def initiate_phonepe_payment(request_data: PaymentInitiateRequest):
    # First get auth token
    auth_response = await get_auth_token()  
    token = auth_response.get("token")
    if not token:
        raise HTTPException(status_code=500, detail="Failed to get authorization token")

    transaction_id = str(uuid.uuid4())
    payload = {
        "merchantId": MERCHANT_ID,
        "transactionId": transaction_id,
        "amount": str(request_data.amount),
        "orderId": request_data.orderId,
        "customerId": request_data.customerId,
        "redirectUrl": request_data.redirectUrl,
        "callbackUrl": request_data.callbackUrl,
        "paymentModeConfig": {
            "upi": {"show": True},
            "wallet": {"show": False},
            "card": {"show": False},
            "netBanking": {"show": False}
        }
    }

    url = f"{PHONEPE_SANDBOX_BASE_URL}/v1/initiatePayment"
    body_str = json.dumps(payload, separators=(',', ':'))
    timestamp = str(int(time.time()))
    message = f"{url}:{body_str}:{timestamp}"
    signature = base64.b64encode(hmac.new(MERCHANT_KEY.encode(), message.encode(), hashlib.sha256).digest()).decode()

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "X-VERIFY": signature,
        "X-VERIFY-TIMESTAMP": timestamp,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"PhonePe error: {response.text}")
        resp_json = response.json()
        if not resp_json.get("success", False):
            raise HTTPException(status_code=400, detail=f"PhonePe failure: {resp_json}")

    payment_url = resp_json["data"]["paymentUrl"]

    # Save transaction ID and order mapping in DB if needed

    return {"paymentUrl": payment_url, "transactionId": transaction_id}


# =====================
# PhonePe Payment Status
# =====================
@router.get("/payment/phonepe/status/{transaction_id}")
async def check_phonepe_payment_status(transaction_id: str):
    order = await database.fetch_one(orders.select().where(orders.c.transaction_id == transaction_id))
    if not order:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Return payment status field - adapt according to your DB schema
    return {"status": order.payment_status}

@router.post("/payment/phonepe/webhook")
async def phonepe_payment_webhook(
    payload: PhonePeWebhookPayload,
    request: Request,
):
    # TODO: Validate webhook signature for security (PhonePe docs explain this)

    txn_id = payload.transactionId
    payment_status = payload.status

    # Update order payment status in DB
    query = (
        orders.update()
        .where(orders.c.transaction_id == txn_id)
        .values(payment_status=payment_status)
    )
    await database.execute(query)

    # Optionally send notifications on payment success here

    return {"message": "Webhook received successfully"}
