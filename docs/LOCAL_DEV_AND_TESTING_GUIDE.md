# RideSync Local Development & Testing Guide

## 1. Prerequisites

- **Python:** 3.11 or higher
- **Node.js:** v18.0 or higher with `npm`
- **Git**

No Docker or external database services are required. All storage is local (`ridesync.db` SQLite file and `uploads/` directory).

---

## 2. Fast Setup (Zero to Running in 2 Minutes)

### Step 1: Backend Setup
```bash
# From repository root:
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install Python requirements
pip install -r requirements.txt
```

### Step 2: Seed the Database
Run the master deterministic seed script. This automatically creates clean SQLite tables and seeds demo accounts, 15 vehicles, telemetry pings, bookings across all lifecycle stages, and chat/reviews:
```bash
# From repository root:
backend\venv\Scripts\python backend\scripts\seed_all.py
```

### Step 3: Frontend Setup
```bash
# In a separate terminal, navigate to frontend:
cd frontend

# Install dependencies (including Leaflet maps)
npm install

# Start development server
npm run dev
```

The web application is now live at: **`http://localhost:3000`**  
The FastAPI Swagger interactive documentation is at: **`http://localhost:8000/docs`**

---

## 3. Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@ridesync.com` | `admin123` |
| **Owner / Host** | `alex.owner@ridesync.com` | `password123` |
| **Renter** | `sarah.renter@ridesync.com` | `password123` |
| **Community Member** | `michael.user@ridesync.com` | `password123` |
| **High-Risk User** | `dave.risky@ridesync.com` | `password123` |

---

## 4. Running the GPS Simulator

To simulate vehicle movement and trigger geofence breach notifications without physical hardware:

```bash
# Replay normal in-bounds route for Vehicle 1 (Tesla Model 3 Long Range):
backend\venv\Scripts\python backend\scripts\simulate_gps.py --vehicle-id 1 --route sfo_normal --delay 0.5

# Replay route heading out-of-bounds (triggers boundary alert and progressive accuracy fuzzer):
backend\venv\Scripts\python backend\scripts\simulate_gps.py --vehicle-id 1 --route sfo_breach --delay 0.5
```

---

## 5. Running Automated Tests

RideSync includes an automated pytest suite covering all 4 person feature sets:

```bash
# Run the complete test suite:
backend\venv\Scripts\python -m pytest

# Run with verbose test names:
backend\venv\Scripts\python -m pytest -v
```

### Test Coverage Highlights:
- `test_booking_lifecycle.py`: Double booking prevention, pending -> confirmed -> active -> returned -> completed transitions, mock payment, receipts, radius negotiation, cancellation & refund flags.
- `test_tracking_geofence.py`: Fleet telemetry, progressive accuracy gradient, ping storage, authorization gates, overdue location reporting.
- `test_vehicle_documents.py`: Document upload validation, file size/format checks, admin verification queue, approval states.
- `test_chat.py`: Peer-to-peer polling messaging, conversation retrieval.
- `test_reviews.py`: Mutual review eligibility (COMPLETED only), single review rule.
- `test_honor_scores.py`: Honor score rules, point changes, audit logs.
- `test_reports.py`: Dispute filing, admin penalty moderation.
- `test_notifications.py`: In-app notification creation, unread counts, mark-as-read.
