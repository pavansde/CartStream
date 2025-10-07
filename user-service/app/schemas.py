from pydantic import BaseModel, EmailStr, Field, constr
from typing import Optional, List, Annotated
from datetime import datetime, date


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
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None



# =========================
# User Profile Schemas
# =========================

class UserProfileBase(BaseModel):
    full_name: Optional[str] = Field(None, alias="fullName")
    profile_picture: Optional[str] = Field(None, alias="profilePicture")
    contact_number: Optional[str] = Field(None, alias="contactNumber")
    date_of_birth: Optional[date] = Field(None, alias="dateOfBirth")
    bio: Optional[str]
    email: EmailStr

    class Config:
        validate_by_name = True

class UserProfileCreate(UserProfileBase):
    pass

# class UserProfileUpdate(UserProfileBase):
#     pass
class UserProfileUpdateForm(BaseModel):
    full_name: Optional[str] = Field(None, alias="fullName")
    contact_number: Optional[str] = Field(None, alias="contactNumber")
    date_of_birth: Optional[date] = Field(None, alias="dateOfBirth")
    bio: Optional[str]
    email: EmailStr

    class Config:
        allow_population_by_field_name = True


class UserProfileInDBBase(UserProfileBase):
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfile(UserProfileInDBBase):
    pass


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
        from_attributes = True


# =========================
# Address Schema
# =========================
# Type aliases with Annotated and Field metadata for constraints
FullNameStr = Annotated[str, Field(strip_whitespace=True, min_length=1)]
PhoneStr = Annotated[str, Field(strip_whitespace=True, min_length=7, max_length=15)]
AddressLineStr = Annotated[str, Field(strip_whitespace=True, min_length=1)]
CityStr = Annotated[str, Field(strip_whitespace=True, min_length=1)]
StateStr = Annotated[str, Field(strip_whitespace=True, min_length=1)]
PostalCodeStr = Annotated[str, Field(strip_whitespace=True, min_length=3, max_length=10)]
CountryStr = Annotated[str, Field(strip_whitespace=True, min_length=1)]

class AddressBase(BaseModel):
    full_name: FullNameStr = Field(..., alias="full_name")
    phone: PhoneStr
    address_line1: AddressLineStr = Field(..., alias="address_line1")
    address_line2: Optional[str] = Field(None, alias="address_line2")
    city: CityStr
    state: StateStr
    postal_code: PostalCodeStr = Field(..., alias="postal_code")
    country: CountryStr
    is_default: Optional[bool] = Field(False, alias="is_default")

    class Config:
        validate_by_name = True

class AddressCreate(AddressBase):
    pass

class AddressUpdate(AddressBase):
    pass

class AddressRead(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    full_name: FullNameStr = Field(None, alias="full_name")
    phone: PhoneStr = None
    address_line1: AddressLineStr = Field(None, alias="address_line1")
    address_line2: Optional[str] = Field(None, alias="address_line2")
    city: CityStr = None
    state: StateStr = None
    postal_code: PostalCodeStr = Field(None, alias="postal_code")
    country: CountryStr = None
    is_default: Optional[bool] = Field(False, alias="is_default")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        validate_by_name = True


# =========================
# Order Schemas
# =========================
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
    image_url: Optional[str] = None
    line_total_price: float
    shop_owner_name: Optional[str] = None  # Add shop owner per item
    item_owner_id: Optional[int] = None    # Add item owner ID

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    # customer_id: int
    items: List[OrderItemBase]  # Multiple items per order
    coupon_code: Optional[str] = None
    shipping_address: AddressCreate
    shipping_charge: Optional[float] = 0.0

class OrderRead(BaseModel):
    id: int
    customer_id: int
    status: str
    items: List[OrderItemRead]
    coupon_code: Optional[str] = None
    total_price: float
    shipping_address: Optional[AddressRead]
    customer_username: Optional[str] = None  # Add customer username
    shop_owner_name: Optional[str] = None    # Add primary shop owner
    order_date: Optional[datetime] = None    # Add order date

    class Config:
        from_attributes = True

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
        from_attributes = True


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
        from_attributes = True




class NotificationRead(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


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
        from_attributes = True


# =========================
# Coupon Schemas
# =========================

class CouponBase(BaseModel):
    code: str = Field(..., max_length=32)
    description: Optional[str] = None
    discount_type: str  # "percentage" or "fixed"
    discount_value: float = Field(..., ge=0)
    active: Optional[bool] = True
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    min_order_amount: Optional[float] = 0
    max_uses: Optional[int] = 0  # 0 means unlimited

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discount_type: Optional[str] = None  # "percentage" or "fixed"
    discount_value: Optional[float] = None
    active: Optional[bool] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None

class CouponRead(CouponBase):
    id: int
    used_count: int
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True