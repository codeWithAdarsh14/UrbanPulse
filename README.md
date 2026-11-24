# UrbanPulse

**A Civic Intelligence & Urban Monitoring Platform**

UrbanPulse is a full-stack web application designed to connect citizens with their urban environment through geospatial civic issue reporting, community event discovery, and city-level monitoring tools.

The platform combines an interactive map interface with a REST API and MongoDB-backed data storage to make civic information easier to explore and manage.

---

## ✨ Features

### 🗺️ Interactive Civic Map
- Interactive maps powered by **Leaflet** and **OpenStreetMap**.
- Geographical visualization of civic reports and community events.
- Location-based data using GeoJSON coordinates.
- Nearby report and event discovery through geospatial queries.

### 📢 Civic Issue Reporting
- Submit civic reports with a title, description, category, and geographical location.
- Support for report image references.
- Track report status.
- Confirm or dispute reports through authenticated API endpoints.
- Retrieve reports through paginated and location-based endpoints.

### 🎉 Community Events
- Create and explore community events.
- Store event descriptions, categories, venues, locations, and schedules.
- Retrieve events using pagination.
- Discover events near geographical coordinates.

### 🔐 Authentication & User Profiles
- User registration and login.
- JWT-based authentication.
- Password hashing with bcrypt.
- Protected profile endpoints.
- Profile information updates.
- Login and registration rate limiting.
- Client-side input validation and login-attempt protection.

### 🌍 City Monitoring
- Operations console and civic overview interface.
- Civic statistics and report metrics.
- Air Quality Index data retrieval through the Open-Meteo Air Quality API.
- Location lookup and geospatial utilities.

### 🎨 User Interface
- Responsive React interface.
- Light and dark theme support.
- Landing, login, registration, and map pages.
- Dashboard navigation and protected application access.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, JavaScript, JSX |
| Build Tool | Vite 8 |
| Mapping | Leaflet, React Leaflet, OpenStreetMap |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcryptjs |
| API Protection | express-rate-limit |
| Configuration | dotenv |
| Air Quality Data | Open-Meteo Air Quality API |

---

## 🏗️ Project Architecture

UrbanPulse follows a separated frontend/backend architecture.

```text
UrbanPulse/
│
├── client/                         # Primary React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Auth/
│       │   ├── Console/
│       │   ├── Features/
│       │   ├── Footer/
│       │   ├── Navbar/
│       │   └── Statistics/
│       │
│       ├── context/                 # Authentication and theme state
│       ├── pages/                   # Application pages
│       ├── services/                # API and data services
│       ├── utils/                   # Validation and helper functions
│       ├── App.jsx
│       └── index.css
│
├── server/                          # Express backend
│   ├── config/                      # Database configuration
│   ├── controllers/                 # API request handlers
│   ├── middleware/                  # Authentication and rate limiting
│   ├── models/                      # Mongoose models
│   ├── routes/                      # API route definitions
│   ├── services/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── urbanpulse-new-ui/               # Additional frontend implementation
│
└── README.md
```

> `client/` is the primary frontend documented in the existing project README. `urbanpulse-new-ui/` is a separate frontend implementation with its own package configuration. The instructions below use `client/`.

---

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- Node.js (use a version compatible with Vite 8)
- npm
- MongoDB Atlas account or an accessible MongoDB deployment
- Git

### 1. Clone the repository

```bash
git clone https://github.com/codeWithAdarsh14/UrbanPulse.git
cd UrbanPulse
```

### 2. Configure the backend

Open a terminal:

```bash
cd server
npm install
```

Create your environment file:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

### 3. Configure environment variables

Open `server/.env` and configure the following values:

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port. Default: `5000` |
| `NODE_ENV` | Runtime environment. Default: `development` |
| `CLIENT_URL` | Frontend origin used for CORS |
| `MONGODB_URI` | MongoDB connection string. Required |
| `DNS_SERVERS` | Optional comma-separated DNS server addresses |

Example:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/auth

DNS_SERVERS=
```

The database configuration also accepts `MONGO_URI` as an alternative to `MONGODB_URI`.

**Important security configuration:** The authentication controller reads `JWT_SECRET` and `JWT_EXPIRES_IN`. Configure a strong, private `JWT_SECRET` in your local environment, and never commit it to Git. The current `.env.example` does not list these two variables.

### 4. Start the backend

From the `server/` directory:

```bash
npm run dev
```

For normal startup:

```bash
npm start
```

The backend uses port `5000` by default.

### 5. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite development URL:

```text
http://localhost:5173
```

### 6. Build the frontend

To create a production frontend build:

```bash
cd client
npm run build
```

To preview the generated build locally:

```bash
npm run preview
```

To run the frontend linter:

```bash
npm run lint
```

---

## 🔌 API Documentation

The backend exposes REST endpoints under the `/api` prefix.

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API and database connection status |

### Authentication

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a user | Public |
| POST | `/api/auth/login` | Authenticate a user | Public |
| GET | `/api/auth/me` | Get authenticated user | Protected |
| GET | `/api/auth/profile` | Get authenticated profile | Protected |
| PUT | `/api/auth/profile` | Update authenticated profile | Protected |
| POST | `/api/auth/logout` | Logout response endpoint | Public |

### Civic Reports

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/reports` | Create a civic report | Protected |
| GET | `/api/reports` | Retrieve paginated reports | Public |
| GET | `/api/reports/nearby` | Find nearby reports | Public |
| GET | `/api/reports/:id` | Retrieve a report by ID | Public |
| POST | `/api/reports/:id/confirm` | Confirm a report | Protected |
| POST | `/api/reports/:id/dispute` | Dispute a report | Protected |

### Community Events

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/events` | Create an event | Public |
| GET | `/api/events` | Retrieve paginated events | Public |
| GET | `/api/events/nearby` | Find nearby events | Public |
| GET | `/api/events/:id` | Retrieve an event by ID | Public |

### User Profiles

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/users/profile` | Retrieve authenticated profile | Protected |
| PUT | `/api/users/profile` | Update authenticated profile | Protected |

**Protected endpoints** require a valid JWT access token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example: Health Check

```http
GET http://localhost:5000/api/health
```

Example response:

```json
{
  "status": "ok",
  "message": "UrbanPulse API is operational",
  "timestamp": "2026-01-01T10:00:00.000Z",
  "uptime": 120,
  "database": {
    "status": "connected",
    "ready": true
  }
}
```

The timestamp and uptime values are generated at runtime.

---

## 📍 Geospatial Data Format

Reports and events use GeoJSON Point coordinates.

Example:

```json
{
  "type": "Point",
  "coordinates": [77.6737, 27.4924]
}
```

**Coordinate order matters:**

- First value: Longitude
- Second value: Latitude

The backend uses MongoDB geospatial queries to retrieve nearby reports and events.

---

## 🔒 Security

The project includes several authentication and API protection mechanisms:

- Password hashing with bcryptjs.
- JWT-based authentication middleware.
- Protected user profile and report operations.
- Login and registration rate limiting.
- Client-side validation and login-attempt lockout.
- Environment-based database configuration.

For production deployment, configure a secure JWT secret, restrict CORS to trusted origins, and keep database credentials outside source control.

---

## 🧭 Development Notes

- The frontend and backend run independently in separate terminals.
- The backend uses CommonJS modules.
- The frontend uses ES modules.
- MongoDB connectivity is required for database-backed operations.
- The backend health endpoint reports both API status and database readiness.
- The frontend uses API service modules to communicate with backend endpoints.

---

## 📌 Current Project Scope

UrbanPulse includes civic reporting, geospatial discovery, community events, authentication, user profiles, and city-monitoring interface components.

Some interface elements and dashboard statistics may be illustrative or dependent on external data availability. A displayed metric should not automatically be interpreted as a verified live municipal measurement.

---

## 👨‍💻 Author

**Adarsh Singh**

GitHub: [@codeWithAdarsh14](https://github.com/codeWithAdarsh14)

Project: [UrbanPulse](https://github.com/codeWithAdarsh14/UrbanPulse)

---

## 📄 License

This project currently declares the **ISC** license in the backend package configuration. Refer to the repository's license file, if present, for the definitive project-wide licensing terms.

---

*UrbanPulse — Making cities more connected, informed, and responsive.*