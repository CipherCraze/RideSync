# Person 4: Chat, Reviews & Trust System

## Overview

Person 4 implements user communication, mutual reputation through reviews and ratings, honor score rules, audit history, and platform reports/disputes.

---

## 1. Feature Specifications

### 1.1 In-App Notification Service
The core notification primitive used across the entire platform:
```python
await notification_service.notify(
    user_id=user_id,
    title="Notification Title",
    message="Notification Message",
    notification_type="BOOKING_ACCEPTED",  # GEOFENCE_BREACH, MESSAGE_RECEIVED, etc.
    link_url="/my-rentals",
    payload_json='{"action": "view"}'
)
```
- Real-time updates delivered to users via polling `/api/notifications/` every few seconds.
- Read status tracking (`PUT /api/notifications/{id}/read` and `PUT /api/notifications/read-all`).

### 1.2 Owner-Renter Chat (Polling)
- Peer-to-peer messaging between renter and host.
- Messages stored in `messages` table linked to a `conversations` record.
- Nullable `booking_id` links the discussion directly to a specific rental trip.
- Frontend polls active conversation every 3 seconds to fetch new messages without WebSockets.

### 1.3 Mutual Reviews & Ratings
- Community trust is built through bidirectional ratings (1 to 5 stars) and text reviews.
- **Eligibility Constraints:**
  - Can ONLY be submitted for bookings with status `COMPLETED`.
  - Exactly one review permitted per party (`RENTER_TO_OWNER` and `OWNER_TO_RENTER`).
- Vehicles aggregate average ratings (`rating_avg`) and total review count (`rating_count`).

### 1.4 Honor Score Engine & Audit History
The Honor Score reflects user reliability on a scale of 0 to 100:
- **Tiers:**
  - **90–100 (Trusted):** Full marketplace access, instant booking privileges.
  - **75–89 (Good):** Normal community standing.
  - **60–74 (Warning):** Under observation.
  - **< 60 (Restricted):** Cannot book new rentals.
- **Automated Score Adjustments:**
  - Completion of rental: **+5 points** to both renter and owner.
  - Identity & License verification: **+10 points**.
  - Late return / cancellation after confirmation: **-10 to -15 points**.
- **Audit History:** Every point adjustment is logged in `honor_score_history` with previous score, new score, category, reason, and admin timestamp.

### 1.5 Dispute & Report Workflow
- Users can file formal disputes against vehicles or counterparty users:
  `POST /api/reports/` with reasons like `LATE_RETURN`, `VEHICLE_DAMAGE`, `UNSAFE_BEHAVIOR`, or `POLICY_VIOLATION`.
- Platform admins review pending reports in the Admin Panel (`/admin`), can apply honor score penalties, hide inappropriate reviews, or suspend fraudulent accounts.
