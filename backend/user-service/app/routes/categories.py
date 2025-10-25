from fastapi import APIRouter, status
from app.database import database
from app.models import item_categories, categories
from app.schemas import CategoryRead, CategoryCreate
from typing import List


LOW_STOCK_THRESHOLD = 5
router = APIRouter()

@router.post("/categories/", response_model=CategoryRead)
async def create_category(category: CategoryCreate):
    category_id = await database.execute(categories.insert().values(
        name=category.name,
        description=category.description,
        parent_id=category.parent_id
    ))
    created = await database.fetch_one(categories.select().where(categories.c.id == category_id))
    return created

@router.get("/categories/", response_model=List[CategoryRead])
async def get_all_categories():
    rows = await database.fetch_all(categories.select())
    return rows

@router.get("/items/{item_id}/categories", response_model=List[CategoryRead])
async def get_item_categories(item_id: int):
    query = (
        categories.select()
        .select_from(categories.join(item_categories, categories.c.id == item_categories.c.category_id))
        .where(item_categories.c.item_id == item_id)
    )
    rows = await database.fetch_all(query)
    return rows

@router.post("/items/{item_id}/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_category_to_item(item_id: int, category_id: int):
    await database.execute(item_categories.insert().values(item_id=item_id, category_id=category_id))
    return {"message": "Category added to item"}

@router.delete("/items/{item_id}/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_category_from_item(item_id: int, category_id: int):
    await database.execute(item_categories.delete().where(
        item_categories.c.item_id == item_id,
        item_categories.c.category_id == category_id
    ))
    return {"message": "Category removed from item"}