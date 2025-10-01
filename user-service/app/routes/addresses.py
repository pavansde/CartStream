from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import datetime, timezone, timedelta
from app.database import database
from app.models import addresses
from app.deps import get_current_user
from app.schemas import AddressCreate, AddressRead, AddressUpdate, Message
import traceback

router = APIRouter()

# Customer - List own saved addresses
@router.get("/user/addresses/", response_model=List[AddressRead], dependencies=[Depends(get_current_user)])
async def list_user_addresses(current_user=Depends(get_current_user)):
    query = addresses.select().where(addresses.c.user_id == current_user["id"])
    results = await database.fetch_all(query)
    print(results, flush=True)
    return results

# Customer - Get specific address by id, only if owned by user
@router.get("/user/addresses/{address_id}", response_model=AddressRead, dependencies=[Depends(get_current_user)])
async def get_user_address(address_id: int, current_user=Depends(get_current_user)):
    addr = await database.fetch_one(addresses.select().where(addresses.c.id == address_id))
    if not addr or addr["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Address not found")
    return addr

# Customer - Create new address for self
@router.post("/user/addresses/", response_model=AddressRead, dependencies=[Depends(get_current_user)])
async def create_user_address(address: AddressCreate, current_user=Depends(get_current_user)):
    try:
        IST = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(IST)
        # Format as "YYYY-MM-DD HH:MM:SS" string then parse back to naive datetime
        now_str = now_ist.strftime("%Y-%m-%d %H:%M:%S")
        now = datetime.strptime(now_str, "%Y-%m-%d %H:%M:%S")

        values = address.dict()
        values.update({
            "user_id": current_user["id"],
            "is_default": address.is_default if address.is_default else False,
            "created_at": now,
            "updated_at": now,
        })

        if values["is_default"]:
            await database.execute(
                addresses.update()
                .where(addresses.c.user_id == current_user["id"])
                .values(is_default=False)
            )

        address_id = await database.execute(addresses.insert().values(**values))
        result = await database.fetch_one(addresses.select().where(addresses.c.id == address_id))
        return dict(result) if result else None
    except Exception as e:
        print("Exception in create_user_address:", e)
        traceback.print_exc()
        raise

# Customer - Update own address
@router.put("/user/addresses/{address_id}", response_model=AddressRead, dependencies=[Depends(get_current_user)])
async def update_user_address(address_id: int, update: AddressUpdate, current_user=Depends(get_current_user)):
    addr = await database.fetch_one(addresses.select().where(addresses.c.id == address_id))
    if not addr or addr["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Address not found")

    update_data = update.dict(exclude_unset=True)

    # If updating to default address, unset previous default
    if update_data.get("is_default") == True:
        await database.execute(
            addresses.update()
            .where(addresses.c.user_id == current_user["id"])
            .values(is_default=False)
        )

    update_data["updated_at"] = datetime.utcnow()
    await database.execute(addresses.update().where(addresses.c.id == address_id).values(**update_data))
    updated = await database.fetch_one(addresses.select().where(addresses.c.id == address_id))
    return updated

# Customer - Delete own address
@router.delete("/user/addresses/{address_id}", response_model=Message, dependencies=[Depends(get_current_user)])
async def delete_user_address(address_id: int, current_user=Depends(get_current_user)):
    addr = await database.fetch_one(addresses.select().where(addresses.c.id == address_id))
    if not addr or addr["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Address not found")
    await database.execute(addresses.delete().where(addresses.c.id == address_id))
    return {"message": "Address deleted successfully"}
