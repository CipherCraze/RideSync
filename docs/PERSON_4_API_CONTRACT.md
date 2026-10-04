# Person 4: Chat, Reviews & Trust System — API Contract & Integration Guide

## 1. Overview
The Person 4 module provides communication, peer reputation, disputes, and notification infrastructure for RideSync.
All REST endpoints are mounted under the FastAPI application root with prefix `/api` (configured via `settings.API_V1_STR`).
Live updates use **HTTP polling** (no WebSockets required).

---

## 2. Notification Service (`NotificationService`)

The notification service is decoupled and exposed both as an internal Python service (for Person 2 & Person 3) and as client-facing REST APIs.

### 2.1 Internal Python Service Interface (For Person 2 & Person 3)

Import and instantiate `NotificationService` with an active `AsyncSession`:

```python
from app.services.notification_service import NotificationService

# Inside your endpoint or service:
notif_service = NotificationService(db_session)
notification = await notif_service.notify(
    user_id=target_user_id,          # int: User ID receiving the notification
    notif_type="BOOKING_UPDATE",      # str: e.g. GEOFENCE_ALERT, BOOKING_UPDATE, MESSAGE_RECEIVED, REVIEW_RECEIVED
    title="Booking Confirmed",         # str: Short header
    message="Your booking for Tesla Model 3 has been confirmed.", # str: Human readable body
    payload={                         # Optional dict: Arbitrary JSON data
        "booking_id": 42,
        "action": "view_booking"
    },
    link_url="/bookings/42"           # Optional str: Client frontend route to navigate when clicked
)
```

#### Standard Event Types for Persons 2 & 3:
- **Person 2 (GPS / Telematics):**
  - `GEOFENCE_ALERT` — When a vehicle exits/enters restricted boundaries.
  - `SPEEDING_ALERT` — Vehicle exceeded speed threshold.
  - `DEVICE_OFFLINE` — Vehicle tracker stopped emitting telemetry.
- **Person 3 (Bookings & Payments):**
  - `BOOKING_CREATED` — Owner receives request.
  - `BOOKING_CONFIRMED` / `BOOKING_CANCELLED` / `BOOKING_COMPLETED` — Renter and owner status updates.
  - `PAYMENT_SUCCESS` / `PAYMENT_REFUNDED` — Mock payment state changes.
  - `REVIEW_PROMPT` — Triggered when a booking is completed (`link_url="/profile?tab=reviews"`).

---

### 2.2 Client Notification REST Endpoints

#### 1. List User Notifications
- **Endpoint:** `GET /api/notifications/`
- **Auth:** Required (`Bearer <JWT>`)
- **Query Parameters:**
  - `skip` (int, default=0)
  - `limit` (int, default=50)
  - `unread_only` (bool, default=false)
- **Response (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "user_id": 2,
      "type": "MESSAGE_RECEIVED",
      "title": "New message from Alex",
      "message": "Hi, is the car available for pickup early?",
      "payload_json": "{\"conversation_id\": 1}",
      "link_url": "/chat?conversationId=1",
      "is_read": false,
      "created_at": "2026-10-02T10:00:00Z"
    }
  ]
  ```

#### 2. Get Unread Count
- **Endpoint:** `GET /api/notifications/unread-count`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):**
  ```json
  {
    "unread_count": 3
  }
  ```

#### 3. Mark Notification as Read
- **Endpoint:** `PUT /api/notifications/{notification_id}/read`
- **Auth:** Required (`Bearer <JWT>`)
- **Authorization:** Only the owner of the notification can mark it read.
- **Response (`200 OK`):** Updated `NotificationResponse` object.

#### 4. Mark All Notifications as Read
- **Endpoint:** `PUT /api/notifications/mark-all-read`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):**
  ```json
  {
    "message": "All notifications marked as read"
  }
  ```

---

## 3. Owner-Renter Chat & Booking Support

Enables direct peer messaging with optional booking context. Real-time updates operate via client polling every 3–5 seconds.

#### 1. Create or Find Conversation
- **Endpoint:** `POST /api/chat/conversations`
- **Auth:** Required (`Bearer <JWT>`)
- **Request Body:**
  ```json
  {
    "participant_id": 1,
    "booking_id": 10 // nullable, can be null or integer
  }
  ```
- **Rules:**
  - Users cannot start a conversation with themselves (`400 Bad Request`).
  - Returns existing conversation if one already exists between the two users.
- **Response (`200 OK`):** `ConversationResponse` with participant details, last message, and unread count.

#### 2. List User Conversations
- **Endpoint:** `GET /api/chat/conversations`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):** Array of `ConversationResponse` ordered by latest message activity.

#### 3. Get Conversation Messages
- **Endpoint:** `GET /api/chat/conversations/{conversation_id}/messages`
- **Auth:** Required (`Bearer <JWT>`)
- **Authorization:** Requester must be `user1` or `user2` (`403 Forbidden`).
- **Query Parameters:**
  - `limit` (int, default=50)
  - `before_id` (int, optional for pagination)
- **Side Effect:** Automatically marks inbound unread messages as read for the requesting user.
- **Response (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "conversation_id": 1,
      "sender_id": 2,
      "content": "Hello, is pickup at 10 AM still good?",
      "is_read": true,
      "created_at": "2026-10-02T10:05:00Z"
    }
  ]
  ```

#### 4. Send Message
- **Endpoint:** `POST /api/chat/conversations/{conversation_id}/messages`
- **Auth:** Required (`Bearer <JWT>`)
- **Authorization:** Requester must be `user1` or `user2` (`403 Forbidden`).
- **Request Body:**
  ```json
  {
    "content": "Yes, 10 AM works perfectly!"
  }
  ```
- **Side Effect:** Dispatches notification (`type="MESSAGE_RECEIVED"`) to the other participant.
- **Response (`201 Created`):** `MessageResponse`.

#### 5. Total Unread Message Count
- **Endpoint:** `GET /api/chat/unread-count`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):**
  ```json
  {
    "unread_count": 2
  }
  ```

---

## 4. Mutual Reviews & Eligibility

Provides mutual peer ratings and feedback following completed bookings.

### Rules & Integrity Guarantees:
1. Ratings must be integer between `1` and `5`.
2. Reviewer and Reviewee must both be participants in the booking.
3. Reviewer cannot review themselves (`400 Bad Request`).
4. Strict uniqueness: One review per reviewer per booking (`400 Duplicate Review`).
5. **Honor Score Decoupling**: Submitting reviews does **NOT** directly alter honor scores.

#### 1. Check Review Eligibility
- **Endpoint:** `GET /api/reviews/booking/{booking_id}/eligibility`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):**
  ```json
  {
    "booking_id": 1,
    "can_review": true,
    "reviewee_id": 1,
    "already_reviewed": false,
    "reason": null
  }
  ```

#### 2. Submit Review
- **Endpoint:** `POST /api/reviews/`
- **Auth:** Required (`Bearer <JWT>`)
- **Request Body:**
  ```json
  {
    "booking_id": 1,
    "reviewee_id": 1,
    "rating": 5,
    "comment": "Smooth trip, highly recommended!"
  }
  ```
- **Response (`201 Created`):** `ReviewResponse`.

#### 3. View Received Reviews
- **Endpoint:** `GET /api/reviews/received`
- **Auth:** Required (`Bearer <JWT>`)
- **Query Parameters:** `user_id` (optional, defaults to current authenticated user).
- **Response (`200 OK`):** List of non-hidden reviews with reviewer details.

#### 4. View Given Reviews
- **Endpoint:** `GET /api/reviews/given`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):** List of reviews authored by the caller.

---

## 5. Review Moderation & Admin Controls

#### 1. Admin Review Moderation (Hide/Restore)
- **Endpoint:** `PUT /api/admin/reviews/{review_id}/moderate`
- **Auth:** Required (`Bearer <JWT>`), Role: `ADMIN` (`403 Forbidden` if non-admin).
- **Request Body:**
  ```json
  {
    "is_hidden": true,
    "reason": "Abusive language in comments"
  }
  ```
- **Response (`200 OK`):** Updated `ReviewResponse`.

---

## 6. Honor Score System & Audit Trail

All users start with a default score of `100`. Every change creates an immutable audit row in `honor_score_history`.

#### 1. Get Current Honor Score
- **Endpoint:** `GET /api/honor/score`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):**
  ```json
  {
    "user_id": 2,
    "honor_score": 95
  }
  ```

#### 2. Get Score History / Audit Trail
- **Endpoint:** `GET /api/honor/history`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "user_id": 2,
      "old_score": 100,
      "new_score": 95,
      "change": -5,
      "reason": "Late vehicle return penalty",
      "reference_type": "REPORT",
      "reference_id": 10,
      "created_at": "2026-10-02T10:15:00Z"
    }
  ]
  ```

#### 3. Admin Score Adjustment
- **Endpoint:** `PUT /api/admin/users/honor-score`
- **Auth:** Required (`Bearer <JWT>`), Role: `ADMIN`.
- **Request Body:**
  ```json
  {
    "user_id": 2,
    "delta": -10,
    "reason": "Confirmed unauthorized vehicle transfer",
    "reference_type": "REPORT",
    "reference_id": 12
  }
  ```
- **Side Effect:** Dispatches notification (`type="HONOR_SCORE_UPDATE"`) informing user of the adjustment.

---

## 7. Reports & Disputes Workflow

#### 1. File a Report
- **Endpoint:** `POST /api/reports/`
- **Auth:** Required (`Bearer <JWT>`)
- **Request Body:**
  ```json
  {
    "reported_user_id": 2,
    "vehicle_id": null,
    "booking_id": 5,
    "review_id": null,
    "category": "LATE_RETURN",
    "reason": "Late Return",
    "description": "Vehicle returned 3 hours late without prior notice."
  }
  ```
- **Response (`201 Created`):** `ReportResponse` with status `OPEN`.

#### 2. View My Filed Reports
- **Endpoint:** `GET /api/reports/my-reports`
- **Auth:** Required (`Bearer <JWT>`)
- **Response (`200 OK`):** List of user's filed reports with current resolution statuses and admin notes.

#### 3. Admin: List & Filter Reports
- **Endpoint:** `GET /api/admin/reports`
- **Auth:** Required (`Bearer <JWT>`), Role: `ADMIN`.
- **Query Parameters:** `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`), `skip`, `limit`.

#### 4. Admin: Update Report Status & Apply Penalties
- **Endpoint:** `PUT /api/admin/reports/{report_id}`
- **Auth:** Required (`Bearer <JWT>`), Role: `ADMIN`.
- **Request Body:**
  ```json
  {
    "status": "RESOLVED",
    "admin_notes": "Late return confirmed via GPS logs. Applying 5-point honor penalty.",
    "honor_penalty": 5
  }
  ```
- **Side Effects:**
  - Auto-sets `resolved_at` when resolved or rejected.
  - Automatically records `honor_score_history` row linked to `reference_type="REPORT"` and `reference_id=report_id`.
  - Dispatches resolution notifications to reporter and reported party.

---

## 8. Integration Instructions for Person 2 & Person 3

### For Person 2 (GPS & Telematics):
1. **Notifications:**
   ```python
   await NotificationService(db).notify(
       user_id=owner_id,
       notif_type="GEOFENCE_ALERT",
       title="Geofence Boundary Alert",
       message=f"Vehicle {vehicle.brand} {vehicle.model} exited designated zone.",
       payload={"vehicle_id": vehicle.id, "lat": lat, "lng": lng},
       link_url=f"/vehicles/{vehicle.id}"
   )
   ```

### For Person 3 (Bookings & Payments):
1. **Link Conversations to Bookings:**
   - Pass `booking_id` to `POST /api/chat/conversations` when a user clicks "Message Host" from a booking card.
2. **Review Triggers on Completion:**
   - When a booking changes status to `COMPLETED`:
   ```python
   await NotificationService(db).notify(
       user_id=renter_id,
       notif_type="REVIEW_PROMPT",
       title="How was your trip?",
       message=f"Leave a review for your trip with {owner_name}.",
       payload={"booking_id": booking.id},
       link_url=f"/profile?tab=reviews"
   )
   ```
3. **Review Eligibility Model Check:**
   - Person 4's `ReviewService.verify_booking_eligibility()` already checks `booking.renter_id`, `booking.owner_id`, and `booking.status == "COMPLETED"`. Once Person 3 defines the final Booking model, no interface changes are required.
