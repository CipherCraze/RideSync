# RideSync — Production Peer-to-Peer Vehicle Rental Marketplace Platform

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0-D76B00?style=flat-square&logo=python)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**RideSync** is a production-grade, full-stack peer-to-peer (P2P) vehicle rental marketplace built from scratch. Unlike traditional vehicle rental company platforms (like Zoomcar or Hertz), RideSync functions as a true community marketplace where registered users can **both list their own personal vehicles for rent and rent vehicles from other members**.

The platform is designed following Clean Architecture software principles (Repository Pattern, Service Layer, Dependency Injection, Type Safety, and Pydantic v2 schemas) and features a modern, professional light UI theme inspired by **Stripe**, **Linear**, **Vercel**, and **Airbnb**.

---

## 🌟 Key Platform Features

### 1. Unified User Role Architecture
- **Dual Capability**: Every registered user can simultaneously act as a **Vehicle Owner (Host)** and a **Renter**. There is no separate owner account required.
- **Admin Role**: Platform administrators possess global security, verification, approval, score adjustment, and analytics privileges.

### 2. Community Honor Score System
- **Baseline Score**: Every newly registered user receives a baseline **100 Honor Points**.
- **Tier Classifications**:
  - **95 – 100 Points** → `Trusted` (Green Badge, eligible for instant booking & lower deposit tiers)
  - **80 – 94 Points** → `Good` (Blue Badge, standard standing)
  - **60 – 79 Points** → `Warning` (Amber Badge, under review due to minor cancellations)
  - **Below 60 Points** → `Restricted` (Red Badge, rental request privileges automatically blocked)
- **Honor Dynamics & Hooks**:
  - Successful rental completion: **+5 Pts** to both renter & host.
  - Driver license identity verification: **+10 Pts** boost.
  - Positive 4–5 star peer review: **+3 Pts** boost.
  - Cancellation of confirmed booking: **-10 Pts** penalty.
  - Critical 1–2 star review: **-5 Pts** penalty.
  - Unannounced late return / damage: **-15 Pts** penalty.
- **Complete Audit Trail**: Every score change is permanently recorded with timestamp, delta, new score, category, and reason in `honor_score_history`.

### 3. Booking Lifecycle State Machine
- Strict state transitions: `PENDING` ➔ `CONFIRMED` ➔ `RENTAL_ACTIVE` ➔ `RETURNED` ➔ `COMPLETED` (or `CANCELLED` / `REJECTED`).
- Automated date overlap validation preventing double-booking of any vehicle.
- Dynamic daily rate total calculation (`Days * Price_Per_Day`).

### 4. Vehicle Marketplace & Discovery
- Keyword search across brand, model, description, and pickup location.
- Multi-parameter filter sidebar: Location, Daily Price Range, Vehicle Type (*Electric, Luxury, SUV, Sedan, Convertible, Truck, Van, Hatchback*), Fuel Type (*Electric, Hybrid, Petrol, Diesel*), Transmission (*Automatic, Manual*), Minimum Seats, and Sorting (*Recently Added, Price Low/High, Rating*).

### 5. Peer & Vehicle Reviews
- Dual 360° review capability:
  - Renter reviews Owner & Vehicle after trip completion.
  - Owner reviews Renter after vehicle return.
- Real-time recalculation of average vehicle ratings (`rating_avg`) and review count.

### 6. Admin Security & Command Center (`/admin`)
- **Real-Time Analytics**: Total Users, Verified Drivers, Total Listings, Pending Approvals, Active Bookings, Open Violation Reports, Average Honor Score.
- **Listing Approvals**: Inspect new vehicle listings and approve or reject with host feedback.
- **License Verification Queue**: Review submitted driver license numbers and verify driver identity (+10 Pts reward).
- **Violation Reports Management**: Review filed reports for fake listings, damage, or fraud.
- **Honor Adjustment Engine**: Manual score adjustment tool with mandatory audit logging.

---

## 🎨 UI Design System & Aesthetics

RideSync follows modern professional UI/UX standards:
- **Clean Palette**: Pure White (`#FFFFFF`) background, Light Gray (`#F9FAFB`) card surfaces, subtle borders (`#E5E7EB`).
- **Primary Accent**: Crisp Royal Blue (`#2563EB`) for active buttons, badges, and focal elements.
- **Rounded Corners**: Modern `xl` (`0.75rem`) and `2xl` (`1rem`) border radii.
- **Typography**: Inter / Geist font family fallback stack with high scannability.
- **Responsive Layout**: Mobile-first design with sticky navigation, filter drawers, and modal dialogs.

---

## 📁 Repository Structure

```
RideSync/
├── backend/
│   ├── alembic/                 # Alembic Database Migration Environment
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── core/                # Config, DB Session Engine, Security & JWT
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── deps.py
│   │   ├── models/              # SQLAlchemy 2.0 Declarative Models
│   │   │   ├── user.py
│   │   │   ├── vehicle.py
│   │   │   ├── vehicle_image.py
│   │   │   ├── booking.py
│   │   │   ├── review.py
│   │   │   ├── notification.py
│   │   │   ├── report.py
│   │   │   └── honor_score_history.py
│   │   ├── repositories/        # Repository Pattern (CRUD & Custom Queries)
│   │   │   ├── base.py
│   │   │   ├── user_repository.py
│   │   │   ├── vehicle_repository.py
│   │   │   ├── booking_repository.py
│   │   │   ├── review_repository.py
│   │   │   ├── notification_repository.py
│   │   │   ├── report_repository.py
│   │   │   └── honor_repository.py
│   │   ├── services/            # Business Logic Layer
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── vehicle_service.py
│   │   │   ├── booking_service.py
│   │   │   ├── honor_service.py
│   │   │   ├── review_service.py
│   │   │   ├── notification_service.py
│   │   │   ├── report_service.py
│   │   │   └── admin_service.py
│   │   ├── schemas/             # Pydantic v2 Request/Response Schemas
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── vehicle.py
│   │   │   ├── booking.py
│   │   │   ├── review.py
│   │   │   ├── notification.py
│   │   │   ├── report.py
│   │   │   ├── honor.py
│   │   │   └── admin.py
│   │   ├── routers/             # FastAPI REST API Routers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── vehicles.py
│   │   │   ├── bookings.py
│   │   │   ├── reviews.py
│   │   │   ├── notifications.py
│   │   │   ├── reports.py
│   │   │   └── admin.py
│   │   └── main.py              # FastAPI Application Entrypoint & CORS
│   ├── scripts/
│   │   └── seed.py              # Realistic Database Seeding Script
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 15 App Router Pages
│   │   │   ├── (auth)/login/
│   │   │   ├── (auth)/register/
│   │   │   ├── admin/
│   │   │   ├── booking-requests/
│   │   │   ├── dashboard/
│   │   │   ├── my-rentals/
│   │   │   ├── my-vehicles/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   ├── vehicles/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── edit/
│   │   │   │   └── new/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Marketplace Landing Page
│   │   │   ├── providers.tsx
│   │   │   └── not-found.tsx
│   │   ├── components/          # Reusable UI & Domain Components
│   │   │   ├── ui/              # Button, Card, Input, Badge, Modal, RatingStars, Badges
│   │   │   ├── layout/          # Navbar & Footer
│   │   │   ├── vehicles/        # VehicleCard, VehicleFilterSidebar, VehicleGallery
│   │   │   └── reviews/         # ReviewCard & AddReviewModal
│   │   ├── hooks/
│   │   │   └── useAuth.tsx      # Auth Context & Token Manager
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios Instance & API Methods
│   │   │   └── utils.ts         # Formatting & Honor Score Utils
│   │   └── types/
│   │       └── index.ts         # TypeScript Domain Models
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start & Local Development Setup

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+
- **npm** or **yarn**

---

### Step 1: Clone Repository
```bash
git clone https://github.com/CipherCraze/RideSync.git
cd RideSync
```

---

### Step 2: Backend Setup & Database Seeding

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Populate the database with realistic sample users, vehicles, bookings, reviews, and honor score logs:
   ```bash
   python scripts/seed.py
   ```

5. Launch the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **FastAPI Interactive Swagger Docs**: `http://localhost:8000/docs`
   - **ReDoc Documentation**: `http://localhost:8000/redoc`

---

### Step 3: Frontend Setup

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js 15 development server:
   ```bash
   npm run dev
   ```
   - **RideSync Web Application**: `http://localhost:3000`

---

## 🔒 Authentication Setup

RideSync supports both standard Email/Password authentication and Google OAuth Single Sign-On (SSO).

### 1. Standard Email Authentication
Email authentication is fully functional out of the box using JWT (JSON Web Tokens) and bcrypt password hashing. Collaborators can simply use the `/register` endpoint or the "Get Started" page to create real accounts with real email addresses.

### 2. Google OAuth SSO Setup
The backend is already wired to accept and verify Google OAuth tokens and automatically provision user accounts. To enable Google Sign-In for your local instance or for other collaborators:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and configure the **OAuth consent screen**.
3. Create new **OAuth 2.0 Client IDs** (Web application type).
4. Add `http://localhost:3000` to your Authorized JavaScript origins.
5. Create a `.env` file in the `backend/` directory and add your Client ID:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
6. Create a `.env.local` file in the `frontend/` directory and add the Client ID there as well so the frontend Google Sign-In button functions:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

*(Note: If the `GOOGLE_CLIENT_ID` is missing or mismatched, the backend will securely reject the Google tokens).*

---

## 🔑 Pre-Seeded Instant Demo Accounts

You can test any role on the platform using 1-click demo logins on the `/login` page or with these credentials:

| Account | Email | Password | Honor Score | Role / Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Officer** | `admin@ridesync.com` | `admin123` | **100 Pts** | Full Admin Command Dashboard (`/admin`) |
| **Verified Host** | `alex.owner@ridesync.com` | `password123` | **98 Pts** | Verified Host (Owns Tesla Model 3 & Porsche Macan) |
| **Trusted Renter** | `sarah.renter@ridesync.com` | `password123` | **95 Pts** | Trusted Renter (Owns BMW M4 & Rivian R1T) |
| **Member User** | `michael.user@ridesync.com` | `password123` | **85 Pts** | Good Standing (Owns Mustang GT & RAV4 Hybrid) |
| **Warning User** | `dave.risky@ridesync.com` | `password123` | **68 Pts** | Warning Tier (Owns Mercedes E450 pending approval) |

---

## 🔌 Complete REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user (claims initial 100 Honor Pts) | No |
| **POST** | `/api/auth/login` | Authenticate user & issue JWT Bearer Token | No |
| **GET** | `/api/auth/me` | Fetch authenticated user profile & metric counts | Yes |
| **GET** | `/api/users/profile/{id}` | Get public profile & honor badge of any user | No |
| **PUT** | `/api/users/profile` | Update profile information (name, phone, bio, avatar) | Yes |
| **POST** | `/api/users/verify-request` | Submit driving license number for admin verification | Yes |
| **GET** | `/api/users/honor-history` | Fetch complete honor score audit history for user | Yes |
| **GET** | `/api/vehicles/` | Search & filter vehicles marketplace | No |
| **GET** | `/api/vehicles/{id}` | Get detailed vehicle specs, gallery, owner & reviews | No |
| **GET** | `/api/vehicles/my-listings` | Get vehicles listed by current host | Yes |
| **POST** | `/api/vehicles/` | List a new vehicle (Auto-approved if host verified) | Yes |
| **PUT** | `/api/vehicles/{id}` | Edit vehicle rates, specs, availability & photos | Yes |
| **DELETE** | `/api/vehicles/{id}` | Delete vehicle listing | Yes |
| **POST** | `/api/bookings/` | Request a new rental booking for date range | Yes |
| **GET** | `/api/bookings/my-rentals` | Get renter's trips (Active, Pending, Completed, Cancelled) | Yes |
| **GET** | `/api/bookings/incoming-requests` | Get host's incoming rental requests | Yes |
| **PUT** | `/api/bookings/{id}/status` | Update booking status (`CONFIRMED`, `RENTAL_ACTIVE`, `RETURNED`, `COMPLETED`, `CANCELLED`) | Yes |
| **POST** | `/api/reviews/` | Submit peer review for owner, renter, or vehicle | Yes |
| **GET** | `/api/reviews/vehicle/{id}` | Fetch verified reviews for a vehicle | No |
| **GET** | `/api/notifications/` | Fetch user notification alerts feed | Yes |
| **PUT** | `/api/notifications/{id}/read` | Mark specific notification as read | Yes |
| **POST** | `/api/reports/` | Submit a violation or safety report | Yes |
| **GET** | `/api/admin/analytics` | Aggregate platform metrics & analytics | Admin |
| **GET** | `/api/admin/pending-vehicles` | Fetch vehicle listings pending admin approval | Admin |
| **PUT** | `/api/admin/vehicles/{id}/approve` | Approve vehicle listing for live marketplace | Admin |
| **GET** | `/api/admin/pending-verifications` | Fetch users with pending license verification | Admin |
| **PUT** | `/api/admin/users/{id}/verify` | Verify driver license identity (+10 Pts reward) | Admin |
| **PUT** | `/api/admin/users/honor-score` | Manually adjust honor score with mandatory audit reason | Admin |
| **PUT** | `/api/admin/users/{id}/suspend` | Toggle user account suspension | Admin |

---

## 🐳 Docker Deployment (Optional)

Run the backend and frontend simultaneously with Docker Compose:

```bash
docker-compose up --build
```

- **Frontend Container**: Runs on `http://localhost:3000`
- **Backend Container**: Runs on `http://localhost:8000`

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.