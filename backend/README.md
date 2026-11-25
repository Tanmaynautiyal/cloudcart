# CloudCart 🛒 — Backend API Service

> [!NOTE]
> For the complete full-stack guide, system architecture, database schema, pgAdmin setup, and demo credentials, refer to the master [README.md](file:///home/tanmay/Desktop/cloudcart/README.md).

Welcome to the **CloudCart API** backend service, a high-performance RESTful API built with **Python 3.12**, **FastAPI**, **PostgreSQL 16**, **SQLAlchemy 2.0**, and **Pydantic v2**.

---

CloudCart provides a complete multi-vendor shopping experience featuring consumer storefronts, merchant vendor dashboards, and a centralized Super Admin control center. It runs entirely on your local machine with zero external cloud or AWS dependencies.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Schema & ER Diagram](#6-database-schema--er-diagram)
7. [Project Folder Structure](#7-project-folder-structure)
8. [Prerequisites & Installation](#8-prerequisites--installation)
9. [PostgreSQL Configuration](#9-postgresql-configuration)
10. [Environment Variable Configuration](#10-environment-variable-configuration)
11. [Backend Startup Guide](#11-backend-startup-guide)
12. [Frontend Startup Guide](#12-frontend-startup-guide)
13. [Interactive API Documentation (Swagger / ReDoc)](#13-interactive-api-documentation-swagger--redoc)
14. [Complete API Endpoints Reference](#14-complete-api-endpoints-reference)
15. [Automated Testing Guide](#15-automated-testing-guide)
16. [Stripe Test-Mode & Payment Simulation](#16-stripe-test-mode--payment-simulation)
17. [Troubleshooting Guide](#17-troubleshooting-guide)
18. [Pre-Seeded Demo Accounts](#18-pre-seeded-demo-accounts)

---

## 1. Project Overview

CloudCart is designed as a modular, monolithic e-commerce application. It separates concerns between:
- A reactive **Single Page Application (SPA)** built with React, Vite, and modern CSS variables.
- A high-throughput **RESTful API** backend powered by Python FastAPI, Pydantic v2, and SQLAlchemy 2.0.
- A transactional relational database (**PostgreSQL** with seamless local **SQLite** fallback).
- A local file-storage pipeline for product media (storing uploads directly in `backend/uploads/` rather than third-party cloud buckets).

Whether you are browsing audio equipment and creator hardware as a customer, listing inventory as an independent merchant seller, or managing platform commissions as Super Admin, CloudCart handles every stage of the commerce lifecycle with real-time feedback and pessimistic database locking.

---

## 2. Key Features

### 🛍️ Customer Storefront (`/`)
- **Product Discovery**: Instant live search, category browsing, brand and badge filters, and sorting (price low/high, rating, newest).
- **Product Details**: Multi-angle image viewing, real-time stock counters, star rating breakdowns, warranty and delivery guarantees, and a 1-click URL share tool.
- **Cart & Wishlist**: Persistent cart state, live quantity increments, coupon discount codes, subtotal/tax calculation, and a heart-animated wishlist.
- **Multi-Step Checkout**: Form-validated delivery address selection and multiple payment methods (Credit Card, PayPal, Apple Pay, Cash on Delivery).
- **Customer Account**: Profile editing, saved shipping addresses, itemized order receipts, and real-time delivery lifecycle tracking (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`).

### 🏬 Merchant Seller Console (`/seller`)
- **Dedicated Merchant Dashboard**: Clean, private portal generated automatically upon merchant registration.
- **Tenant Isolation**: Each seller only sees and manages their own products, stock levels, and customer orders.
- **Product Catalog Management**: Add products with prices, SKU tags, and category assignments; edit specifications; pause/activate listings; delete items.
- **Inventory Control**: Real-time stock alerts, threshold warnings, and 1-click batch restocks (`+10`, `+25`, `+50` units).
- **Order Fulfillment**: Track customer purchases, update order dispatch stages, and assign carrier tracking numbers.
- **Mobile Responsive**: Off-canvas sliding drawer navigation with backdrop overlay optimized for phones and tablets.

### 🛡️ Super Admin Control Center (`/admin`)
- **Platform Analytics**: Total platform revenue, gross merchandise value (GMV), 10% platform commission analytics, orders volume, and active customer counts.
- **Multi-Vendor Merchant Oversight**: View all registered sellers, inspect individual merchant consoles, and approve, pause, or suspend seller accounts.
- **Catalog Master Control**: Add, edit, duplicate, and delete products across all categories; upload product images.
- **Department Taxonomy**: Create, modify, and delete product categories with promotional discount banners and RESTRICT foreign-key safety.
- **Order Audit & Status Control**: Master ledger of all platform orders with instant status transition controls.

### 🔒 Enterprise Security & Robustness
- **Bcrypt Password Hashing**: Passwords are never stored in plaintext.
- **JWT Authentication**: Short-lived Access Tokens (HS256) paired with long-lived Refresh Tokens.
- **Pessimistic Inventory Locking**: Database transactions lock product rows using `with_for_update()` during checkout to eliminate race conditions and negative inventory.
- **Server-Authoritative Pricing**: Frontend totals and prices are never trusted; subtotals, tax rates, and shipping costs are calculated on the backend.
- **HMAC Webhook Verification**: Payment webhook listener validates SHA-256 HMAC signatures and includes idempotency checks to prevent duplicate charge processing.

---

## 3. Technology Stack

### Backend
| Technology | Role | Description |
| :--- | :--- | :--- |
| **Python 3.12** | Core Runtime | Fast, modern Python runtime with typing support |
| **FastAPI** | Web Framework | High-performance asynchronous API framework with automated OpenAPI generation |
| **SQLAlchemy 2.0** | ORM | Typed database mapping with `Mapped` and `mapped_column` |
| **Pydantic v2** | Data Validation | Request parsing, strict type checking, and response serialization |
| **PostgreSQL 14+** | Primary Database | ACID-compliant relational database |
| **Psycopg 3** | DB Driver | High-efficiency modern PostgreSQL adapter |
| **SQLite3** | Local Fallback | Automatic fallback when PostgreSQL is not configured |
| **Passlib & Bcrypt** | Security | Cryptographic one-way password hashing |
| **PyJWT** | Authentication | JSON Web Token encoding, decoding, and verification |
| **Pytest & HTTPX** | Testing | Automated unit and integration test runner |
| **Uvicorn** | ASGI Server | Lightning-fast ASGI production web server |

### Frontend
| Technology | Role | Description |
| :--- | :--- | :--- |
| **React 18** | UI Library | Component-driven declarative user interfaces |
| **Vite 5** | Build Tool | Instant HMR development server and fast production bundler |
| **React Router v6** | Routing | Client-side routing with nested routes and protected auth gates |
| **Axios** | HTTP Client | Centralized API client with JWT request/response interceptors |
| **Lucide React** | Iconography | Crisp, lightweight, modern SVG icons |
| **CSS Variables** | Styling | Custom responsive design system (Red `#EF233C`, Soft Pink `#FFF1F3`, White `#FFFFFF`) |

---

## 4. Frontend Architecture

The frontend follows a clean, decoupled architecture:

```text
frontend/src/
├── components/          # Reusable UI components
│   ├── admin/           # Admin header, sidebar, modals, metrics
│   ├── auth/            # ProtectedRoute, SellerRoute, role guards
│   ├── cart/            # CartItem, order summary cards
│   ├── common/          # Navbar, Footer, LoadingSpinner
│   └── products/        # ProductCard, ProductGrid, search filters
├── contexts/            # Central reactive state providers
│   ├── AuthContext.jsx  # User session, JWT tokens, login/logout/register
│   ├── CartContext.jsx  # Shopping cart items, counts, discount codes
│   ├── NotificationContext.jsx # Toast notification alert system
│   └── StoreContext.jsx # Catalog, real-time stock sync, broadcast channel
├── layouts/             # Page layout templates
│   ├── AdminLayout.jsx  # Super Admin layout with sticky header & drawer
│   ├── MainLayout.jsx   # Public storefront layout with Navbar & Footer
│   └── SellerLayout.jsx # Merchant console layout with store switcher
├── pages/               # Routed view pages
│   ├── admin/sections/  # Overview, Products, Categories, Orders, Sellers
│   ├── seller/          # Merchant products, pricing, orders, inventory
│   ├── CartPage.jsx     # Cart review and coupon input
│   ├── CheckoutPage.jsx # Multi-step delivery address & payment
│   ├── HomePage.jsx     # Hero banner, deals, category grid
│   ├── LoginPage.jsx    # Secure customer/seller/admin authentication
│   ├── OrdersPage.jsx   # Order history receipts & shipment tracking
│   ├── ProductDetailPage.jsx # Product specifications & reviews
│   └── RegisterPage.jsx # Customer & seller merchant onboarding
└── services/
    ├── api.js           # Central Axios instance with JWT interceptors
    └── orderService.js  # Dedicated API handlers
```

### State Synchronization Flow
1. **JWT Interceptor**: `api.js` automatically attaches `Authorization: Bearer <token>` to all outgoing requests.
2. **Unified Role Redirection**: When users log in, `LoginPage.jsx` inspects their assigned role:
   - `ADMIN` $\rightarrow$ Redirects to `/admin`
   - `SELLER` $\rightarrow$ Redirects to `/seller`
   - `CUSTOMER` $\rightarrow$ Redirects to `/` or their requested checkout URL.
3. **Optimistic UI with Backend Fallback**: Actions like stock increments or item additions update the local interface instantly and synchronize with backend endpoints via `StoreContext.jsx`.

---

## 5. Backend Architecture

The backend implements a classic **Service-Layer Architecture (Separation of Concerns)**:

```text
┌────────────────────────────────────────────────────────┐
│                   HTTP Request                         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               FastAPI Routers (Routes)                 │
│  - Path definitions & HTTP verbs                       │
│  - Parameter parsing & dependency injection            │
│  - Pydantic schema validation (Request/Response)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Service Layer (Logic)                  │
│  - Core business logic & rule enforcement              │
│  - Authorization & tenant checks                       │
│  - Calculations (taxes, discounts, totals)             │
│  - Stock locking: db.query(Product).with_for_update()  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              SQLAlchemy 2.0 ORM (Models)               │
│  - Declarative Base typed models                       │
│  - Table constraints, indexes, foreign keys, cascades  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Relational Database Engine                 │
│           PostgreSQL (or SQLite fallback)              │
└────────────────────────────────────────────────────────┘
```

### Security & Token Lifecycle
1. **Password Hashing**: Bcrypt with auto-salted rounds.
2. **Access Token**: Short-lived JWT containing `sub` (User ID), `role`, and expiration timestamp.
3. **Refresh Token**: Long-lived JWT stored securely to issue new access tokens via `POST /api/v1/auth/refresh` without requiring the user to re-enter credentials.
4. **Token Blacklist**: Logout requests invalidate tokens by recording their unique signatures in the `blacklisted_tokens` database table.

---

## 6. Database Schema & ER Diagram

CloudCart models an e-commerce ecosystem with 11 relational tables.

### Mermaid Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places"
    USERS ||--o| CARTS : "owns"
    USERS ||--o{ ADDRESSES : "has"
    USERS ||--o{ PAYMENTS : "makes"
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ WISHLISTS : "saves"

    CATEGORIES ||--o{ PRODUCTS : "categorizes"

    PRODUCTS ||--o{ CART_ITEMS : "added_to"
    PRODUCTS ||--o{ ORDER_ITEMS : "purchased_as"
    PRODUCTS ||--o{ REVIEWS : "receives"
    PRODUCTS ||--o{ WISHLISTS : "listed_in"

    CARTS ||--o{ CART_ITEMS : "contains"
    ORDERS ||--|{ ORDER_ITEMS : "consists_of"
    ORDERS ||--o{ PAYMENTS : "billed_by"
    ADDRESSES ||--o{ ORDERS : "delivers_to"

    USERS {
        int id PK
        string email UK
        string username UK
        string full_name
        string store_name
        string phone
        string hashed_password
        string role
        boolean is_active
        boolean is_admin
        datetime created_at
    }

    CATEGORIES {
        int id PK
        string name UK
        string slug UK
        string description
        string image_url
        boolean is_active
    }

    PRODUCTS {
        int id PK
        int category_id FK
        string name
        string slug UK
        text description
        numeric price
        numeric original_price
        string brand
        int stock
        string image_url
        boolean is_active
        boolean is_featured
        numeric rating
    }

    CARTS {
        int id PK
        int user_id FK,UK
        datetime updated_at
    }

    CART_ITEMS {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity
    }

    ORDERS {
        int id PK
        string order_number UK
        int user_id FK
        numeric total_amount
        numeric subtotal_amount
        numeric tax_amount
        numeric shipping_amount
        string status
        int shipping_address_id FK
        text shipping_address_text
        string tracking_number
        datetime created_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        string product_name
        int quantity
        numeric unit_price
        numeric subtotal
    }

    PAYMENTS {
        int id PK
        int order_id FK
        int user_id FK
        string payment_method
        string transaction_id UK
        numeric amount
        string currency
        string status
        string payment_gateway
        datetime created_at
    }

    ADDRESSES {
        int id PK
        int user_id FK
        string full_name
        string phone
        string address_line1
        string city
        string state
        string postal_code
        string country
        boolean is_default_shipping
    }

    WISHLISTS {
        int id PK
        int user_id FK
        int product_id FK
        datetime created_at
    }

    REVIEWS {
        int id PK
        int product_id FK
        int user_id FK
        numeric rating
        string title
        text comment
        datetime created_at
    }
```

### Database Cascade & Constraint Rules
- **Category Deletion**: Set to `RESTRICT`. Deleting a category that currently holds products is rejected with `HTTP 400` to prevent accidental orphaned products.
- **Order Deletion**: An order's items (`ORDER_ITEMS`) are preserved to maintain financial ledger history.
- **Cart Uniqueness**: `CART_ITEMS` enforces a unique constraint `uq_cart_product` across `(cart_id, product_id)`. Adding an existing product simply increments its quantity rather than creating duplicate rows.

---

## 7. Project Folder Structure

```text
cloudcart/
├── README.md                    # Complete project documentation
├── package.json                 # Root script runner
├── requirements.txt             # Root requirements reference
├── .env.example                 # Root environment template
├── .gitignore                   # Global gitignore
│
├── backend/                     # FastAPI Application Root
│   ├── .env                     # Local backend environment file
│   ├── .env.example             # Backend environment template
│   ├── requirements.txt         # Python dependencies
│   ├── uploads/                 # Local image uploads directory (no AWS)
│   │   └── products/            # Uploaded product image files
│   ├── tests/                   # Pytest automated test suites
│   │   ├── test_auth.py         # Authentication & password policy tests
│   │   ├── test_auth_full.py    # RBAC, duplicates & token invalidation
│   │   ├── test_products_categories.py # Catalog CRUD & stock limit tests
│   │   ├── test_cart_orders.py  # Pessimistic locking & order checkout
│   │   └── test_payments_and_webhooks.py # Webhooks, HMAC & refund rollback
│   └── app/
│       ├── main.py              # Application entry, CORS & lifespan startup
│       ├── core/
│       │   ├── config.py        # Pydantic BaseSettings & env parsing
│       │   └── security.py      # Bcrypt hashing & JWT token generators
│       ├── db/
│       │   ├── base.py          # SQLAlchemy 2.0 Base metadata
│       │   ├── session.py       # Engine & get_db session generator
│       │   └── init_db.py       # DB auto-initialization & seed data
│       ├── models/              # SQLAlchemy 2.0 typed models
│       ├── schemas/             # Pydantic v2 validation schemas
│       ├── services/            # Business logic layer
│       └── routes/              # FastAPI API v1 routers
│           ├── deps.py          # Dependency injection (Auth & DB session)
│           ├── api.py           # Master router aggregator
│           ├── auth.py          # /api/v1/auth
│           ├── users.py         # /api/v1/users
│           ├── categories.py    # /api/v1/categories
│           ├── products.py      # /api/v1/products
│           ├── cart.py          # /api/v1/cart
│           ├── orders.py        # /api/v1/orders
│           ├── payments.py      # /api/v1/payments
│           ├── addresses.py     # /api/v1/addresses
│           ├── wishlist.py      # /api/v1/wishlist
│           └── reviews.py       # /api/v1/reviews
│
└── frontend/                    # React + Vite Application Root
    ├── .env                     # Local frontend environment file
    ├── .env.example             # Frontend environment template
    ├── package.json             # Frontend dependencies & scripts
    ├── vite.config.js           # Vite server config & dev proxy rules
    ├── index.html               # Single Page Application HTML root
    └── src/
        ├── main.jsx             # React DOM root entry
        ├── App.jsx              # Routes configuration & auth guards
        ├── index.css            # Storefront design system styles
        ├── admin.css            # Enterprise admin console styles
        ├── seller.css           # Merchant console & responsive drawer
        ├── components/          # Reusable React components
        ├── contexts/            # Context state providers (Auth, Cart, Store)
        ├── layouts/             # MainLayout, AdminLayout, SellerLayout
        ├── pages/               # Application view pages
        └── services/            # Axios API client & endpoints
```

---

## 8. Prerequisites & Installation

### Required Software
Make sure you have the following installed on your machine:
- **Python**: Version `3.10` or higher (`3.12` recommended)
- **Node.js**: Version `18.x` or higher (`20.x` LTS recommended)
- **npm**: Version `9.x` or higher
- **PostgreSQL**: Version `14` or higher *(Optional: SQLite fallback is built-in)*

---

## 9. PostgreSQL Configuration

CloudCart connects to PostgreSQL via SQLAlchemy and Psycopg 3.

### Local PostgreSQL Setup

1. Open your terminal or `psql` command prompt:
   ```bash
   # Log in to PostgreSQL CLI
   sudo -u postgres psql
   ```

2. Create the CloudCart database:
   ```sql
   CREATE DATABASE cloudcart_db;
   ```

3. Create a dedicated database user (optional, or use your default `postgres` user):
   ```sql
   CREATE USER cloudcart_user WITH PASSWORD 'cloudcart_password';
   GRANT ALL PRIVILEGES ON DATABASE cloudcart_db TO cloudcart_user;
   ALTER DATABASE cloudcart_db OWNER TO cloudcart_user;
   ```

4. Exit `psql`:
   ```sql
   \q
   ```

> 💡 **Automatic SQLite Fallback**:
> If PostgreSQL is not running when the backend starts, CloudCart automatically detects it and initializes a local SQLite file (`cloudcart.db`) in the project root. This ensures you can develop and test immediately without configuring a database server.

---

## 10. Environment Variable Configuration

Both the backend and frontend include template configuration files.

### Backend Configuration (`backend/.env`)

Copy the template file:
```bash
cp backend/.env.example backend/.env
```

Review or edit `backend/.env`:
```env
PROJECT_NAME="CloudCart API"
API_V1_STR="/api/v1"

# Generate a strong 32-byte secret: openssl rand -hex 32
SECRET_KEY="cloudcart-super-secret-jwt-key-change-in-production-use-openssl-rand-hex-32"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# PostgreSQL Connection String (Format: postgresql+psycopg://user:password@host:port/dbname)
DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/cloudcart_db"

# Local Image Uploads Directory (Stored on local disk, zero AWS S3)
UPLOAD_DIR="./uploads"

# Allowed CORS Origins
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:5174","http://127.0.0.1:5174"]

# Optional Stripe Test Configuration
STRIPE_SECRET_KEY="sk_test_placeholder_key"
STRIPE_WEBHOOK_SECRET="whsec_placeholder_key"
```

### Frontend Configuration (`frontend/.env`)

Copy the template file:
```bash
cp frontend/.env.example frontend/.env
```

Review or edit `frontend/.env`:
```env
# URL where your FastAPI backend is running
VITE_API_BASE_URL="http://localhost:8000/api/v1"
```

---

## 11. Backend Startup Guide

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate

   # Windows (Command Prompt)
   python -m venv venv
   .\venv\Scripts\activate

   # Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Confirm startup in your console:
   ```text
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Database schema verified and initial catalog data ready.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
   ```

---

## 12. Frontend Startup Guide

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```text
   http://localhost:5173/
   ```

---

## 13. Interactive API Documentation (Swagger / ReDoc)

FastAPI automatically generates interactive, live API documentation from the code:

- **Swagger UI (Interactive API Explorer)**:
  👉 [http://localhost:8000/docs](http://localhost:8000/docs)
  - Allows executing live API calls directly from your browser.
  - Click the **Authorize** button at the top right, select `OAuth2PasswordBearer`, and enter:
    - **Username**: `admin@cloudcart.com`
    - **Password**: `Admin123!`
  - Once authorized, all protected endpoints (`/products/`, `/orders/admin/all`, `/payments/`) can be tested interactively.

- **ReDoc (Technical API Reference)**:
  👉 [http://localhost:8000/redoc](http://localhost:8000/redoc)
  - Clean, documentation-first format ideal for reading schemas, parameters, and return models.

- **Application Health Check**:
  👉 [http://localhost:8000/health](http://localhost:8000/health)
  - Returns `{"status": "healthy", "service": "CloudCart API"}`.

---

## 14. Complete API Endpoints Reference

All endpoints are versioned under the `/api/v1` prefix.

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new account (`CUSTOMER` or `SELLER`) |
| `POST` | `/api/v1/auth/login` | Public | JSON login; returns JWT access & refresh tokens |
| `POST` | `/api/v1/auth/login-form` | Public | OAuth2 form login for Swagger UI authorization |
| `POST` | `/api/v1/auth/refresh` | Public | Exchange valid refresh token for a new access token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidate token and end user session |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve profile details of currently logged-in user |

### 👤 User Management (`/api/v1/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/profile` | Authenticated | Get current authenticated user profile |
| `PUT` | `/api/v1/users/profile` | Authenticated | Update user name, phone, or avatar |
| `GET` | `/api/v1/users/` | Super Admin | List all registered user accounts with pagination |
| `PUT` | `/api/v1/users/{user_id}` | Super Admin | Update a user's role, status, or details |
| `DELETE` | `/api/v1/users/{user_id}` | Super Admin | Delete a user account |

### 📁 Category Management (`/api/v1/categories`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories/` | Public | List all active product categories |
| `GET` | `/api/v1/categories/{category_id}` | Public | Get single category by ID |
| `POST` | `/api/v1/categories/` | Admin | Create a new product category |
| `PUT` | `/api/v1/categories/{category_id}` | Admin | Update category name, slug, or banner |
| `DELETE` | `/api/v1/categories/{category_id}` | Admin | Delete category (blocked if category contains products) |

### 📦 Product Catalog (`/api/v1/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products/` | Public | List products with pagination, search, category filter, and sort |
| `GET` | `/api/v1/products/slug/{slug}` | Public | Retrieve product by SEO-friendly slug |
| `GET` | `/api/v1/products/{product_id}` | Public | Retrieve product by ID |
| `POST` | `/api/v1/products/` | Admin / Seller | Create a new hardware product |
| `PUT` | `/api/v1/products/{product_id}` | Admin / Seller | Update product details, price, or description |
| `PATCH` | `/api/v1/products/{product_id}/stock` | Admin / Seller | Adjust stock quantity or apply delta (`+`/`-`) |
| `POST` | `/api/v1/products/{product_id}/image` | Admin / Seller | Upload product image to dedicated local uploads folder |
| `POST` | `/api/v1/products/upload-image` | Admin / Seller | Standalone image upload for new product drafts |
| `DELETE` | `/api/v1/products/{product_id}` | Admin / Seller | Delete product from catalog |

### 🛒 Shopping Cart (`/api/v1/cart`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cart/` | Authenticated | Retrieve active shopping cart, items, and calculated totals |
| `POST` | `/api/v1/cart/items` | Authenticated | Add a product to the cart with inventory validation |
| `PUT` | `/api/v1/cart/items/{item_id}` | Authenticated | Update item quantity in cart |
| `DELETE` | `/api/v1/cart/items/{item_id}` | Authenticated | Remove an individual item from cart |
| `DELETE` | `/api/v1/cart/clear` | Authenticated | Remove all items and empty the cart |

### 📋 Orders & Fulfillment (`/api/v1/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders/` | Authenticated | Checkout cart items into order with atomic stock reduction |
| `GET` | `/api/v1/orders/` | Authenticated | Retrieve customer's past order history |
| `GET` | `/api/v1/orders/{order_id}` | Authenticated | Get detailed order invoice receipt and status |
| `GET` | `/api/v1/orders/admin/all` | Super Admin | Master list of all platform customer orders |
| `PUT` | `/api/v1/orders/{order_id}/status` | Admin / Seller | Update order status (`PENDING`, `PROCESSING`, `SHIPPED`, etc.) |
| `PATCH` | `/api/v1/orders/{order_id}/tracking` | Admin / Seller | Add or update carrier shipment tracking number |

### 💳 Payments & Webhooks (`/api/v1/payments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/process` | Authenticated | Process order payment (Card, PayPal, Apple Pay, COD) |
| `POST` | `/api/v1/payments/webhook` | Public / Gateway | Webhook event receiver with idempotency & stock rollback |
| `GET` | `/api/v1/payments/order/{order_id}` | Authenticated | Get all payment transaction logs for an order |
| `GET` | `/api/v1/payments/admin/all` | Super Admin | Audit platform payment transactions |

### 📍 Addresses (`/api/v1/addresses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/addresses/` | Authenticated | List all saved addresses for current user |
| `POST` | `/api/v1/addresses/` | Authenticated | Create a new shipping/billing address |
| `PUT` | `/api/v1/addresses/{address_id}` | Authenticated | Update address or toggle as default |
| `DELETE` | `/api/v1/addresses/{address_id}` | Authenticated | Remove saved address |

### ❤️ Wishlist (`/api/v1/wishlist`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/wishlist/` | Authenticated | Get all bookmarked wishlist items |
| `POST` | `/api/v1/wishlist/` | Authenticated | Add product to user's wishlist |
| `DELETE` | `/api/v1/wishlist/{product_id}` | Authenticated | Remove product from wishlist |

### ⭐ Reviews (`/api/v1/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reviews/product/{product_id}` | Public | List reviews and star ratings for a product |
| `POST` | `/api/v1/reviews/` | Authenticated | Submit a verified product review |
| `DELETE` | `/api/v1/reviews/{review_id}` | Admin / Author | Remove a review |

---

## 15. Automated Testing Guide

CloudCart features a comprehensive automated test suite built with `pytest` covering authentication, catalog CRUD, shopping cart mechanics, pessimistic stock row-locking, and payment webhook idempotency.

### Running Backend Tests

1. Activate your virtual environment:
   ```bash
   cd backend
   source venv/bin/activate
   ```

2. Run the complete test suite:
   ```bash
   PYTHONPATH=. ./venv/bin/pytest tests/ -v
   ```

3. Expected Output:
   ```text
   ============================= test session starts ==============================
   platform linux -- Python 3.12.3, pytest-7.4.4, pluggy-1.4.0
   rootdir: /home/tanmay/Desktop/cloudcart/backend
   collected 37 items

   tests/test_auth.py ........                                              [ 21%]
   tests/test_auth_full.py ..........                                       [ 48%]
   tests/test_cart_orders.py ....                                           [ 59%]
   tests/test_payments_and_webhooks.py .........                            [ 83%]
   tests/test_products_categories.py ......                                 [100%]

   ============================== 37 passed in 12.34s =============================
   ```

### Running Individual Test Suites
```bash
# Run only authentication security tests
PYTHONPATH=. ./venv/bin/pytest tests/test_auth.py -v

# Run inventory locking and order checkout tests
PYTHONPATH=. ./venv/bin/pytest tests/test_cart_orders.py -v

# Run payment webhook and refund stock-restoration tests
PYTHONPATH=. ./venv/bin/pytest tests/test_payments_and_webhooks.py -v
```

### Testing the Frontend Build
```bash
cd frontend
npm run build
```
Confirms all JSX components, CSS bundles, and assets compile cleanly with zero errors.

---

## 16. Stripe Test-Mode & Payment Simulation

CloudCart supports both a **Simulated Local Payment Gateway** and **Stripe Test Mode** for processing checkouts without real credit cards.

### 1. Simulated Local Gateway (Default & Zero-Config)
By default, CloudCart runs with a built-in payment processor that simulates gateway authorizations instantly without needing external internet access or a Stripe account:
- **Card**: Use any 16-digit card number (e.g., `4242 4242 4242 4242`), any future expiration date (e.g., `12/28`), and any 3-digit CVC (`123`).
- **PayPal**: Select PayPal in the checkout screen to trigger simulated PayPal Express approval.
- **Cash on Delivery (COD)**: Instantly marks the order as `PENDING` payment on delivery.

### 2. Stripe Test-Mode Setup (Optional)
If you wish to test with Stripe's real test-mode API:

1. Obtain your test API keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys):
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

2. Update your `backend/.env` file:
   ```env
   STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
   STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
   ```

3. Forward webhooks to your local server using the official [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   # Log in to your Stripe account
   stripe login

   # Forward incoming webhook events to your local CloudCart backend
   stripe listen --forward-to localhost:8000/api/v1/payments/webhook
   ```

4. Trigger test events via Stripe CLI:
   ```bash
   # Trigger a successful payment event
   stripe trigger payment_intent.succeeded

   # Trigger a payment refund event (automatically restores stock in CloudCart!)
   stripe trigger charge.refunded
   ```

### 3. Webhook Idempotency & Stock Rollback
- Every webhook event is registered by its unique `event_id`. Duplicate events sent to `/api/v1/payments/webhook` return an immediate `idempotent: true` acknowledgement without duplicate processing.
- When a `payment.refunded` event arrives, CloudCart automatically reads the items from the referenced order and adds their purchased quantities back to the product stock tables.

---

## 17. Troubleshooting Guide

### 1. "could not connect to server: Connection refused" (PostgreSQL)
- **Cause**: PostgreSQL service is stopped or running on a different port.
- **Solution**:
  - Verify PostgreSQL status:
    ```bash
    sudo systemctl status postgresql
    ```
  - Start PostgreSQL:
    ```bash
    sudo systemctl start postgresql
    ```
  - If you do not want to run PostgreSQL, CloudCart automatically falls back to local SQLite (`cloudcart.db`) upon launch.

### 2. "Port 8000 already in use"
- **Cause**: Another service or previous Uvicorn instance is using port 8000.
- **Solution**:
  - Run Uvicorn on an alternate port:
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
    ```
  - Update `frontend/.env`:
    ```env
    VITE_API_BASE_URL="http://localhost:8001/api/v1"
    ```

### 3. "CORS error: No 'Access-Control-Allow-Origin' header"
- **Cause**: Frontend is running on an origin not listed in `backend/.env`.
- **Solution**:
  - Check the port shown in your terminal when running `npm run dev` (e.g., `http://localhost:5174`).
  - Add the URL to `BACKEND_CORS_ORIGINS` in `backend/.env`:
    ```env
    BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:5174"]
    ```
  - Restart the Uvicorn server.

### 4. "401 Unauthorized" when calling APIs
- **Cause**: JWT token has expired or no `Authorization: Bearer <token>` header was provided.
- **Solution**:
  - Call `POST /api/v1/auth/login` to obtain a fresh token.
  - Or in the browser storefront, sign in via the `/login` page.

### 5. Product Image Upload Errors
- **Cause**: Missing write permissions on `backend/uploads/` directory.
- **Solution**:
  - CloudCart automatically creates `backend/uploads/products/` on startup. Ensure your user has write access:
    ```bash
    mkdir -p backend/uploads/products
    chmod -R 755 backend/uploads
    ```

---

## 18. Pre-Seeded Demo Accounts

When the backend runs for the first time, it seeds the database with demo accounts ready for testing across all three user roles:

| Role | Email Address | Password | Permissions & URL |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@cloudcart.com` | `Admin123!` | Complete administrative control, catalog CRUD, multi-vendor management at `/admin` |
| **Merchant Seller** | `seller@cloudcart.com` | `Seller123!` | Dedicated merchant console, personal inventory, and fulfillment tracking at `/seller` |
| **Customer** | `demo@cloudcart.com` | `Demo123!` | Consumer storefront, wishlist, shopping cart, and order history at `/` |
| **Customer (Alternate)** | `tanmay@cloudcart.com` | `CloudCart2026!` | Standard customer account with pre-seeded order history and saved delivery addresses |

---

## 📄 License & Attribution

This project is built and maintained for educational, developer demonstration, and full-stack engineering portfolio purposes. All product hardware specifications and images are utilized for non-commercial local development testing.
