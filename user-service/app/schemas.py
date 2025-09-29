from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime



# =========================
# User Schemas
# =========================
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    # Default role as 'customer' (was 'user' before)
    role: Optional[str] = "customer"  # allowed values: admin, shop_owner, customer


class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str  # include role in read output for frontend auth

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


# =========================
# Token Schemas
# =========================
class Token(BaseModel):
    access_token: str
    refresh_token: str   # new addition
    token_type: str = "bearer"


# =========================
# Item Schemas
# =========================
class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float = Field(..., ge=0)      # price must be >= 0
    stock: int = Field(0, ge=0)          # stock must be >= 0
    image_url: Optional[str] = None      # optional image URL

class ItemCreate(ItemBase):
    title: str
    description: Optional[str]
    price: float
    stock: int
    image_url: Optional[str] = None

class ItemRead(ItemBase):
    id: int
    owner_id: int
    image_url: Optional[str] = None
    low_stock_alert: bool = False        # always included, default False

    class Config:
        orm_mode = True


# =========================
# Order Schemas
# =========================
# class OrderBase(BaseModel):
#     item_id: int
#     quantity: int


# class OrderCreate(OrderBase):
#     pass


# class OrderRead(BaseModel):
#     id: int
#     customer_id: int
#     item_id: int
#     quantity: int
#     total_price: float
#     status: str
#     # Optional: for joining customer/item/shop_owner names in future
#     customer_name: Optional[str] = None
#     item_title: Optional[str] = None
#     shop_owner_name: Optional[str] = None

#     class Config:
#         orm_mode = True


# class OrderUpdateStatus(BaseModel):
#     status: str

class OrderBase(BaseModel):
    customer_id: int
    status: str

class OrderItemBase(BaseModel):
    item_id: int
    quantity: int

class OrderItemRead(BaseModel):
    id: int
    item_id: int
    quantity: int
    item_title: Optional[str] = None
    line_total_price: float

    class Config:
        orm_mode = True

class OrderCreate(BaseModel):
    # customer_id: int
    items: List[OrderItemBase]  # Multiple items per order

class OrderRead(BaseModel):
    id: int
    customer_id: int
    status: str
    items: List[OrderItemRead]
    total_price: float

    class Config:
        orm_mode = True

class OrderUpdateStatus(BaseModel):
    status: str

# =========================
# Wishlist Schemas
# =========================
class WishlistBase(BaseModel):
    item_id: int

class WishlistCreate(WishlistBase):
    pass

class WishlistRead(BaseModel):
    id: int
    customer_id: int
    item: ItemRead                      # Nested item info for clarity

    class Config:
        orm_mode = True


# =========================
# Generic Message Schema
# =========================
class Message(BaseModel):
    message: str


# =========================
# FUTURE PLACEHOLDERS for Phase 2+
# (keep here for maintainability)
# =========================

# AuditLog Schemas
class AuditLogBase(BaseModel):
    admin_id: int
    action: str
    target_id: Optional[int] = None
    timestamp: datetime


class AuditLogRead(AuditLogBase):
    id: int

    class Config:
        orm_mode = True




class NotificationRead(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True


class NotificationCreate(BaseModel):
    user_id: int
    message: str

class Message(BaseModel):
    message: str

# =========================
# Cart Schemas
# =========================
class CartItemAdd(BaseModel):
    item_id: int
    quantity: int = Field(..., ge=1)     # quantity must be >= 1

class CartItemUpdate(BaseModel):
    item_id: int
    quantity: int = Field(..., ge=1)

class CartItem(BaseModel):
    id: int                             # cart item ID for updates/deletes
    item: ItemRead                     # full item data for display
    quantity: int = Field(..., ge=1)

    class Config:
        orm_mode = True