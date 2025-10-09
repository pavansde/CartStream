from datetime import datetime
from sqlalchemy import Table, Column, Integer, String, Text, Float, ForeignKey, MetaData,Boolean, DateTime, UniqueConstraint, Date
from sqlalchemy.sql import expression, func

metadata = MetaData()

# ===== Users Table =====
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(length=50), nullable=False, unique=True),
    Column("email", String(length=255), nullable=False, unique=True),
    Column("hashed_password", String(length=255), nullable=False),
    Column("role", String(length=50), nullable=False),
    Column("is_verified", Boolean, nullable=False, default=False),
    Column("verification_token", String(length=255), nullable=True),
    Column("verification_token_expiry", DateTime, nullable=True),  # optional
)


# ===== Product Variants Table =====
product_variants = Table(
    "product_variants",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("item_id", Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
    Column("size", String(50), nullable=True),
    Column("color", String(50), nullable=True),
    Column("price", Float, nullable=True),  # Variant-specific price (nullable to fallback on item's price)
    Column("stock", Integer, default=0),
    Column("image_url", String(255), nullable=True),
    UniqueConstraint("item_id", "size", "color", name="unique_variant"),
)



# ===== User Profiles Table =====

user_profiles = Table(
    "user_profiles",
    metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("full_name", String(100), nullable=True),
    Column("profile_picture", String(255), nullable=True),  # URL or file path
    Column("contact_number", String(20), nullable=True),
    Column("date_of_birth", Date, nullable=True),
    Column("bio", Text, nullable=True),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column("updated_at", DateTime, nullable=False, server_default=func.now(), onupdate=func.now()),
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
    Column("coupon_code", String(64), nullable=True),  # adjust length as needed
    Column("transaction_id", String(128), nullable=True, unique=True, index=True),  # add this
    Column("shipping_address_id", Integer, ForeignKey("addresses.id"), nullable=True),  # Add this


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

addresses = Table(
    "addresses",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("full_name", String(100), nullable=False),
    Column("phone", String(15), nullable=False),
    Column("address_line1", String(200), nullable=False),
    Column("address_line2", String(200), nullable=True),
    Column("city", String(100), nullable=False),
    Column("state", String(100), nullable=False),
    Column("postal_code", String(20), nullable=False),
    Column("country", String(100), nullable=False),
    Column(
        "is_default",
        Boolean(),
        nullable=False,
        server_default=expression.false(),
        default=False,
    ),
    Column(
        "created_at",
        DateTime,
        nullable=True,
        server_default=func.now()
    ),
    Column(
        "updated_at",
        DateTime,
        nullable=True,
        server_default=func.now(),
        onupdate=func.now()
    ),
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

# ===== Coupons Table =====
coupons = Table(
    "coupons",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("code", String(32), unique=True, nullable=False, index=True),
    Column("description", String(255)),
    Column("discount_type", String(20), nullable=False),  # 'percentage' or 'fixed'
    Column("discount_value", Float, nullable=False),
    Column("active", Boolean, default=True),
    Column("start_at", DateTime, default=datetime.utcnow),
    Column("end_at", DateTime, nullable=True),
    Column("min_order_amount", Float, default=0),
    Column("max_uses", Integer, default=0),  # 0 = unlimited
    Column("used_count", Integer, default=0),
    Column("created_by", Integer, ForeignKey("users.id"), nullable=True),
    Column("created_at", DateTime, default=datetime.utcnow),
    Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow),
)