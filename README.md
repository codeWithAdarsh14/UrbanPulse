# UrbanPulse (V1)

UrbanPulse is a full-stack web application designed for civic monitoring and urban intelligence.

---

## 🏛 Architecture Overview

The project is structured as a decoupled monorepo containing distinct frontend (`client/`) and backend (`server/`) environments:

- **Frontend (`client/`)**: Built with **React** powered by **Vite** (JavaScript / JSX). Configured with a built-in development proxy to communicate seamlessly with the backend API.
- **Backend (`server/`)**: Built with **Node.js** and **Express** (CommonJS). Configured for modular routing, controllers, configuration management, and environment variable loading.

```
UrbanPulse/
├── client/                     # Vite + React Frontend Application
│   ├── public/                 # Static assets
│   ├── src/                    # React components, styles, and logic
│   ├── .gitignore              # Client-specific Git ignore rules
│   ├── index.html              # HTML entry point
│   ├── package.json            # Client dependencies and scripts
│   └── vite.config.js          # Vite configuration with dev proxy
├── server/                     # Node.js + Express Backend API
│   ├── config/                 # Configuration modules (e.g., db, loggers)
│   ├── controllers/            # Request handlers (e.g., health.controller.js)
│   ├── middleware/             # Express middlewares
│   ├── models/                 # Data schemas/models
│   ├── routes/                 # Route declarations (e.g., health.routes.js)
│   ├── services/               # Core business logic services
│   ├── utils/                  # Helper utilities and shared functions
│   ├── .env.example            # Backend environment variable template
│   ├── .gitignore              # Server-specific Git ignore rules
│   ├── package.json            # Server dependencies and scripts
│   └── server.js               # Express application entrypoint
├── .gitignore                  # Root Git ignore rules (node_modules, .env, build output)
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (v24+ recommended)
- **npm**: v9.0.0 or later

---

### 1. Server Setup

Navigate into the `server/` directory:

```bash
cd server
npm install
```

#### Environment Configuration

Copy the example environment file:

```bash
# On Windows PowerShell
cp .env.example .env

# On Linux / macOS / Bash
cp .env.example .env
```

Default variables defined in `server/.env.example`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Express HTTP server |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed origin for Cross-Origin Resource Sharing (CORS) |

#### Running the Server

- **Development mode** (auto-reloading with native Node `--watch`):
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```

The server starts by default on `http://localhost:5000`.

---

### 2. Client Setup

Open a separate terminal window and navigate into the `client/` directory:

```bash
cd client
npm install
```

#### Running the Client

- **Development mode**:
  ```bash
  npm run dev
  ```
- **Production build check**:
  ```bash
  npm run build
  ```

The client will be accessible at `http://localhost:5173`.

---

## 🔌 API & Development Proxy

### Health Check Endpoint

- **Endpoint**: `GET /api/health`
- **Port**: `5000` (Direct) or `5173` (Proxied through Vite)
- **Sample Response**:
  ```json
  {
    "status": "ok",
    "message": "UrbanPulse API is operational",
    "timestamp": "2026-10-14T05:01:44.229Z",
    "uptime": 10.56
  }
  ```

### Development Proxy Approach

To ensure smooth client-server interaction during development and prevent CORS issues when consuming endpoints:
- `client/vite.config.js` defines a local reverse proxy on `/api`:
  ```javascript
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
  ```
- When the frontend requests `/api/health`, Vite forwards the request to `http://localhost:5000/api/health`.
- Both frontend and backend can also be operated completely independently without cross-dependency.

---

## 📦 Installed Dependencies

To maintain a lean Day 1 baseline, only essential dependencies have been installed:

### Backend (`server/`)
- `express`: Core web application framework for routing and middleware.
- `cors`: Cross-Origin Resource Sharing middleware for client communication.
- `dotenv`: Loads environment variables from `.env` files.
*(Development reloading uses Node's native `--watch` mode to avoid dependency bloat and security vulnerabilities).*

### Frontend (`client/`)
- `react` & `react-dom`: Component rendering and state management.
- `vite` & `@vitejs/plugin-react`: Fast modern build tool and dev server.
