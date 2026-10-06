# RideSync Architecture Overview

## 1. System Vision & Laptop Architecture

RideSync is a peer-to-peer (P2P) vehicle rental and fleet management marketplace tailored for local execution on developer laptops. The architecture emphasizes zero external infrastructure friction:

- **Local Embedded Database:** SQLite (`ridesync.db`) powered by SQLAlchemy 2.0 with `aiosqlite` async drivers. No Docker or PostgreSQL containers required.
- **Local File Storage:** Uploads for vehicle photos, avatars, and compliance documents are stored in the local `uploads/` directory and served directly via FastAPI static file routing.
- **Real-Time Simulation via Polling:** Instead of complex WebSocket message brokers, live updates (notifications, chat messages, fleet GPS telemetry) use lightweight HTTP polling (every 3–5 seconds), keeping local CPU and memory overhead minimal.
- **Modular Deterministic Seeding:** Each domain owner maintains a standalone `seed_<feature>.py`, while `seed_all.py` orchestrates a fresh, schema-synchronized setup across all modules.

---

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                           RideSync Frontend                             |
|               (Next.js 15 App Router, React, Tailwind CSS)              |
+-------------------------------------------------------------------------+
        |                  |                   |                  |
        | HTTP Polling     | Document Upload   | REST API Calls   | Fleet Map
        v                  v                   v                  v
+-------------------------------------------------------------------------+
|                           FastAPI Backend                               |
|                         (Python 3.11+, ASGI)                            |
+-------------------------------------------------------------------------+
| Routers:                                                                |
|  - /api/auth          - /api/vehicles       - /api/tracking             |
|  - /api/bookings      - /api/chat           - /api/reviews              |
|  - /api/notifications - /api/honor          - /api/reports              |
|  - /api/admin         - /api/uploads        - /api/users                |
+-------------------------------------------------------------------------+
        |                  |                   |                  |
        v                  v                   v                  v
+-------------------------------------------------------------------------+
|                         Async Services Layer                            |
|  - VehicleTrackingService & GeofenceService (Wire Privacy, Gradients)  |
|  - BookingService & TransactionService (Lifecycle, Mock Payments)       |
|  - VehicleService & AdminService (Document Validation & Approval Queue) |
|  - ChatService, ReviewService, HonorService, NotificationService        |
+-------------------------------------------------------------------------+
        |                  |                   |                  |
        v                  v                   v                  v
+-------------------------------------------------------------------------+
|                  SQLAlchemy Async Repositories & Models                 |
+-------------------------------------------------------------------------+
        |                                      |
        v                                      v
+-----------------------+              +----------------------------------+
|  Local SQLite DB      |              | Local Uploads Directory          |
|  (./ridesync.db)      |              | (./uploads/documents, images)    |
+-----------------------+              +----------------------------------+
```

---

## 3. Four-Person Feature Responsibilities

To ensure independent parallel development without code merge collisions, the project is structured across four distinct feature domains:

| Role | Domain | Primary Responsibilities | Dependencies |
|---|---|---|---|
| **Person 1** | **Vehicles & Documents** | Vehicle CRUD, 15 seeded dummy cars, multi-angle photos, RC/PUC/Service record uploads, document validation, admin verification queue, listing approval workflow. | Unblocks Persons 2 and 3. |
| **Person 2** | **GPS Tracking & Geofencing** | Route replay GPS simulator, location ping storage (`location_pings`), host fleet map, permitted radius negotiation, Wire Privacy fuzzer, dynamic progressive accuracy gradient, out-of-bounds alerts, overdue location reporting. | Depends on Person 1 vehicles; integrates with Person 3 bookings and Person 4 notifications. |
| **Person 3** | **Booking & Rental Lifecycle** | Double-booking prevention, booking state machine (Pending -> Confirmed -> Active -> Returned -> Completed), pickup/return confirmations, mock payments & receipts, cancellation & refund flags, overdue tracking. | Depends on Person 1 vehicles; unblocks Person 4 reviews. |
| **Person 4** | **Chat, Reviews & Trust** | In-app notification engine (`notify(user, type, payload)`), polling chat, mutual reviews & ratings, review moderation, Honor score rules & audit trail, reports & disputes. | Depends on Users and Completed Bookings. |

---

## 4. Shared Demo Accounts

Pre-seeded deterministic accounts are provided for instant login and paired verification workflows:

| Role | Email | Password | Honor Score | Notes |
|---|---|---|---|---|
| **Platform Admin** | `admin@ridesync.com` | `admin123` | 100 (Trusted) | Full administrative privileges, document verification queue, vehicle approval, dispute resolution. |
| **Host / Owner** | `alex.owner@ridesync.com` | `password123` | 98 (Trusted) | Verified host with multiple listings (Tesla Model 3, Porsche Macan, Rivian R1T, Audi RS6). |
| **Renter** | `sarah.renter@ridesync.com` | `password123` | 95 (Trusted) | Verified community renter with active and completed rental history. |
| **Community Member** | `michael.user@ridesync.com` | `password123` | 85 (Good) | Host of Mustang GT and Civic Type R; active renter of Porsche Macan. |
| **High-Risk User** | `dave.risky@ridesync.com` | `password123` | 68 (Warning) | Penalized user with late return record; host of rejected Mini Cooper. |

---

## 5. Security & Authentication Model

- **JWT Authentication:** Stateful user session tokens are generated via `python-jose` with HMAC-SHA256 (`HS256`).
- **Authorization Dependency:** FastAPI dependency `get_current_user` extracts and decodes the Bearer token, retrieving the user record and asserting suspension/admin flags.
- **Privacy Protections:** Renter access to vehicle GPS coordinates is strictly gated to periods of active rental trips (`RENTAL_ACTIVE` or `CONFIRMED`). Normal coordinates are obfuscated using a progressive spatial fuzzer.
