from fastapi import FastAPI
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

app = FastAPI(title="User Service")

origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000"  # React frontend URL
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


@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def root():
    return {"message": "User Service is up and running"}
