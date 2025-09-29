from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import database
from app.models import orders, items, order_items
from app.deps import get_current_user, get_current_shop_owner, get_current_admin_user
from app.schemas import OrderCreate, OrderRead, OrderUpdateStatus, Message, OrderItemRead
from app.crud import create_notification


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

    total_order_price = 0
    for item in order.items:
        item_data = await database.fetch_one(items.select().where(items.c.id == item.item_id))
        print(f"Fetched item_data for item_id={item.item_id}: {item_data}", flush=True)  # check item existence and data

        if not item_data:
            raise HTTPException(status_code=404, detail=f"Item {item.item_id} not found")

        if item_data["stock"] is not None and item_data["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for item {item.item_id}")

        total_order_price += item_data["price"] * item.quantity

    print(f"Total order price calculated: {total_order_price}", flush=True)

    try:
        order_id = await database.execute(
            orders.insert().values(
                customer_id=current_user["id"],
                status="pending",
                total_price=total_order_price,
            )
        )
        print(f"Inserted order with ID: {order_id}", flush=True)
    except Exception as e:
        print(f"Exception inserting order: {e}", flush=True)
        raise

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
                raise

    print("Order created successfully", flush=True)
    return {"message": "Order placed successfully"}



# =====================
# Customer → View Own Orders
# =====================
@router.get("/orders/me", response_model=List[OrderRead])
async def view_my_orders(current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view their orders")

    query = orders.select().where(orders.c.customer_id == current_user["id"])
    order_rows = await database.fetch_all(query)

    # For each order, fetch its items
    orders_with_items = []
    for order in order_rows:
        items_query = (
            order_items.select()
            .where(order_items.c.order_id == order.id)
            .join(items, items.c.id == order_items.c.item_id)
            .with_only_columns(
            order_items.c.id,
            order_items.c.item_id,
            order_items.c.quantity,
            items.c.title.label("item_title"),
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
                "line_total_price": item.line_total_price,
            }
            for item in item_rows
        ]

        order_dict = dict(order)
        print("Order dict:", order_dict)
        order_dict["items"] = item_list
        order_dict["total_price"] = order.total_price 
        orders_with_items.append(order_dict)

    return orders_with_items

# =====================
# Shop Owner → View Orders for Own Items
# =====================
@router.get("/shop-owner/orders", response_model=List[OrderRead])
async def shop_owner_orders(current_user=Depends(get_current_shop_owner)):
    query = """
        SELECT o.id AS order_id, o.customer_id, o.total_price, o.status,
       u.username AS customer_username,
       oi.id AS order_item_id, oi.item_id, oi.quantity, oi.line_total_price,
       i.title AS item_title
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN items i ON oi.item_id = i.id
        JOIN users u ON o.customer_id = u.id
        WHERE i.owner_id = :owner_id

    """
    rows = await database.fetch_all(query=query, values={"owner_id": current_user["id"]})
    
    # Group flat rows by order_id
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
                "items": [],
            }
        orders[oid]["items"].append({
            "id": row["order_item_id"],
            "item_id": row["item_id"],
            "quantity": row["quantity"],
            "item_title": row["item_title"],
            "line_total_price": row["line_total_price"],  # add this field
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


# =====================
# Admin → View All Orders
# =====================
@router.get("/admin/orders", response_model=List[OrderRead], dependencies=[Depends(get_current_admin_user)])
async def admin_list_orders():
    # print("Reached admin_list_orders endpoint", flush=True)
    query = """
        SELECT o.id AS order_id, o.customer_id, o.total_price, o.status,
        c.username AS customer_username, s.username AS shop_owner_name,
        oi.id AS order_item_id, oi.item_id, oi.quantity, oi.line_total_price,
        i.title AS item_title
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN items i ON oi.item_id = i.id
        LEFT JOIN users c ON o.customer_id = c.id
        LEFT JOIN users s ON i.owner_id = s.id

    """
    rows = await database.fetch_all(query)
    # print(f"Fetched rows: {len(rows)}", flush=True)
    # print(rows, flush=True)

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
                "items": [],
            }
        orders[oid]["items"].append({
            "id": row["order_item_id"],
            "item_id": row["item_id"],
            "quantity": row["quantity"],
            "item_title": row["item_title"],
            "line_total_price": row["line_total_price"],
        })
        # print(orders.values())
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

