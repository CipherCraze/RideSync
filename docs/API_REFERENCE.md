# RideSync Consolidated API Reference

Base URL: `http://localhost:8000/api`

---

## 1. Authentication & Users (`/auth`, `/users`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user account |
| `POST` | `/auth/login` | Login with email and password (returns JWT Bearer token) |
| `POST` | `/auth/google` | Sign in or register using Google OAuth credential |
| `GET` | `/users/me` | Fetch authenticated user's profile |
| `PUT` | `/users/profile` | Update profile information and biography |
| `GET` | `/users/discover` | Discover hosts and community members |
| `GET` | `/users/{id}/public` | Public profile card with stats and reviews |
| `GET` | `/users/honor-history` | Authenticated user's honor score change audit log |

---

## 2. Vehicles & Marketplace (`/vehicles`, `/uploads`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vehicles/` | Search approved vehicles with price, type, location filters |
| `GET` | `/vehicles/{id}` | Detailed vehicle specifications, photos, and status |
| `GET` | `/vehicles/my-listings` | Host's listed vehicles |
| `POST` | `/vehicles/` | Create a new vehicle listing |
| `PUT` | `/vehicles/{id}` | Update vehicle specifications or geofence boundary |
| `DELETE` | `/vehicles/{id}` | Remove a vehicle listing |
| `PUT` | `/vehicles/{id}/submit` | Submit listing from DRAFT to PENDING for admin review |
| `POST` | `/vehicles/{id}/documents` | Attach compliance document metadata (RC, PUC, Service) |
| `GET` | `/vehicles/{id}/documents` | Retrieve compliance documents for a vehicle |
| `POST` | `/uploads/` | Upload vehicle photos |
| `POST` | `/uploads/document` | Upload PDF/image compliance documents with validation |

---

## 3. GPS Tracking & Geofencing (`/tracking`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tracking/fleet` | Host real-time fleet map telemetry with privacy fuzzer |
| `GET` | `/tracking/vehicles/{id}` | Privacy-preserved vehicle location for host or active renter |
| `GET` | `/tracking/vehicles/{id}/history` | Historical telemetry ping trail for vehicle |
| `GET` | `/tracking/bookings/{id}/overdue-location` | Direct unmasked coordinates for an overdue rental |
| `POST` | `/tracking/vehicles/{id}/simulate` | Trigger simulated movement (IN_BOUNDS, BREACH_NEAR, BREACH_FAR) |
| `POST` | `/tracking/vehicles/{id}/telemetry` | Ingest raw GPS telemetry reading |

---

## 4. Bookings & Mock Transactions (`/bookings`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/bookings/` | Request a new rental (with double-booking check) |
| `GET` | `/bookings/my-rentals` | Renter's bookings and rental trips |
| `GET` | `/bookings/incoming-requests` | Host's incoming rental requests |
| `GET` | `/bookings/{id}` | Detailed booking view with overdue indicator |
| `PUT` | `/bookings/{id}/status` | Update booking status (`CONFIRMED`, `RENTAL_ACTIVE`, `RETURNED`, `COMPLETED`, `CANCELLED`) |
| `POST` | `/bookings/{id}/propose-radius` | Propose permitted operational radius for this trip |
| `POST` | `/bookings/{id}/respond-radius` | Accept or reject proposed operational radius |
| `POST` | `/bookings/{id}/pay` | Execute mock payment transaction |
| `GET` | `/bookings/{id}/receipt` | View payment receipt and transaction details |

---

## 5. Trust, Communication & Moderation (`/chat`, `/reviews`, `/honor`, `/reports`, `/admin`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/chat/conversations` | List user's active conversations |
| `GET` | `/chat/conversations/{id}/messages` | Poll conversation messages |
| `POST` | `/chat/conversations/{id}/messages` | Send message in conversation |
| `GET` | `/notifications/` | Poll in-app notifications |
| `PUT` | `/notifications/{id}/read` | Mark individual notification as read |
| `PUT` | `/notifications/read-all` | Mark all notifications as read |
| `POST` | `/reviews/` | Submit review (after booking is COMPLETED) |
| `GET` | `/reviews/vehicle/{id}` | Approved vehicle reviews |
| `GET` | `/reviews/user/{id}` | User feedback and reviews received |
| `POST` | `/reports/` | File formal dispute or safety report |
| `GET` | `/admin/analytics` | Platform metrics (vehicles, bookings, revenue) |
| `GET` | `/admin/pending-vehicles` | Vehicles awaiting approval queue |
| `PUT` | `/admin/vehicles/{id}/approve` | Approve vehicle listing |
| `PUT` | `/admin/vehicles/{id}/reject` | Reject vehicle listing |
| `GET` | `/admin/documents/pending` | Documents awaiting compliance verification |
| `PUT` | `/admin/documents/{id}/verify` | Approve compliance document |
| `PUT` | `/admin/documents/{id}/reject` | Reject compliance document |
| `PUT` | `/admin/users/honor-score` | Admin honor score adjustment with reason |
| `GET` | `/admin/reports` | Admin dispute moderation queue |
| `PUT` | `/admin/reports/{id}` | Resolve dispute report |
