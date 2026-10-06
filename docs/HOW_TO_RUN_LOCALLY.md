# How to Run RideSync Locally

This guide walks you through setting up and running the **RideSync** platform on your local machine in under 3 minutes.

> [!NOTE]
> **Zero External Setup Required:** No Docker containers, PostgreSQL servers, or Redis instances are needed. Everything runs locally using an embedded SQLite database (`ridesync.db`) and local folder storage for uploads.

---

## 1. Prerequisites

Ensure you have the following installed on your laptop:
- **Python:** Version 3.11 or higher (`python --version`)
- **Node.js:** Version 18.0 or higher (`node -v`)
- **npm:** (`npm -v`)
- **Git**

---

## 2. Quick Start (Two Terminals)

### Terminal 1: Backend & Database

Open a terminal at the repository root (`d:\Github repositories\RideSync`):

```powershell
# 1. Navigate to the backend folder
cd backend

# 2. Create Python virtual environment (if not already created)
python -m venv venv

# 3. Activate the virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# (Or Command Prompt: venv\Scripts\activate.bat)
# (Or macOS/Linux: source venv/bin/activate)

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Seed the database with demo accounts, 15 vehicles, bookings & telemetry
python scripts/seed_all.py

# 6. Start the FastAPI backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> **Backend is now live at:** [`http://127.0.0.1:8000`](http://127.0.0.1:8000)  
> **Interactive Swagger API Docs:** [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)

---

### Terminal 2: Frontend (Next.js)

Open a second terminal at the repository root:

```powershell
# 1. Navigate to the frontend folder
cd frontend

# 2. Install frontend dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

> **Frontend Web Application is now live at:** [`http://localhost:3000`](http://localhost:3000)

---

## 3. Demo Login Accounts

The database comes pre-seeded with ready-to-test demo accounts:

| Role | Email | Password | What You Can Test |
|---|---|---|---|
| **Platform Admin** | `admin@ridesync.com` | `admin123` | Document verification queue, vehicle listing approvals, reports moderation, analytics. |
| **Host / Owner** | `alex.owner@ridesync.com` | `password123` | Multi-vehicle fleet map (`FleetMapView`), incoming rental requests, vehicle listings, chats. |
| **Renter** | `sarah.renter@ridesync.com` | `password123` | Browse vehicles, book trips, "Pay Now" mock payment, receipts, chat with hosts. |
| **Community Host** | `michael.user@ridesync.com` | `password123` | Owner of Mustang GT & Civic Type R; active renter of Porsche Macan. |
| **High-Risk User** | `dave.risky@ridesync.com` | `password123` | Penalized user (Honor Score: 68) with late-return history and rejected listing. |

---

## 4. Testing Key Features

### A. Run the GPS Simulator (Person 2 Feature)
You can replay realistic coordinate routes without any hardware:

```powershell
# In the backend virtual environment:
# 1. Replay a normal in-bounds commute for Vehicle 1 (Tesla Model 3):
python scripts/simulate_gps.py --vehicle-id 1 --route sfo_normal --delay 0.5

# 2. Replay a route that exits the 25 km geofence boundary (triggers alerts & accuracy fuzzer):
python scripts/simulate_gps.py --vehicle-id 1 --route sfo_breach --delay 0.5
```

### B. Run the Automated Test Suite
RideSync has an automated 23-test pytest suite covering all 4 person domains:

```powershell
# From the repository root or backend directory:
backend\venv\Scripts\python -m pytest -v
```

All **23 tests will pass**:
- `test_booking_lifecycle.py` (Double-booking prevention, state machine, mock payment, receipts, radius negotiation)
- `test_tracking_geofence.py` (Fleet tracking, GPS simulation, location ping storage, overdue tracking)
- `test_vehicle_documents.py` (Document upload validation, admin verification queue, approval workflow)
- `test_chat.py` (Owner-renter messaging)
- `test_reviews.py` (Mutual reviews & completion eligibility)
- `test_honor_scores.py` (Honor score rules & audit trail)
- `test_reports.py` (Dispute creation & admin moderation)
- `test_notifications.py` (In-app notifications)

### C. Build the Production Frontend
To verify the Next.js production build:

```powershell
cd frontend
npm run build
```

---

## 5. Troubleshooting & FAQ

### Issue: PowerShell blocks running `Activate.ps1`
**Fix:** Run this once in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Port 8000 or 3000 already in use
**Fix:**
- Backend: Change port: `uvicorn app.main:app --reload --port 8001`
- Frontend: Next.js will automatically prompt to run on port 3001 if 3000 is occupied.

### Issue: How do I completely reset the database to a fresh state?
**Fix:** Simply re-run the master seed script:
```powershell
backend\venv\Scripts\python backend\scripts\seed_all.py
```
This drops existing tables, creates the latest schema, and re-seeds all dummy data cleanly.
