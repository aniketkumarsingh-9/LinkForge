# LinkForge - Enterprise URL Shortener & Analytics Engine

> A high-performance, production-grade URL Shortener web application engineered with a Redis cache-aside redirection engine, MongoDB indexing, granular privacy-first click analytics, and modern React 18 dashboard.

---

## 1. Quick Start: How to Run with Docker (Recommended)

Running with **Docker Compose** is the fastest and easiest way to start LinkForge. It automatically spins up and connects all 4 services (**MongoDB 7.0**, **Redis 7.2 Cache**, **Node.js Express Backend**, and **React SPA served via Nginx**) with zero manual database or cache installation required.

### Prerequisites
- **Docker Desktop** installed on your system.
- Ensure Docker Desktop is started and running (the whale icon in your system tray is steady).

---

### Step 1: Start All Services

From the project root directory (`e:\Project\URL Shortener`), run:

```bash
docker compose up --build -d
```

*(This command builds the multi-stage backend and frontend images, pulls official MongoDB and Redis images, and starts all containers in the background).*

---

### Step 2: Access the Application

Once the containers are initialized:

| Service | URL | Description |
|---|---|---|
| **Web Application (UI)** | **[http://localhost:3000](http://localhost:3000)** | Full React 18 dashboard, landing page, and link management |
| **Backend REST API** | **[http://localhost:5000/api](http://localhost:5000/api)** | Express REST API endpoints |
| **Short Link Redirection** | **`http://localhost:5000/:code`** | Instant 302 redirection via Redis cache |
| **Service Health Check** | **[http://localhost:5000/api/health](http://localhost:5000/api/health)** | Real-time status of MongoDB, Redis, and uptime |

---

### Step 3: Useful Docker Commands

```bash
# Check container status and health checks
docker compose ps

# View live logs from all containers
docker compose logs -f

# View live logs specifically from the backend service
docker compose logs -f backend

# Stop all services (preserves database data in Docker volumes)
docker compose down

# Stop and wipe database volumes (clean reset)
docker compose down -v
```

---

### Alternative: Hybrid Local Development (Databases in Docker, Code Locally)

If you want live-reloading code on your host machine while letting Docker handle MongoDB and Redis:

```bash
# 1. Start ONLY MongoDB and Redis in Docker:
docker compose up -d mongodb redis

# 2. In a terminal, run the backend (starts on http://localhost:5000 with nodemon):
npm run dev:backend

# 3. In a second terminal, run the frontend (starts on http://localhost:5173 with Vite):
npm run dev:frontend
```

---

## 2. Text-Based Architecture Diagram

```
                              +---------------------------------------+
                              |         Client / Web Browser          |
                              +---------------------------------------+
                                  |                               |
                   HTTP 302       |                               | REST API
                   Redirection    |                               | /api/...
                                  v                               v
                     +-------------------------------------------------+
                     |            LinkForge Express Gateway            |
                     |  - Helmet security headers & CORS               |
                     |  - Rate limiters (Auth & URL creation)          |
                     |  - URL scheme validation (HTTP/HTTPS only)      |
                     |  - JWT cookie & Authorization header parser     |
                     +-------------------------------------------------+
                                       |
                   +-------------------+--------------------+
                   |                                        |
       1. Check Redis Cache                     Cache Miss / Management
                   |                                        |
                   v                                        v
       +-----------------------+                +-----------------------+
       |      Redis Cache      |                |     MongoDB Replica   |
       |  Key: url:shortcode:* | <--- Cache --- |  - Users collection   |
       |  TTL: Configurable    |      on Miss   |  - Urls collection    |
       +-----------------------+                |  - ClickEvents (log)  |
                   |                                    +-----------------------+
                   | Redirect (302 Found)                           ^
                   +------------------------------------------------+
                                    |
                           Asynchronous Background
                           Click Event Logging (setImmediate)
```

---

## 3. Core Features

### A. URL Shortening & Collision Resistance
- **Base62 Cryptographic Code Generation:** Generates 7-character URL-safe identifiers derived from `crypto.randomBytes` ($62^7 \approx 3.52 \times 10^{12}$ distinct combinations).
- **Collision Retry Strategy:** Verifies database index constraints before fallback code length extension.
- **Custom Branded Aliases:** Supports custom alias creation ($3\text{--}30$ characters, alphanumeric with hyphens and underscores).
- **Reserved Route Guard:** Prohibits critical system routes (`api`, `auth`, `admin`, `dashboard`, `login`, `register`, `static`, etc.) from being claimed.
- **Configurable Expiration:** Optional future expiration timestamps (`expiresAt`) returning HTTP 410 Gone when reached.

### B. Sub-Millisecond Redirection & Cache-Aside
- **HTTP 302 Found:** Intentionally utilizes 302 (Temporary Redirect) over 301 so browsers do not cache the destination locally, preserving accurate real-time click telemetry.
- **Redis Cache-Aside:**
  1. Incoming `GET /:code` checks Redis key `url:shortcode:<code`.
  2. **Cache Hit:** Checks expiration timestamp; if valid, redirects immediately.
  3. **Cache Miss:** Queries MongoDB with `{ shortCode: code }`. If found and active, sets Redis key with appropriate TTL and redirects.
  4. **Degradation Resilience:** If Redis disconnects, LinkForge automatically falls back to MongoDB lookups with warning logs.
- **Cache Invalidation:** Updates to URL alias, active status, or URL deletion immediately evict or update the Redis key.

### C. Granular, Privacy-First Analytics
- **Unbounded Document Protection:** Click events are persisted in a separate `ClickEvent` collection with compound indexing `{ urlId: 1, timestamp: -1 }`. The parent `Url` document maintains an atomic counter (`clickCount`) for $O(1)$ dashboard reads.
- **Non-Blocking Telemetry:** Redirection responses are dispatched immediately; click recording executes asynchronously in Node's event loop via `setImmediate()`.
- **Privacy Compliance:** IP addresses are salted and hashed using SHA-256 (`ipHash`) to allow unique visit quantification without storing personal identifiable information (PII).
- **Device & Browser Detection:** Categorizes traffic into desktop, mobile, tablet, and browser types using `ua-parser-js`.

### D. User Authentication & Dashboard
- **Security:** Passwords hashed with `bcryptjs` using 12 salt rounds.
- **JWT Session Management:** Delivered via `HttpOnly`, `SameSite` cookies with fallback support for `Authorization: Bearer <token>` headers.
- **Scoped Permissions:** Strict ownership enforcement ensures users can only inspect, edit, or delete URLs they own.
- **Interactive UI:** Search with debouncing, sorting by click count or creation date, status filter pills, pagination, QR code modal with PNG export, and Recharts interactive time-series charts.

---

## 4. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Vanilla CSS (Design Tokens & Glassmorphism), Recharts, Lucide Icons, QRCode |
| **Backend** | Node.js (v22 LTS), Express.js (ES Modules), Mongoose ODM, Redis (v4 Client), JWT, bcryptjs, Helmet, Express Rate Limit |
| **Databases** | MongoDB 7.0 (Persistent volume & compound indexes), Redis 7.2 Alpine (In-memory cache) |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfiles, Nginx Reverse Proxy |

---

## 5. Clean Directory Structure

```
linkforge/
├── .env.example                # Sample environment configuration
├── .gitignore                  # Git ignore rules for node_modules, logs, dist
├── docker-compose.yml          # Container orchestration (App, DB, Cache, Nginx)
├── LICENSE                     # MIT License
├── package.json                # Root package with unified scripts
├── README.md                   # System documentation
│
├── backend/
│   ├── Dockerfile              # Multi-stage production container build
│   ├── package.json            # Node.js backend dependencies & scripts
│   └── src/
│       ├── config/             # Environment, MongoDB, and Redis clients
│       │   ├── db.js
│       │   ├── env.js
│       │   └── redis.js
│       ├── controllers/        # Request handling and response dispatch
│       │   ├── analyticsController.js
│       │   ├── authController.js
│       │   ├── redirectController.js
│       │   └── urlController.js
│       ├── middleware/         # Security, rate limiting, auth, validation
│       │   ├── auth.js
│       │   ├── errorHandler.js
│       │   ├── rateLimiter.js
│       │   └── validate.js
│       ├── models/             # Mongoose schemas & indexes
│       │   ├── ClickEvent.js
│       │   ├── Url.js
│       │   └── User.js
│       ├── routes/             # REST endpoint routing definitions
│       │   ├── analyticsRoutes.js
│       │   ├── authRoutes.js
│       │   └── urlRoutes.js
│       ├── services/           # Business logic & cache management
│       │   ├── codeGenerator.js
│       │   └── redisService.js
│       ├── utils/              # Structured logging and request metadata
│       │   ├── logger.js
│       │   └── userAgentParser.js
│       ├── app.js              # Express app configuration
│       └── server.js           # Server lifecycle & graceful shutdown
│
└── frontend/
    ├── Dockerfile              # Production multi-stage build (Vite -> Nginx)
    ├── nginx.conf              # Nginx SPA router and API proxy configuration
    ├── package.json            # Frontend dependencies
    ├── vite.config.js          # Vite configuration with API dev proxy
    ├── index.html              # HTML5 entry with modern SEO metadata
    └── src/
        ├── api/                # Reusable HTTP client and API endpoints
        ├── components/         # Modals, Navbar, StatCards, Table, Toasts
        ├── context/            # AuthContext and ToastContext
        ├── hooks/              # useAuth, useToast, useDebounce
        ├── layouts/            # MainLayout wrapper
        ├── pages/              # Landing, Dashboard, Details, Login, Register, 404
        ├── routes/             # Client-side protected route definitions
        ├── styles/             # Modular Vanilla CSS (Tokens, Global, Components)
        ├── utils/              # Client validators, formatters, and constants
        ├── App.jsx             # Main component tree
        └── main.jsx            # DOM entry
```

---

## 6. Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`) |
| `PORT` | `5000` | Port for the backend Express server |
| `BASE_URL` | `http://localhost:5000` | Public base URL used for prefixing shortened links |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS origin whitelisting |
| `MONGODB_URI` | `mongodb://localhost:27017/linkforge` | MongoDB connection URI |
| `REDIS_HOST` | `localhost` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD`| `""` | Redis authentication password (if configured) |
| `REDIS_CACHE_TTL`| `86400` | Cache time-to-live in seconds (default: 24h) |
| `JWT_SECRET` | `(dev-fallback)` | Strong secret key for signing authentication JWTs |
| `JWT_EXPIRES_IN`| `7d` | Token expiration period |
| `COOKIE_SECRET`| `(dev-fallback)` | Secret for signing session cookies |
| `AUTH_RATE_LIMIT_MAX` | `10` | Maximum login/registration attempts per 15 minutes |

---

## 7. API Reference

All responses return standard JSON: `{ "success": true, "data": { ... } }` or `{ "success": false, "message": "..." }`.

### Authentication Endpoints
- `POST /api/auth/register` — Register a new account (`email`, `password`, `name`).
- `POST /api/auth/login` — Sign in, issues `linkforge_token` HttpOnly cookie & JWT.
- `POST /api/auth/logout` — Clear session cookie.
- `GET /api/auth/me` — Get current authenticated user profile.

### URL Management Endpoints
- `POST /api/urls` — Create short URL (`originalUrl`, optional `customAlias`, optional `expiresAt`, optional `title`).
- `GET /api/urls` — List authenticated user's URLs with pagination (`page`, `limit`), search (`search`), filter (`all`, `active`, `expired`), and sorting (`sortBy`, `order`).
- `GET /api/urls/:id` — Get single URL details (ownership protected).
- `PATCH /api/urls/:id` — Update title, custom alias, active status, or expiration (evicts and updates Redis cache).
- `DELETE /api/urls/:id` — Delete URL and purge from Redis cache.

### Analytics Endpoints
- `GET /api/urls/:id/analytics?days=30` — Granular timeline, device breakdown, top referrers, and recent clicks.
- `GET /api/analytics/overview` — Account-wide overview (total links, total clicks, active vs expired, 14-day overall click trend).

### Redirection Endpoint
- `GET /:code` — Resolves short code via Redis cache-aside, records click asynchronously, and issues **HTTP 302 Found** redirect.

---

## 8. Security Considerations

1. **SSRF Prevention:** The backend never initiates server-side outbound HTTP requests to user-submitted URLs.
2. **Scheme Whitelisting:** Malicious schemes (`javascript:`, `data:`, `file:`, `vbscript:`) are strictly rejected. Only `http:` and `https:` are permitted.
3. **NoSQL Injection Defense:** Middleware scrubs all MongoDB query operators (keys prefixed with `$`) from incoming payloads.
4. **Rate Limiting:** Protects endpoints against brute-force attacks and abuse.
5. **No Secret Leakage:** Models exclude passwords and IP hashes by default (`select: false`).

---

## 9. License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
