# Person 2: GPS Tracking & Geofencing

## Overview

Person 2 is responsible for vehicle location monitoring, privacy protections, boundary perimeter alerts, and overdue tracking.

---

## 1. Feature Specifications

### 1.1 GPS Simulator (Script & API)
To simulate vehicle hardware without physical OBD/GPS sensors:
- **CLI Script:** `backend/scripts/simulate_gps.py` allows replaying realistic coordinate routes:
  ```bash
  python backend/scripts/simulate_gps.py --vehicle-id 1 --route sfo_normal --delay 0.5
  python backend/scripts/simulate_gps.py --vehicle-id 1 --route sfo_breach --delay 0.5
  ```
- **API Simulation Endpoint:** `POST /api/tracking/vehicles/{id}/simulate` takes a `target_state` (`IN_BOUNDS`, `BREACH_NEAR`, `BREACH_FAR`, `AUTO`) and calculates coordinates at appropriate distances from the center.

### 1.2 Location Ping Storage & History
- Table: `location_pings`
- Columns: `id`, `vehicle_id`, `booking_id`, `latitude`, `longitude`, `speed_kmh`, `battery_or_fuel_level`, `is_geofence_breached`, `breach_distance_km`, `recorded_at`.
- Historical trail endpoint: `GET /api/tracking/vehicles/{vehicle_id}/history?limit=50`.
- **Permissions:** Restricted to the vehicle owner, or a renter with an active or confirmed booking for that vehicle.

### 1.3 Permitted Radius Negotiation (Joint Host-Renter Agreement)
Owners and renters can agree upon a customized operational radius:
1. Either party proposes a new permitted radius:
   `POST /api/bookings/{id}/propose-radius` with `{"proposed_radius_km": 40.0}`.
2. The proposal is flagged as `PENDING` and sent as an in-app notification to the counterpart.
3. The other party responds:
   `POST /api/bookings/{id}/respond-radius` with `{"action": "ACCEPT"}` or `{"action": "REJECT"}`.
4. When accepted, `permitted_radius_km` updates on the booking and automatically synchronizes with the active vehicle's circular geofence radius.

### 1.4 Wire Privacy Fuzzer & Dynamic Accuracy Gradient
To protect host and renter privacy during ordinary operations:
- When a vehicle is **within bounds**, exact coordinates are obfuscated using a spatial fuzzer with a deterministic seed, providing a coarse radius (~1.5 km default buffer).
- When a vehicle approaches or crosses the geofence perimeter (**Breach State**), precision sharpens progressively:
  - **Near Breach (0–2 km outside):** Accuracy tightens to ~500 m.
  - **Distant / Critical Breach (>5 km outside):** High-precision mode sharpens to ~80 m (direct pinpoint recovery).

### 1.5 Out-of-Bounds In-App Notifications
When a vehicle transitions from compliant to breached:
- Automatically triggers a high-priority notification to the host (`type: "GEOFENCE_BREACH"`).
- Contains breach distance and updated precision level.

### 1.6 Overdue Vehicle Location Reporting
When an active rental passes its scheduled return time without being returned:
- `GET /api/tracking/bookings/{id}/overdue-location` exposes unmasked pinpoint GPS coordinates, overdue hours, vehicle speed, battery/fuel status, and emergency alert state (`OVERDUE` or `CRITICAL_OVERDUE`).
- Accessible by the host and platform administrators for recovery coordination.
