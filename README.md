# CloudCart 🛒 — Enterprise Multi-Vendor E-Commerce Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white)](https://postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)

**CloudCart** is a production-grade, full-stack multi-vendor e-commerce platform built with a high-throughput **FastAPI** backend, **PostgreSQL 16** relational database, and a responsive **React 18 + TypeScript + Vite** frontend styled with TailwindCSS and the **ElectroMart** signature design system (`#EF233C` Crimson Red and Dark Slate).

The platform provides a complete e-commerce lifecycle across three isolated user experiences:
1. **Customer Storefront**: Product discovery, real-time search, category browsing, cart synchronization, wishlist, and an ACID-transactional checkout pipeline.
2. **Merchant Seller Console**: Private dashboard for registered sellers with tenant isolation, multi-image product management, stock controls, and order dispatch tracking.
3. **Administrator Governance Control Center**: Platform GMV telemetry, 8.5% commission take-rate analytics, multi-vendor store moderation (block, unblock, activate, deactivate, or delete accounts), master product catalog control, and department taxonomy management.

---

## Table of Contents

- [1. Project Overview & Architecture](#1-project-overview--architecture)
- [2. Key Features by Role](#2-key-features-by-role)
  - [Customer Experience](#customer-storefront)
  - [Merchant Seller Console](#merchant-seller-console)
  - [Super Administrator Governance](#super-administrator-governance)
- [3. Technology Stack](#3-technology-stack)
- [4. Project Structure](#4-project-structure)
- [5. Database Schema & Architecture](#5-database-schema--architecture)
- [6. Prerequisites & Environment Setup](#6-prerequisites--environment-setup)
- [7. PostgreSQL & pgAdmin Configuration](#7-postgresql--pgadmin-configuration)
- [8. Backend Installation & Execution](#8-backend-installation--execution)
- [9. Frontend Installation & Execution](#9-frontend-installation--execution)
- [10. Pre-Configured Demo Accounts](#10-pre-configured-demo-accounts)
- [11. Complete REST API Reference](#11-complete-rest-api-reference)
- [12. Checkout & ACID Transaction Workflow](#12-checkout--acid-transaction-workflow)
- [13. Testing & Verification](#13-testing--verification)
- [14. Troubleshooting & FAQs](#14-troubleshooting--faqs)

---

## 1. Project Overview & Architecture

CloudCart is architected as a clean two-tier client-server application:

```mermaid
flowchart TD
    Client["React 18 + TypeScript Frontend\n(Vite 5 / TailwindCSS / Port 5174)"]
    API["FastAPI REST Backend\n(Python 3.12 / Uvicorn / Port 8001)"]
    DB[("PostgreSQL 16 Relational DB\n(cloudcart_db / Port 5432)")]
    Uploads["Local Static File Storage\n(/uploads/products & /uploads/categories)"]

    Client -->|"JWT Authenticated Requests (Axios)"| API
    API -->|"SQLAlchemy 2.0 ORM + Psycopg 3"| DB
    API -->|"Multi-Image & Cover Uploads"| Uploads
    Client -->|"Static Media Fetch"| Uploads
```

### Architectural Principles
- **Clean 2-Folder Monorepo**: Exactly two root directories (`backend/` and `frontend/`) with zero clutter or external third-party cloud lock-in (no AWS S3 or Firebase dependencies).
- **Zero-Trust Client Pricing**: The frontend never dictates unit prices, line subtotals, tax rates, or order totals. All calculations are executed authoritatively by the backend.
- **ACID Transaction Order Fulfillment**: Checkout utilizes pessimistic database locking (`with_for_update()`) on product stock rows to guarantee stock availability and prevent overselling during high-concurrency checkouts.
- **Strict Role-Based Access Control (RBAC)**: Distinct authorization gates for `CUSTOMER`, `SELLER` / `MERCHANT`, and `ADMIN` users via cryptographic JWT Bearer tokens.
- **Tenant Isolation**: Merchant sellers can only access and modify their own catalog products, inventory levels, and customer orders containing their items.

---

## 2. Key Features by Role

### Customer Storefront
- **Instant Product Discovery**: Live keyword search, dynamic category filtering, price range sliders, and multi-parameter sorting (Newest, Price: Low to High, Price: High to Low, Customer Rating).
- **Interactive Product Details**: Multi-angle image viewing gallery, stock availability badges, discount tags, star rating breakdowns, customer reviews, and responsive specification cards.
- **Persistent Shopping Cart**: Real-time quantity adjustments, promotional coupon codes (`SAVE10`, `CLOUDCART20`, `WELCOME15`), automatic tax calculation (8.5%), and free shipping thresholds.
- **Streamlined Checkout**: Validated delivery address forms, payment simulation (Credit/Debit Card via 256-bit simulated gateway, PayPal Express, and Cash on Delivery), and instant order placement.
- **Customer Account & Tracking**: Profile management, personal order history with fulfillment progress (`CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`), and interactive carrier tracking numbers.
- **Customer Wishlist**: Heart-toggle saved items persistence directly linked with PostgreSQL.

### Merchant Seller Console
- **Dedicated Storefront Dashboard**: Personal business dashboard displaying Store Revenue, Active Customer Orders, Total Catalog SKUs, and Store Review Ratings.
- **Isolated Product Management**: Create, edit, pause/unpause, and delete products belonging strictly to the merchant store.
- **Multi-Image Product Uploads**: Dedicated file uploader supporting simultaneous batch uploads of product photos with primary thumbnail selection.
- **Live Inventory Tracking**: Inventory alerts, out-of-stock highlights, and 1-click quick-restock actions (`+10`, `+25`, `+50` units).
- **Merchant Order Fulfillment**: Inspect orders placed by platform customers for the seller's products, update dispatch fulfillment states, and attach shipping tracking codes.

### Super Administrator Governance
- **Executive Telemetry & KPI Analytics**: Live counters for Total Customers, Active Sellers, Blocked Sellers, Deactivated Sellers, Gross Merchandise Value (GMV), Platform Commission Take-Rate (8.5%), and Average Order Value (AOV).
- **User & Merchant Governance**: Master user management table with search and status filters (`ALL`, `ACTIVE`, `BLOCKED`, `DEACTIVATED`). Administrators can:
  - View comprehensive seller profile dossiers and financial metrics.
  - Inspect seller catalog products with instant in-modal restock and pause controls.
  - Review customer shopping activity telemetry (order history, lifetime spend, addresses, cart items).
  - One-click Block/Unblock, Activate/Deactivate, or permanently Delete accounts (with safe foreign-key handling).
- **Master Catalog Administration**: Full platform catalog oversight to edit, restock, pause, or remove products across all vendors.
- **Department & Category Taxonomy**: Manage e-commerce departments, edit department names, upload cover images, and safely delete categories with linked product guards.
- **Exportable Business Reports**: 1-click CSV data export for platform sales reports and warehouse inventory stock levels.

---

## 3. Technology Stack

### Backend Stack
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Python** | `3.12+` | Core programming language |
| **FastAPI** | `0.110+` | High-performance asynchronous web framework |
| **Uvicorn** | `0.28+` | Lightning-fast ASGI production server |
| **SQLAlchemy** | `2.0+` | Modern typed Object-Relational Mapper (ORM) |
| **Psycopg 3** | `3.1+` | PostgreSQL database adapter for Python |
| **Pydantic** | `v2.6+` | Data validation, parsing, and response schemas |
| **Bcrypt & Passlib**| `4.0+` | Cryptographic password hashing (work-factor 12) |
| **PyJWT** | `2.8+` | Cryptographically signed HMAC-SHA256 JWT tokens |
| **Python-Multipart**| `0.0.9+` | Multi-file and image upload stream parser |

### Frontend Stack
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `18.3` | Declarative UI component library |
| **TypeScript** | `5.4` | Strict static typing across entire client |
| **Vite** | `5.4` | Next-generation frontend build tool and dev server |
| **TailwindCSS** | `3.4` | Utility-first responsive styling framework |
| **React Router** | `v6.23` | Client-side routing with nested layouts and auth guards |
| **Lucide React** | `0.378` | Modern iconography system |
| **Axios** | `1.6` | HTTP client with automatic JWT bearer interceptors |
| **Zod** | `3.23` | Client-side form validation schemas |

---

## 4. Project Structure

CloudCart follows a clean, standardized monorepo structure:

```
cloudcart/
├── README.md                          # Master documentation (this file)
├── backend/                           # FastAPI Python Backend
│   ├── alembic/                       # Database migration configuration
│   ├── alembic.ini                    # Alembic settings
│   ├── app/
│   │   ├── core/                      # Global configuration, security & JWT
│   │   │   ├── config.py              # Environment settings & Pydantic settings
│   │   │   └── security.py            # Bcrypt hashing & JWT token generators
│   │   ├── db/                        # Database connectivity & seed scripts
│   │   │   ├── base.py                # Declarative Base metadata
│   │   │   ├── init_db.py             # Automatic table initialization
│   │   │   └── session.py             # SQLAlchemy engine & session factory
│   │   ├── models/                    # SQLAlchemy 2.0 ORM database entities
│   │   │   ├── address.py             # Addresses entity
│   │   │   ├── cart.py                # Cart & CartItem entities
│   │   │   ├── category.py            # Categories entity
│   │   │   ├── order.py               # Order & OrderItem entities
│   │   │   ├── payment.py             # Payment ledger entity
│   │   │   ├── product.py             # Master Product catalog entity
│   │   │   ├── review.py              # Product reviews entity
│   │   │   ├── user.py                # User entity with roles & moderation
│   │   │   └── wishlist.py            # Wishlist entity
│   │   ├── routes/                    # FastAPI API route controllers
│   │   │   ├── addresses.py           # Customer address book
│   │   │   ├── api.py                 # Aggregated v1 API router
│   │   │   ├── auth.py                # Login, registration, token refresh
│   │   │   ├── cart.py                # Shopping cart endpoints
│   │   │   ├── categories.py          # Category management & cover uploads
│   │   │   ├── deps.py                # OAuth2 & RBAC dependencies
│   │   │   ├── orders.py              # Checkout, tracking, status updates
│   │   │   ├── payments.py            # Payment transactions
│   │   │   ├── products.py            # Product search, CRUD, multi-image upload
│   │   │   ├── reviews.py             # Product rating & customer reviews
│   │   │   ├── users.py               # User profile & Admin Governance
│   │   │   └── wishlist.py            # Customer wishlist
│   │   ├── schemas/                   # Pydantic validation & response models
│   │   ├── services/                  # ACID transactional business logic services
│   │   │   ├── auth_service.py        # Authentication & registration logic
│   │   │   ├── cart_service.py        # Cart manipulation & totals calculation
│   │   │   ├── order_service.py       # ACID order placement & stock reduction
│   │   │   ├── product_service.py     # Product CRUD & image handling
│   │   │   └── user_service.py        # User profile & cascade deletion logic
│   │   ├── utils/                     # Logging & custom exception handlers
│   │   └── main.py                    # Application entrypoint & CORS middleware
│   ├── uploads/                       # Local file storage for images (No S3)
│   │   ├── categories/                # Uploaded department banner images
│   │   └── products/                  # Uploaded product catalog photos
│   ├── requirements.txt               # Backend Python dependencies
│   └── .env                           # Backend environment variables
│
└── frontend/                          # React + TypeScript + Vite Client
    ├── public/                        # Static assets & favicon
    ├── src/
    │   ├── api/                       # Centralized Axios API instances & service calls
    │   │   └── baseApi.ts             # Auth, Product, Cart, Order, User endpoints
    │   ├── components/                # Modular UI component library
    │   │   ├── charts/                # Responsive GMV & velocity charts
    │   │   ├── common/                # Header, Footer, Theme toggle, Notifications
    │   │   ├── toaster/               # Non-blocking animated toast alerts
    │   │   └── ui/                    # Button, Input, Modal, Card, Badge, Label
    │   ├── contexts/                  # React Context global state providers
    │   │   ├── AuthContext.tsx        # Authentication & user profile state
    │   │   ├── CartContext.tsx        # Shopping cart state & backend sync
    │   │   ├── StoreContext.tsx       # Catalog, categories, orders, & admin state
    │   │   └── ThemeContext.tsx       # Dark & Light mode toggle
    │   ├── layouts/                   # Layout wrappers with navigation bars
    │   │   ├── admin/                 # Admin Governance layout with sidebar
    │   │   ├── auth/                  # Authentication cards layout
    │   │   ├── customer/              # Customer storefront header & footer
    │   │   └── merchant/              # Merchant Seller Console layout
    │   ├── pages/                     # Routed page views
    │   │   ├── admin/                 # Overview, Users, Merchants, Catalog, Orders, Analytics
    │   │   ├── auth/                  # Customer, Merchant, Admin login & Registration
    │   │   ├── customer/              # Home, Shop, Product Detail, Cart, Checkout, Orders
    │   │   └── merchant/              # Seller Dashboard, Products, Inventory, Orders, Profile
    │   ├── routes/                    # Protected route guards & path definitions
    │   │   ├── Guards.tsx             # GuestRoute unauthenticated guard
    │   │   ├── Paths.ts               # Centralized route constants
    │   │   ├── ProtectedRoute.tsx     # Role-based protection guard
    │   │   └── Routes.tsx             # React Router configuration
    │   ├── types/                     # Shared TypeScript interfaces & types
    │   ├── validations/               # Zod client validation schemas
    │   ├── App.tsx                    # Top-level application root
    │   ├── index.css                  # Global TailwindCSS styles & variables
    │   └── main.tsx                   # Client entrypoint mounting to DOM
    ├── package.json                   # Frontend dependencies & scripts
    ├── tailwind.config.js             # Tailwind theme & color definitions
    ├── tsconfig.json                  # TypeScript compiler settings
    └── vite.config.ts                 # Vite bundler & proxy configuration
```

---

## 5. Database Schema & Architecture

CloudCart connects to **PostgreSQL 16** via connection pooling in SQLAlchemy. The relational schema is structured as follows:

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : "supplies (merchant)"
    USERS ||--o{ CARTS : "owns"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ ADDRESSES : "saves"
    USERS ||--o{ WISHLISTS : "saves"
    USERS ||--o{ REVIEWS : "writes"

    CATEGORIES ||--o{ PRODUCTS : "classifies"

    CARTS ||--o{ CART_ITEMS : "contains"
    PRODUCTS ||--o{ CART_ITEMS : "referenced_in"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "sold_in"
    ORDERS ||--o{ PAYMENTS : "billed_in"

    USERS {
        int id PK
        string email UK
        string username UK
        string full_name
        string store_name
        string hashed_password
        string role
        boolean is_active
        boolean is_blocked
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
        string name
        string slug UK
        decimal price
        decimal original_price
        int stock
        string image_url
        json gallery_images
        int category_id FK
        int merchant_id FK
        string store_name
        boolean is_active
        boolean is_featured
    }

    ORDERS {
        int id PK
        string order_number UK
        int user_id FK
        decimal total_amount
        decimal subtotal_amount
        decimal tax_amount
        decimal shipping_amount
        string status
        string shipping_address_text
        string tracking_number
        string payment_method
        datetime created_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        string product_name
        int quantity
        decimal unit_price
        decimal subtotal
    }
```

---

## 6. Prerequisites & Environment Setup

Ensure you have the following installed on your machine:
- **Python**: Version `3.10`, `3.11`, or `3.12+`
- **Node.js**: Version `18+` or `20+` LTS
- **pnpm**: Version `8+` or `9+` (or `npm`)
- **PostgreSQL**: Version `14`, `15`, or `16` running on port `5432`
- **pgAdmin 4**: (Optional, for visual database administration)

---

## 7. PostgreSQL & pgAdmin Configuration

CloudCart uses the standard PostgreSQL port `5432` with zero custom configuration files or containers required.

### 1. Database Creation
Connect to your local PostgreSQL instance using `psql` or **pgAdmin 4**:

```bash
# Connect as postgres superuser
psql -h 127.0.0.1 -p 5432 -U postgres
```

Inside the PostgreSQL prompt, create the database:
```sql
CREATE DATABASE cloudcart_db;
```

### 2. Connect via pgAdmin 4
1. Open **pgAdmin 4**.
2. Right-click **Servers** $\rightarrow$ **Register** $\rightarrow$ **Server...**
3. In the **General** tab:
   - **Name**: `CloudCart Local PostgreSQL`
4. In the **Connection** tab:
   - **Host name/address**: `127.0.0.1` (or `localhost`)
   - **Port**: `5432`
   - **Maintenance database**: `cloudcart_db`
   - **Username**: `postgres`
   - **Password**: `123456` (or your local postgres password)
5. Click **Save**. You can now inspect all tables, schemas, and live rows visually.

---

## 8. Backend Installation & Execution

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Create and activate a Python virtual environment
```bash
# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables (`backend/.env`)
Ensure `backend/.env` exists with the following configuration:

```env
PROJECT_NAME="CloudCart API"
API_V1_STR="/api/v1"
SECRET_KEY="cloudcart-super-secret-jwt-key-change-in-production-use-openssl-rand-hex-32"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# PostgreSQL Database Connection URL
DATABASE_URL="postgresql+psycopg://postgres:123456@127.0.0.1:5432/cloudcart_db"

# Allowed CORS Origins for Frontend Integration
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:5174","http://127.0.0.1:5174"]

# Dedicated Local Uploads Storage Directory
UPLOAD_DIR="./uploads"
```

### 5. Start the FastAPI Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
The backend initializes database tables automatically and seeds initial categories and default accounts.
- **API Base URL**: `http://localhost:8001/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8001/docs`
- **ReDoc Documentation**: `http://localhost:8001/redoc`

---

## 9. Frontend Installation & Execution

### 1. Navigate to the frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
pnpm install
# or: npm install
```

### 3. Configure Frontend Environment (`frontend/.env`)
Create or verify `frontend/.env`:

```env
VITE_API_URL="http://localhost:8001/api/v1"
```

### 4. Start the Vite Development Server
```bash
pnpm dev
# or: npm run dev
```
The frontend will start at:
- **Local Application URL**: `http://localhost:5174` (or `http://localhost:5173`)

### 5. Build for Production
```bash
pnpm run build
```
Creates an optimized, tree-shaken static production bundle in `frontend/dist/`.

---

## 10. Pre-Configured Demo Accounts

CloudCart includes pre-seeded accounts for testing all three roles out of the box:

| Role | Email Address | Password | Dedicated Access URL |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@cloudcart.com` | `Admin123!` | [http://localhost:5174/admin](http://localhost:5174/admin) |
| **Merchant Seller** | `seller@cloudcart.com` | `Seller123!` | [http://localhost:5174/merchant](http://localhost:5174/merchant) |
| **Verified Customer** | `demo@cloudcart.com` | `Demo123!` | [http://localhost:5174/login](http://localhost:5174/login) |

*You can also register brand-new Customer and Merchant accounts dynamically on the registration page.*

---

## 11. Complete REST API Reference

All API routes are prefixed with `/api/v1`.

### Authentication & Users
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new Customer or Merchant account |
| `POST` | `/auth/login` | Public | Authenticate with email and password to receive JWT tokens |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for a new access token |
| `POST` | `/auth/logout` | Authenticated | Logout user and invalidate session |
| `GET` | `/users/profile` | Authenticated | Retrieve current user profile details |
| `PUT` | `/users/profile` | Authenticated | Update user name, phone, bio, or store name |
| `GET` | `/users/` | **Admin Only** | List all registered platform users |
| `PUT` | `/users/{id}` | **Admin Only** | Moderate user (Block, Unblock, Activate, Deactivate) |
| `DELETE`| `/users/{id}` | **Admin Only** | Safely delete account (anonymizes if orders exist) |
| `GET` | `/users/{id}/activity`| **Admin Only** | Fetch complete user telemetry and order history |

### Product Catalog
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/products/` | Public | Browse and search products with pagination, category, & price filters |
| `GET` | `/products/{id}` | Public | Get product details by primary key ID |
| `GET` | `/products/slug/{slug}` | Public | Get product details by unique SEO URL slug |
| `POST` | `/products/` | **Merchant/Admin** | Create a new product listing |
| `PUT` | `/products/{id}` | **Merchant/Admin** | Update product attributes, price, and specs |
| `PATCH`| `/products/{id}/stock` | **Merchant/Admin** | Update or adjust warehouse stock quantity |
| `DELETE`| `/products/{id}` | **Merchant/Admin** | Delete product (soft-deactivates if orders exist) |
| `POST` | `/products/upload-image` | **Merchant/Admin** | Upload a single product image to local storage |
| `POST` | `/products/upload-multiple-images` | **Merchant/Admin** | Upload a batch of product gallery photos simultaneously |

### Categories & Departments
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories/` | Public | List all active product categories |
| `GET` | `/categories/{id}` | Public | Get category details and live product count |
| `POST` | `/categories/` | **Admin Only** | Create a new category department |
| `PUT` | `/categories/{id}` | **Admin Only** | Update category name, slug, or banner |
| `DELETE`| `/categories/{id}` | **Admin Only** | Delete category (blocked if active products exist) |
| `POST` | `/categories/upload-image` | **Admin Only** | Upload category cover banner image |

### Shopping Cart & Wishlist
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart/` | Authenticated | Retrieve current shopping cart with backend calculated totals |
| `POST` | `/cart/items` | Authenticated | Add product item to shopping cart |
| `PUT` | `/cart/items/{id}` | Authenticated | Update item quantity in shopping cart |
| `DELETE`| `/cart/items/{id}` | Authenticated | Remove item from shopping cart |
| `DELETE`| `/cart/clear` | Authenticated | Remove all items from shopping cart |
| `GET` | `/wishlist/` | Authenticated | Get all saved wishlist products |
| `POST` | `/wishlist/` | Authenticated | Save product to wishlist |
| `DELETE`| `/wishlist/{product_id}`| Authenticated | Remove product from wishlist |

### Orders & Fulfillment
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders/` | Authenticated | Checkout current cart and place a confirmed order |
| `GET` | `/orders/` | Authenticated | View authenticated customer's past order receipts |
| `GET` | `/orders/{id}` | Authenticated | View detailed line items for a specific order |
| `GET` | `/orders/merchant/my-orders`| **Merchant** | View orders containing items supplied by the seller |
| `GET` | `/orders/admin/all` | **Admin Only** | View master ledger of all platform orders |
| `PUT` | `/orders/{id}/status` | **Admin Only** | Update fulfillment status (`CONFIRMED`, `SHIPPED`, etc.) |
| `PATCH`| `/orders/{id}/tracking` | **Admin/Merchant** | Assign carrier shipment tracking number |

---

## 12. Checkout & ACID Transaction Workflow

When a customer clicks **"Place Confirmed Order"**, the system executes the following steps inside a single database transaction:

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React CheckoutPage
    participant API as FastAPI Order Endpoint
    participant DB as PostgreSQL 16
    participant Warehouse as Product Inventory

    Customer->>Frontend: Clicks "Place Confirmed Order"
    Frontend->>API: POST /api/v1/orders/ (shippingAddress, items)
    activate API
    API->>DB: Begin ACID Transaction
    API->>DB: Query Cart & Items (or populate from payload)
    loop For each item in Cart
        API->>DB: SELECT * FROM products WHERE id = item.product_id FOR UPDATE
        Note over API,DB: Pessimistic Row Lock Acquired
        API->>Warehouse: Verify product.is_active == True & stock >= quantity
        API->>API: Compute Authoritative Unit Price & Subtotal
        API->>DB: Deduct inventory stock (stock = stock - quantity)
        API->>DB: Create OrderItem record
    end
    API->>API: Calculate Subtotal, Tax (8.5%), Shipping, and Grand Total
    API->>DB: Create Order Record (status: CONFIRMED)
    API->>DB: Create Completed Payment Record
    API->>DB: Delete CartItems for User
    API->>DB: COMMIT Transaction
    deactivate API
    API-->>Frontend: HTTP 201 Created (Order Response)
    Frontend-->>Customer: Show Success Toast & Redirect to Order History
```

---

## 13. Testing & Verification

### Run Automated Backend & Database Integration Tests
Ensure the backend server is running, then run the comprehensive test script:

```bash
cd backend
./venv/bin/python -c "
import requests

BASE = 'http://127.0.0.1:8001/api/v1'

# Verify Health
h = requests.get('http://127.0.0.1:8001/health').json()
print('Database Health:', h.get('database'))
assert h.get('database') == 'connected'

# Verify Admin Login
admin = requests.post(f'{BASE}/auth/login', json={'email': 'admin@cloudcart.com', 'password': 'Admin123!'})
assert admin.status_code == 200
print('Admin Authentication: SUCCESS')

# Verify Products
prods = requests.get(f'{BASE}/products/').json()
print(f'Catalog Count: {prods[\"total\"]} products live in PostgreSQL')
assert prods['total'] > 0

print('ALL SYSTEM CHECKS PASSED!')
"
```

### Run Frontend Typecheck and Production Build
```bash
cd frontend
pnpm run build
```
Confirms all React TypeScript types, routes, and Tailwind components compile with zero errors.

---

## 14. Troubleshooting & FAQs

### Q: PostgreSQL throws `OperationalError: connection failed: Connection refused`
**Resolution**:
1. Check if the PostgreSQL service is active:
   ```bash
   sudo service postgresql status
   # or on Windows: Get-Service postgresql*
   ```
2. Start the service if stopped:
   ```bash
   sudo service postgresql start
   ```
3. Verify connection settings in `backend/.env` match your PostgreSQL password (`123456` or your custom password).

### Q: Vite says `Port 5173 is in use, trying another one...`
**Resolution**: Vite automatically falls back to port `5174`. The backend CORS middleware already includes both `http://localhost:5173` and `http://localhost:5174` in `BACKEND_CORS_ORIGINS`.

### Q: Where are uploaded product and category images stored?
**Resolution**: Uploaded images are stored directly in `backend/uploads/products/` and `backend/uploads/categories/`. They are served locally by FastAPI at `http://localhost:8001/uploads/...` without any third-party AWS S3 or cloud dependencies.

---

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it for personal and commercial projects.
# cloudcart
