import sqlite3
import os

db_path = "ridesync.db"
if not os.path.exists(db_path) and os.path.exists(os.path.join("backend", "ridesync.db")):
    db_path = os.path.join("backend", "ridesync.db")

con = sqlite3.connect(db_path)
cur = con.cursor()

# 1. Update vehicles table
cols_v = [r[1] for r in cur.execute("PRAGMA table_info(vehicles)").fetchall()]
new_cols_v = [
    ("status", "VARCHAR(20) DEFAULT 'APPROVED' NOT NULL"),
    ("rejection_reason", "TEXT"),
    ("geofence_type", "VARCHAR(50) DEFAULT 'CIRCULAR' NOT NULL"),
    ("geofence_center_lat", "FLOAT"),
    ("geofence_center_lng", "FLOAT"),
    ("geofence_radius_km", "FLOAT DEFAULT 25.0"),
    ("geofence_center_name", "VARCHAR(255)"),
    ("current_latitude", "FLOAT"),
    ("current_longitude", "FLOAT"),
    ("speed_kmh", "FLOAT DEFAULT 0.0"),
    ("battery_or_fuel_level", "INTEGER DEFAULT 85"),
    ("last_location_update", "TIMESTAMP"),
    ("is_geofence_breached", "BOOLEAN DEFAULT 0 NOT NULL"),
    ("breach_distance_km", "FLOAT DEFAULT 0.0"),
]

for col_name, col_def in new_cols_v:
    if col_name not in cols_v:
        cur.execute(f"ALTER TABLE vehicles ADD COLUMN {col_name} {col_def}")
        print(f"Added {col_name} column to vehicles")

# Update existing vehicles status according to is_approved
try:
    cur.execute("UPDATE vehicles SET status = 'APPROVED' WHERE is_approved = 1 AND status = 'DRAFT'")
    cur.execute("UPDATE vehicles SET status = 'PENDING' WHERE is_approved = 0 AND status = 'DRAFT'")
except Exception:
    pass

# 2. Update bookings table for radius agreement
cols_b = [r[1] for r in cur.execute("PRAGMA table_info(bookings)").fetchall()]
new_cols_b = [
    ("permitted_radius_km", "FLOAT DEFAULT 25.0"),
    ("proposed_radius_km", "FLOAT"),
    ("radius_proposal_by", "VARCHAR(50)"),
    ("radius_proposal_status", "VARCHAR(50) DEFAULT 'NONE'"),
]
for col_name, col_def in new_cols_b:
    if col_name not in cols_b:
        cur.execute(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def}")
        print(f"Added {col_name} column to bookings")

# 3. Update vehicle_images table
cols_img = [r[1] for r in cur.execute("PRAGMA table_info(vehicle_images)").fetchall()]
if "angle" not in cols_img:
    cur.execute("ALTER TABLE vehicle_images ADD COLUMN angle VARCHAR(50)")
    print("Added angle column to vehicle_images")

# 4. Ensure location_pings table exists
cur.execute("""
CREATE TABLE IF NOT EXISTS location_pings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    booking_id INTEGER,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    speed_kmh FLOAT DEFAULT 0.0 NOT NULL,
    battery_or_fuel_level FLOAT DEFAULT 100.0 NOT NULL,
    is_geofence_breached BOOLEAN DEFAULT 0 NOT NULL,
    breach_distance_km FLOAT DEFAULT 0.0 NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE SET NULL
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS ix_location_pings_vehicle_id ON location_pings(vehicle_id)")
cur.execute("CREATE INDEX IF NOT EXISTS ix_location_pings_recorded_at ON location_pings(recorded_at)")

# 5. Ensure system_configs table exists
cur.execute("""
CREATE TABLE IF NOT EXISTS system_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP
)
""")

# 6. Stamp alembic version
cur.execute("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)")
cur.execute("DELETE FROM alembic_version")
cur.execute("INSERT INTO alembic_version (version_num) VALUES ('5c22039b57d0')")

con.commit()
con.close()
print(f"Database schema at '{db_path}' successfully synchronized!")
