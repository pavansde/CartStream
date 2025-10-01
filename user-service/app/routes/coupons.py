from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import datetime, timezone, timedelta
from app.database import database
from app.models import coupons
from app.deps import get_current_user, get_current_shop_owner, get_current_admin_user
from app.schemas import CouponCreate, CouponRead, CouponUpdate, Message

router = APIRouter()


# Public - List active coupons
@router.get("/coupons/", response_model=List[CouponRead])
async def list_coupons(active: bool = True, skip: int = 0, limit: int = 50):
    query = coupons.select().where(coupons.c.active == active).offset(skip).limit(limit)
    return await database.fetch_all(query)


# Public - Get coupon by code
@router.get("/coupons/{code}", response_model=CouponRead)
async def get_coupon_by_code(code: str):
    c = await database.fetch_one(coupons.select().where(coupons.c.code == code))
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return c

# Shop Owner - List their own coupons
@router.get("/shop-owner/coupons", response_model=List[CouponRead], dependencies=[Depends(get_current_shop_owner)])
async def list_shop_owner_coupons(current_user=Depends(get_current_shop_owner)):
    query = coupons.select().where(coupons.c.created_by == current_user["id"])
    results = await database.fetch_all(query)
    print(results, flush=True)
    return results


# Shop Owner - Create coupon owned by self
@router.post("/shop-owner/coupons/", response_model=CouponRead, dependencies=[Depends(get_current_shop_owner)])
async def create_coupon_shop_owner(coupon: CouponCreate, current_user=Depends(get_current_shop_owner)):
    existing = await database.fetch_one(coupons.select().where(coupons.c.code == coupon.code))
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")
    now = datetime.strptime(now_str, "%Y-%m-%d %H:%M:%S")

    values = coupon.dict()
    values.update({
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
        "used_count": 0,
    })
    coupon_id = await database.execute(coupons.insert().values(**values))
    result = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    return result


# Shop Owner - Update coupon only if owned by self
@router.put("/shop-owner/coupons/{coupon_id}", response_model=CouponRead, dependencies=[Depends(get_current_shop_owner)])
async def update_coupon_shop_owner(coupon_id: int, coupon_updates: CouponUpdate, current_user=Depends(get_current_shop_owner)):
    c = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    if c["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this coupon")
    update_data = {**coupon_updates.dict(exclude_unset=True), "updated_at": datetime.utcnow()}
    await database.execute(coupons.update().where(coupons.c.id == coupon_id).values(**update_data))
    updated = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    return updated

# Shop Owner - Enable/Disable own coupon
@router.patch("/shop-owner/coupons/{coupon_id}/toggle", response_model=Message, dependencies=[Depends(get_current_shop_owner)])
async def toggle_coupon_shop_owner(coupon_id: int, current_user=Depends(get_current_shop_owner)):
    coupon = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    if coupon["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to toggle this coupon")
    new_status = not coupon["active"]
    await database.execute(
        coupons.update().where(coupons.c.id == coupon_id).values(active=new_status, updated_at=datetime.utcnow())
    )
    return {"message": f"Coupon {'enabled' if new_status else 'disabled'}"}


# Admin - List all shop owners coupons
@router.get("/admin/coupons", response_model=List[CouponRead], dependencies=[Depends(get_current_admin_user)])
async def list_all_coupons(skip: int = 0, limit: int = 50):
    query = coupons.select().offset(skip).limit(limit)
    results = await database.fetch_all(query)
    print(results, flush=True)
    return results



# Admin - Create coupon (anyone)
@router.post("/admin/coupons/", response_model=CouponRead, dependencies=[Depends(get_current_admin_user)])
async def create_coupon_admin(coupon: CouponCreate, current_user=Depends(get_current_admin_user)):
    existing = await database.fetch_one(coupons.select().where(coupons.c.code == coupon.code))
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")
    now = datetime.strptime(now_str, "%Y-%m-%d %H:%M:%S")
    values = coupon.dict()
    values.update({
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
        "used_count": 0,
    })
    coupon_id = await database.execute(coupons.insert().values(**values))
    result = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    return result


# Admin - Update any coupon
@router.put("/admin/coupons/{coupon_id}", response_model=CouponRead, dependencies=[Depends(get_current_admin_user)])
async def update_coupon_admin(coupon_id: int, coupon_updates: CouponUpdate):
    c = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    update_data = {**coupon_updates.dict(exclude_unset=True), "updated_at": datetime.utcnow()}
    await database.execute(coupons.update().where(coupons.c.id == coupon_id).values(**update_data))
    updated = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    return updated


# Admin - Enable/Disable coupon
@router.patch("/admin/coupons/{coupon_id}/toggle", response_model=Message, dependencies=[Depends(get_current_admin_user)])
async def toggle_coupon_admin(coupon_id: int):
    c = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    new_status = not c["active"]
    await database.execute(
        coupons.update().where(coupons.c.id == coupon_id).values(active=new_status, updated_at=datetime.utcnow())
    )
    return {"message": f"Coupon {'enabled' if new_status else 'disabled'}"}


# Customer - Redeem/validate a coupon for an order total
@router.post("/coupons/redeem", response_model=CouponRead)
async def redeem_coupon(
    code: str,
    order_total: float,
    current_user=Depends(get_current_user)
):
    # Fetch coupon by code
    coupon = await database.fetch_one(coupons.select().where(coupons.c.code == code))
    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")
    now = datetime.strptime(now_str, "%Y-%m-%d %H:%M:%S")
    
    # Coupon existence and active check
    if not coupon or not coupon["active"]:
        raise HTTPException(status_code=404, detail="Coupon not available or inactive")
    
    # Check coupon validity period
    if coupon["start_at"] and now < coupon["start_at"]:
        raise HTTPException(status_code=400, detail="Coupon not valid yet")
    if coupon["end_at"] and now > coupon["end_at"]:
        raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Check minimum order amount eligibility
    if coupon["min_order_amount"] and order_total < coupon["min_order_amount"]:
        raise HTTPException(
            status_code=400,
            detail=f"Order total below minimum required amount: {coupon['min_order_amount']}"
        )
    
    # Check usage limit
    if coupon["max_uses"] and coupon["used_count"] >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    # If all validations pass, return coupon details for front-end application
    return coupon

# Shop Owner - Delete own coupon
@router.delete("/shop-owner/coupons/{coupon_id}", response_model=Message, dependencies=[Depends(get_current_shop_owner)])
async def delete_coupon_shop_owner(coupon_id: int, current_user=Depends(get_current_shop_owner)):
    coupon = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    if coupon["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this coupon")
    await database.execute(coupons.delete().where(coupons.c.id == coupon_id))
    return {"message": "Coupon deleted successfully"}


# Admin - Delete any coupon
@router.delete("/admin/coupons/{coupon_id}", response_model=Message, dependencies=[Depends(get_current_admin_user)])
async def delete_coupon_admin(coupon_id: int):
    coupon = await database.fetch_one(coupons.select().where(coupons.c.id == coupon_id))
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await database.execute(coupons.delete().where(coupons.c.id == coupon_id))
    return {"message": "Coupon deleted successfully"}
