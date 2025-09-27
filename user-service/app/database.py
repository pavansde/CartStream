import os
from databases import Database

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+aiomysql://root:yourpassword@localhost:3306/users")

database = Database(DATABASE_URL)
