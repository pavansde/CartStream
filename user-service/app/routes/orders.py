from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import database
from app.models import orders, items, users
from app.deps import get_current_user, get_current_shop_owner, get_current_admin_user
from app.schemas import OrderCreate, OrderRead, OrderUpdateStatus, Message
from app.crud import create_notification

LOW_STOCK_THRESHOLD = 5
router = APIRouter()

# =====================
# Customer → Create Order (with stock update + low stock notification)
# =====================
@router.post("/orders/", response_model=Message)
async def create_order(order: OrderCreate, current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can place orders")

    # Fetch item
    item_data = await database.fetch_one(items.select().where(items.c.id == order.item_id))
    if not item_data:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check stock
    if item_data["stock"] is not None and item_data["stock"] < order.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    total_price = item_data["price"] * order.quantity

    # Create order
    await database.execute(
        orders.insert().values(
            customer_id=current_user["id"],
            item_id=order.item_id,
            quantity=order.quantity,
            total_price=total_price,
            status="pending"
        )
    )

    # Deduct stock
    new_stock = item_data["stock"] - order.quantity
    await database.execute(
        items.update().where(items.c.id == order.item_id).values(stock=new_stock)
    )

    # Trigger low stock notification
    if new_stock < LOW_STOCK_THRESHOLD:
        await create_notification(
            user_id=item_data["owner_id"],
            message=f"Low stock alert for '{item_data['title']}' — only {new_stock} left.",
            send_email_alert=True,
            item_title=item_data["title"],
            stock=new_stock
        )

    return {"message": "Order placed successfully"}

# =====================
# Customer → View Own Orders
# =====================
@router.get("/orders/me", response_model=List[OrderRead])
async def view_my_orders(current_user=Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view their orders")
    query = orders.select().where(orders.c.customer_id == current_user["id"])
    return await database.fetch_all(query)

# =====================
# Shop Owner → View Orders for Own Items
# =====================
@router.get("/shop-owner/orders", response_model=List[OrderRead])
async def shop_owner_orders(current_user=Depends(get_current_shop_owner)):
    query = """
        SELECT o.id, o.customer_id, o.item_id, o.quantity, o.total_price, o.status,
               u.username AS customer_name, i.title AS item_title
        FROM orders o
        JOIN items i ON o.item_id = i.id
        JOIN users u ON o.customer_id = u.id
        WHERE i.owner_id = :owner_id
    """
    return await database.fetch_all(query=query, values={"owner_id": current_user["id"]})

# =====================
# Admin → View All Orders
# =====================
@router.get("/admin/orders", response_model=List[OrderRead], dependencies=[Depends(get_current_admin_user)])
async def admin_list_orders():
    query = """
        SELECT o.id, o.customer_id, o.item_id, o.quantity, o.total_price, o.status,
               c.username AS customer_name, i.title AS item_title, s.username AS shop_owner_name
        FROM orders o
        JOIN items i ON o.item_id = i.id
        JOIN users c ON o.customer_id = c.id
        JOIN users s ON i.owner_id = s.id
    """
    return await database.fetch_all(query)

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
