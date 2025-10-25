from fastapi import FastAPI
import os
from dotenv import load_dotenv
from app.database import database, DATABASE_URL
from app.models import metadata  # Import shared metadata with all tables
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users as users_routes
from app.routes import items as items_routes
from app.routes import orders as orders_routes
from app.routes import wishlist as wishlist_routes
from app.routes import notifications as notifications_routes
from app.routes import carts as carts_routes  # Import the carts routes
from sqlalchemy import create_engine
from app.routes import coupons as coupons_routes
from app.routes import addresses as addresses_routes
from app.routes import categories as categories_routes
from app.routes import item_attributes as item_attributes_routes
from fastapi.staticfiles import StaticFiles

load_dotenv(dotenv_path="/app/.env")

app = FastAPI(title="User Service")

app.mount("/static", StaticFiles(directory="static"), name="static")

origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    # add other allowed origins here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["*"] to allow all origins during dev
    allow_credentials=True,
    allow_methods=["*"],    # allow all HTTP methods like GET, POST, OPTIONS
    allow_headers=["*"],    # allow all headers
)

# Use pymysql for sync schema creation instead of MySQLdb
sync_db_url = DATABASE_URL.replace("+aiomysql", "+pymysql")
engine = create_engine(sync_db_url)

# Create all tables defined in metadata (users, items, notifications, etc.)
metadata.create_all(engine)

# Include routes
app.include_router(users_routes.router)
app.include_router(items_routes.router)
app.include_router(orders_routes.router)
app.include_router(wishlist_routes.router)
app.include_router(notifications_routes.router)
app.include_router(carts_routes.router, prefix="/cart")
app.include_router(coupons_routes.router)
app.include_router(addresses_routes.router)
app.include_router(categories_routes.router)
app.include_router(item_attributes_routes.router)


@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def root():
    return {"message": "User Service is up and running"}
