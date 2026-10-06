# Person 3: Booking & Rental Lifecycle

## Overview

Person 3 implements the booking state machine, double-booking prevention, pickup and return workflows, mock payment processing, receipt generation, cancellation with refund flags, and late return detection.

---

## 1. Feature Specifications

### 1.1 Availability & Double-Booking Prevention
- When a renter places a rental request (`POST /api/bookings/`), the system verifies that the vehicle is approved and available.
- `BookingRepository.check_overlapping_bookings` queries for active bookings on overlapping date ranges:
  ```sql
  status IN ('PENDING', 'CONFIRMED', 'RENTAL_ACTIVE') 
  AND start_date < new_end_date 
  AND end_date > new_start_date
  ```
- If an overlap exists, the request is rejected with `HTTP 400: Vehicle is already booked for the selected date range.`

### 1.2 Booking Lifecycle State Machine
Rentals transition through a deterministic lifecycle:

```
[PENDING]
   |
   +---> [REJECTED] (Owner declines)
   |
   +---> [CONFIRMED] (Owner accepts)
            |
            +---> [CANCELLED] (Renter/Owner cancels; status flag set to REFUNDED)
            |
            +---> [RENTAL_ACTIVE] (Pickup confirmed; active rental trip begins)
                     |
                     +---> [RETURNED] (Vehicle return confirmed)
                              |
                              +---> [COMPLETED] (Host finalizes; +5 Honor Score to both)
```

- **Pending:** Renter has requested the booking.
- **Confirmed:** Host has approved the dates and price.
- **Rental Active:** Renter has picked up the vehicle. Live telemetry and tracking permissions are active.
- **Returned:** Vehicle has been returned to the pickup location.
- **Completed:** Host inspects vehicle and finalizes rental. Automatically rewards **+5 Honor Score points** to both renter and owner.
- **Cancelled:** Renter or host cancelled. If already paid, `payment_status` updates to `REFUNDED`.

### 1.3 Mock Payment & Receipt Generation
- Renter clicks "Pay Now" on a pending or confirmed booking.
- Calls `POST /api/bookings/{id}/pay?status=SUCCESS`.
- Creates a `Transaction` entry and sets `payment_status = "PAID"`.
- Renter and Host can view the formal transaction receipt:
  `GET /api/bookings/{id}/receipt`.

### 1.4 Late-Return Tracking & Overdue Flags
- For any booking with status `RENTAL_ACTIVE`, if the current time exceeds `end_date`, `is_overdue` is computed dynamically as `True`.
- The UI displays an alert badge (`⚠️ Overdue`).
- Host and Admin gain access to `/api/tracking/bookings/{id}/overdue-location`.

---

## 2. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/bookings/` | Create a booking request | Authenticated Renter |
| `GET` | `/api/bookings/my-rentals` | Renter's trip history & active rentals | Authenticated Renter |
| `GET` | `/api/bookings/incoming-requests` | Host's incoming rental requests | Authenticated Host |
| `GET` | `/api/bookings/{id}` | Detailed booking view with overdue flag | Renter / Host / Admin |
| `PUT` | `/api/bookings/{id}/status` | Transition status (CONFIRMED, RENTAL_ACTIVE, etc.) | Renter / Host |
| `POST` | `/api/bookings/{id}/propose-radius` | Propose operational radius for trip | Renter / Host |
| `POST` | `/api/bookings/{id}/respond-radius` | Accept or reject proposed radius | Counterparty |
| `POST` | `/api/bookings/{id}/pay` | Execute mock payment transaction | Renter |
| `GET` | `/api/bookings/{id}/receipt` | Retrieve payment receipts | Renter / Host |
