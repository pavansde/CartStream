<!-- docker command to run mysql in terminal:  docker exec -it mysql-db mysql -u root -p12345 users -->


# CartStream
CartStream – Your seamless end‑to‑end eCommerce solution with FastAPI, MySQL &amp; React‑TailwindCSS. Fast, secure, role‑based, and designed for a stunning shopping journey.

````markdown
# 🚀 User Management System (FastAPI + MySQL + React + TailwindCSS)

A **full-stack user management system** with:

- **FastAPI** backend (JWT authentication, role-based access)  
- **MySQL** database  
- **React + TailwindCSS** frontend  
- **Responsive UI + Role-aware navigation**  
- **Password reset support**  

---

## 📖 Table of Contents
1. [Backend](#-backend-fastapi)  
2. [Frontend](#-frontend-react--tailwindcss)  
3. [Running Locally](#-running-locally)  
4. [API Reference](#-api-reference)  
5. [Common Issues & Fixes](#-common-issues--fixes)  
6. [Project Structure](#-project-structure)  
7. [Notes](#-notes)  

---

## 🖥 Backend (FastAPI)

### **Tech Stack**
- FastAPI
- MySQL
- SQLAlchemy + `databases` (async)
- `passlib[bcrypt]` + `bcrypt>=4.0.0` for password hashing
- `python-jose[cryptography]` for JWT
- `pydantic[email]` for validation
- `python-dotenv` for environment variables
- `fastapi.middleware.cors.CORSMiddleware` for CORS

---

### **Environment Variables**

Create `.env` in backend folder:

```env
DATABASE_URL=mysql+aiomysql://root:password@db_host/db_name
SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# For password reset email
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
````

---

### **Main Features**

* **Register** (`POST /users/`)
* **Login** with JWT (`POST /login/`)
* **Get Current User** (`GET /me`)
* **Update Profile** (`PUT /me`)
* **Admin Actions**:

  * List all users (`GET /users/`)
  * Delete user (`DELETE /users/{id}`)
* **Password Reset**:

  * Request reset link (`POST /forgot-password`)
  * Change password (`POST /reset-password`)

---

## 🎨 Frontend (React + TailwindCSS)

### **Tech Stack**

* React (with Create React App)
* React Router v6
* Axios for API calls
* `jwt-decode`
* TailwindCSS

---

### **Setup**

1. Create React project:

```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom jwt-decode tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. Configure **`tailwind.config.js`**:

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

3. Edit `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### **Pages**

* **Login** → Authenticates user, stores JWT in `localStorage`
* **Register** → Creates account
* **Dashboard** → Protected route showing `/me`
* **Admin Panel** → Only visible to `role=admin`
* **Navbar** → Responsive + dynamic colors per page

---

## 🚀 Running Locally

### **Backend**

```bash
# Install deps
pip install -r requirements.txt

# Run server
uvicorn main:app --reload
```

Make sure MySQL is running and `.env` is set properly.

---

### **Frontend**

```bash
cd frontend
npm install
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📡 API Reference

### **Auth**

#### Register

`POST /users/`

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "123456"
}
```

#### Login

`POST /login/`

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**

```json
{
  "access_token": "<JWT_TOKEN>",
  "token_type": "bearer"
}
```

---

### **User**

#### Get Current User

`GET /me` (Requires Bearer Token)

---

### **Admin**

#### Get Users

`GET /users/` (admin only)

#### Delete User

`DELETE /users/{id}` (admin only)

---

### **Password Reset**

#### Request Reset

`POST /forgot-password`

```json
{ "email": "user@example.com" }
```

#### Reset Password

`POST /reset-password`

```json
{ "token": "<RESET_TOKEN>", "new_password": "newpass" }
```

---

## 🛠 Common Issues & Fixes

**Missing `role` column**

```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
```

**bcrypt `__about__` error**

```bash
pip install --upgrade bcrypt==4.0.1
docker-compose build --no-cache
```

**CORS errors**

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📂 Project Structure

**Backend**

```
/app
├── main.py
├── models.py
├── routes/
├── auth.py
├── database.py
├── schemas.py
└── utils.py
```

**Frontend**

```
/frontend
├── src/
│   ├── api/axios.js
│   ├── components/Navbar.js
│   ├── context/AuthContext.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   └── AdminPanel.js
│   └── App.js
└── tailwind.config.js
```

---

## 📌 Notes

* First admin can be created by setting `role='admin'` in DB.
* Password reset requires SMTP settings.
* Navbar dynamically changes background based on route.
* Fully responsive with Tailwind.

---

## ✅ Current Status

✔ Backend functional (auth, roles, reset)
✔ Frontend styled & role-aware navigation
✔ Mobile responsive
✔ Bug fixes applied for bcrypt, CORS, and DB schema



