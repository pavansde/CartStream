from datetime import datetime
from sqlalchemy import Table, Column, Integer, String, Text, Float, ForeignKey, MetaData,Boolean, DateTime, UniqueConstraint

metadata = MetaData()

# ===== Users Table =====
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(50), unique=True, index=True),
    Column("email", String(100), unique=True, index=True),
    Column("hashed_password", String(128)),
    # Default role is now 'customer' for regular users
    Column("role", String(20), default="customer", nullable=False),
)

# ===== Items Table =====
items = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(100), nullable=False),
    Column("description", Text),
    Column("price", Float, nullable=False),
    Column("stock", Integer, default=0),
    Column("image_url", String(255), nullable=True),
    # Foreign key to the shop owner's user ID
    Column("owner_id", Integer, ForeignKey("users.id"), nullable=False),
)

orders = Table(
    "orders",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("customer_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("status", String(20), default="pending"),
    Column("order_date", DateTime, default=datetime.utcnow),
    Column("total_price", Float, nullable=False),
)

order_items = Table(
    "order_items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("order_id", Integer, ForeignKey("orders.id"), nullable=False),
    Column("item_id", Integer, ForeignKey("items.id"), nullable=False),
    Column("quantity", Integer, nullable=False, default=1),
    Column("line_total_price", Float, nullable=False),
)

wishlist = Table(
    "wishlist",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("customer_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("item_id", Integer, ForeignKey("items.id"), nullable=False),
)

audit_logs = Table(
    "audit_logs",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("admin_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("action", String(255), nullable=False),
    Column("target_id", Integer),      # User/Item/Order ID affected
    Column("timestamp", String(50)),   # Or use DateTime in real apps
)

# ===== Notifications Table =====
notifications = Table(
    "notifications",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("message", String(500), nullable=False),
    Column("is_read", Boolean, default=False),
    Column("created_at", DateTime, default=datetime.utcnow)
)

# ===== Cart Table =====
carts = Table(
    "carts",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("item_id", Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
    Column("quantity", Integer, nullable=False, default=1),
    Column("created_at", DateTime, default=datetime.utcnow),
    Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow),
    UniqueConstraint("user_id", "item_id", name="unique_user_item")
)