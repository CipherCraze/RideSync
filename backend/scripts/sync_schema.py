import sqlite3

con = sqlite3.connect("ridesync.db")
cur = con.cursor()

# 1. Update vehicles table
cols_v = [r[1] for r in cur.execute("PRAGMA table_info(vehicles)").fetchall()]
if "status" not in cols_v:
    cur.execute("ALTER TABLE vehicles ADD COLUMN status VARCHAR(20) DEFAULT 'APPROVED' NOT NULL")
    print("Added status column to vehicles")
if "rejection_reason" not in cols_v:
    cur.execute("ALTER TABLE vehicles ADD COLUMN rejection_reason TEXT")
    print("Added rejection_reason column to vehicles")

# Update existing vehicles status according to is_approved
cur.execute("UPDATE vehicles SET status = 'APPROVED' WHERE is_approved = 1")
cur.execute("UPDATE vehicles SET status = 'PENDING' WHERE is_approved = 0")

# 2. Update vehicle_images table
cols_img = [r[1] for r in cur.execute("PRAGMA table_info(vehicle_images)").fetchall()]
if "angle" not in cols_img:
    cur.execute("ALTER TABLE vehicle_images ADD COLUMN angle VARCHAR(50)")
    print("Added angle column to vehicle_images")

# 3. Stamp alembic version
cur.execute("DELETE FROM alembic_version")
cur.execute("INSERT INTO alembic_version (version_num) VALUES ('5c22039b57d0')")

con.commit()
con.close()
print("Database schema successfully synchronized with Alembic revision 5c22039b57d0!")
