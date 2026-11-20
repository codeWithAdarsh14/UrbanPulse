# UrbanPulse Backend Authentication & Rate Limiting Reference

This directory contains the production-ready backend authentication, rate-limiting, and user schema extensions created to integrate with the existing MongoDB Atlas database and Express server.

Per the **STRICT RULE: DO NOT MODIFY EXISTING CODE**, these files were authored separately and **have NOT modified any existing files in `UrbanPulse-complete/server/`**.

---

## 📁 Architecture Overview

```
backend-reference/
├── models/
│   └── User.js                       # Mongoose model matching 'users' collection (bcrypt hashing, unique email)
├── controllers/
│   └── auth.controller.js           # Register, login, getMe, logout with generic error responses
├── routes/
│   └── auth.routes.js               # Express router for /api/auth endpoints
└── middleware/
    ├── auth.middleware.js            # JWT verification & role authorization (protect, authorize)
    └── rateLimiter.middleware.js     # express-rate-limit protection (5 attempts / 15m)
```

---

## 🚀 How to Enable in `server.js` (When Approved)

To connect these backend modules into the existing `UrbanPulse-complete/server/server.js`, you only need to copy these files into `server/` and add **3 lines of code** in `server.js`:

### 1. Copy files:
- `backend-reference/models/User.js` ➔ `server/models/User.js`
- `backend-reference/controllers/auth.controller.js` ➔ `server/controllers/auth.controller.js`
- `backend-reference/routes/auth.routes.js` ➔ `server/routes/auth.routes.js`
- `backend-reference/middleware/*` ➔ `server/middleware/`

### 2. Install dependencies in `server/`:
```bash
npm install bcryptjs jsonwebtoken express-rate-limit
```

### 3. Add to `server/server.js`:
```javascript
// At top with route imports:
const authRoutes = require('./routes/auth.routes');

// In route mounts:
app.use('/api/auth', authRoutes);
```

### 4. Optional Environment Variables (`server/.env`):
```env
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```
