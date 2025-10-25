from fastapi import APIRouter, status
from app.database import database
from app.models import item_attributes
from app.schemas import ItemAttributeRead, ItemAttributeCreate
from typing import List
import os
import time

LOW_STOCK_THRESHOLD = 5
router = APIRouter()

@router.post("/items/{item_id}/attributes/", response_model=ItemAttributeRead)
async def add_item_attribute(item_id: int, attribute: ItemAttributeCreate):
    attribute_id = await database.execute(item_attributes.insert().values(
        item_id=item_id,
        attribute_key=attribute.attribute_key,
        value=attribute.value
    ))
    created = await database.fetch_one(item_attributes.select().where(item_attributes.c.id == attribute_id))
    return created

@router.get("/items/{item_id}/attributes/", response_model=List[ItemAttributeRead])
async def get_item_attributes(item_id: int):
    rows = await database.fetch_all(item_attributes.select().where(item_attributes.c.item_id == item_id))
    return rows

@router.put("/attributes/{attribute_id}", response_model=ItemAttributeRead)
async def update_item_attribute(attribute_id: int, attribute: ItemAttributeCreate):
    await database.execute(item_attributes.update().where(item_attributes.c.id == attribute_id).values(
        attribute_key=attribute.attribute_key,
        value=attribute.value
    ))
    updated = await database.fetch_one(item_attributes.select().where(item_attributes.c.id == attribute_id))
    return updated

@router.delete("/attributes/{attribute_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_attribute(attribute_id: int):
    await database.execute(item_attributes.delete().where(item_attributes.c.id == attribute_id))
    return {"message": "Attribute deleted"}