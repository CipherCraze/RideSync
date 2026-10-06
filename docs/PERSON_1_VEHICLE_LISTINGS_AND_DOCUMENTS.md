# Person 1: Vehicle Listing & Document Verification

## Overview

Person 1 is responsible for the marketplace supply core: vehicle listings, multi-angle imagery, legal and compliance documents, and the admin verification and approval workflow.

---

## 1. Feature Specifications

### 1.1 Vehicle CRUD & Listing Forms
- **Owner Form:** Available at `/vehicles/new` for listing creation and `/vehicles/[id]/edit` for editing existing listings.
- **Attributes:** Brand, Model, Year (1990–2027), Vehicle Type (`Sedan`, `SUV`, `Hatchback`, `Convertible`, `Truck`, `Van`, `Electric`, `Luxury`), Fuel Type (`Petrol`, `Diesel`, `Electric`, `Hybrid`), Transmission (`Automatic`, `Manual`), Seats, Daily Rental Price, Description, Pickup Location address, and Geofence type (`CIRCULAR` or `FLEXIBLE`).
- **Seeded Catalog:** 15 pre-seeded vehicles (`scripts/seed_vehicles.py`) covering all popular body and fuel styles.

### 1.2 Multi-Angle Vehicle Photos
Vehicles require photos covering distinct angles:
- `FRONT` (Primary display photo)
- `REAR`
- `SIDE_LEFT` / `SIDE_RIGHT`
- `INTERIOR`
- `DASHBOARD`
- `OTHER`

Files are uploaded to `/api/uploads/` and stored in the local `uploads/` directory with unique timestamped filenames.

### 1.3 Compliance Documents Upload
Owners upload mandatory compliance credentials:
1. **RC (Registration Certificate):** Proof of vehicle ownership and registration.
2. **PUC (Pollution Under Control):** Emission inspection certificate with expiration date tracking.
3. **Service Record:** Proof of routine maintenance and safety readiness.
4. **Insurance:** Optional commercial/personal liability certificate.

Documents are uploaded via `/api/uploads/document` and validated for supported formats (`.pdf`, `.png`, `.jpg`, `.jpeg`) with a 10MB maximum file size limit.

### 1.4 Admin Document Verification Queue
- Available at `/admin` (Tab: "Documents Queue" / `/api/admin/documents/pending`).
- Admins inspect document numbers, expiry dates, and preview uploaded files.
- Admins can **Verify** or **Reject** with mandatory feedback reason.

### 1.5 Vehicle Approval Workflow
Vehicles follow a strict state progression:
```
[DRAFT] -> (Submit) -> [PENDING] -> (Admin Review) -> [APPROVED] / [REJECTED]
```
- **DRAFT:** Initial work-in-progress state. Only visible to the host.
- **PENDING:** Submitted for admin review once required documents are uploaded.
- **APPROVED:** Publicly listed on the marketplace for renters to discover and book.
- **REJECTED:** Rejected by admin with a detailed rejection reason. Host can remedy documents and resubmit.

---

## 2. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/vehicles/` | Search & filter approved vehicles | Public |
| `GET` | `/api/vehicles/{id}` | Vehicle details, photos, and compliance status | Public |
| `GET` | `/api/vehicles/my-listings` | Host's own listings (including Drafts and Rejected) | Host |
| `POST` | `/api/vehicles/` | Create a new vehicle listing | Host |
| `PUT` | `/api/vehicles/{id}` | Update vehicle specs or geofence boundary | Host (Owner) |
| `DELETE` | `/api/vehicles/{id}` | Soft delete / remove listing | Host (Owner) |
| `PUT` | `/api/vehicles/{id}/submit` | Transition listing from DRAFT to PENDING | Host (Owner) |
| `POST` | `/api/vehicles/{id}/documents` | Add document metadata to vehicle | Host (Owner) |
| `GET` | `/api/vehicles/{id}/documents` | Retrieve vehicle compliance documents | Host / Admin |
| `GET` | `/api/admin/pending-vehicles` | Admin queue of pending vehicle listings | Admin |
| `PUT` | `/api/admin/vehicles/{id}/approve` | Approve vehicle for marketplace search | Admin |
| `PUT` | `/api/admin/vehicles/{id}/reject` | Reject vehicle listing with explanation | Admin |
| `GET` | `/api/admin/documents/pending` | Admin queue of pending documents | Admin |
| `PUT` | `/api/admin/documents/{id}/verify` | Approve compliance document | Admin |
| `PUT` | `/api/admin/documents/{id}/reject` | Reject compliance document with reason | Admin |

---

## 3. Seeded Vehicles Breakdown

`backend/scripts/seed_vehicles.py` seeds 15 vehicles:
- **12 Approved:** Tesla Model 3, Porsche Macan GTS, BMW M4, Rivian R1T, Ford Mustang GT, Mercedes C300, Audi RS6, Hyundai Ioniq 5, Jeep Wrangler Rubicon, Toyota GR Supra, Corvette Stingray, Honda Civic Type R.
- **1 Pending Approval:** Volvo XC90 Recharge (demonstrating admin approval queue).
- **1 Rejected:** Mini Cooper S Convertible (expired PUC demonstration).
- **1 Draft:** Volkswagen Golf GTI (demonstrating draft host state).
