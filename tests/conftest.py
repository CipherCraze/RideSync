import os
import sys
import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import AsyncClient, ASGITransport

from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.main import app
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.booking import Booking

TEST_DB_FILE = "./test_ridesync.db"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

@pytest_asyncio.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def test_data(db_session: AsyncSession):
    # Check if already seeded
    existing_user = await db_session.get(User, 1)
    if existing_user:
        return

    now = datetime.now(timezone.utc)

    # 1. Users using standard valid email domains
    user1 = User(
        id=1,
        email="owner1@ridesync.com",
        full_name="Alice Owner",
        hashed_password=get_password_hash("password123"),
        honor_score=100,
        is_verified=True,
        is_admin=False,
    )
    user2 = User(
        id=2,
        email="renter2@ridesync.com",
        full_name="Bob Renter",
        hashed_password=get_password_hash("password123"),
        honor_score=100,
        is_verified=True,
        is_admin=False,
    )
    user3 = User(
        id=3,
        email="outsider3@ridesync.com",
        full_name="Charlie Outsider",
        hashed_password=get_password_hash("password123"),
        honor_score=100,
        is_verified=False,
        is_admin=False,
    )
    admin = User(
        id=4,
        email="admin@ridesync.com",
        full_name="Admin Director",
        hashed_password=get_password_hash("admin123"),
        honor_score=100,
        is_verified=True,
        is_admin=True,
    )
    db_session.add_all([user1, user2, user3, admin])
    await db_session.commit()

    # 2. Vehicle
    vehicle = Vehicle(
        id=1,
        owner_id=user1.id,
        brand="Tesla",
        model="Model Y",
        year=2024,
        vehicle_type="Electric",
        fuel_type="Electric",
        transmission="Automatic",
        seats=5,
        price_per_day=90.0,
        description="Pristine EV",
        pickup_location="Downtown Test",
        is_approved=True,
        is_available=True,
    )
    db_session.add(vehicle)
    await db_session.commit()

    # 3. Completed Booking (User 2 renting from User 1)
    completed_b = Booking(
        id=1,
        renter_id=user2.id,
        vehicle_id=vehicle.id,
        owner_id=user1.id,
        start_date=now - timedelta(days=5),
        end_date=now - timedelta(days=2),
        total_price=270.0,
        status="COMPLETED",
        payment_status="PAID",
    )
    # 4. Pending Booking
    pending_b = Booking(
        id=2,
        renter_id=user2.id,
        vehicle_id=vehicle.id,
        owner_id=user1.id,
        start_date=now + timedelta(days=2),
        end_date=now + timedelta(days=5),
        total_price=270.0,
        status="PENDING",
        payment_status="PENDING",
    )
    # 5. Completed Booking 2 for Reports test
    completed_b2 = Booking(
        id=3,
        renter_id=user2.id,
        vehicle_id=vehicle.id,
        owner_id=user1.id,
        start_date=now - timedelta(days=8),
        end_date=now - timedelta(days=6),
        total_price=180.0,
        status="COMPLETED",
        payment_status="PAID",
    )
    db_session.add_all([completed_b, pending_b, completed_b2])
    await db_session.commit()

@pytest.fixture
def auth_headers_user1(test_data):
    token = create_access_token(1)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_user2(test_data):
    token = create_access_token(2)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_user3(test_data):
    token = create_access_token(3)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_admin(test_data):
    token = create_access_token(4)
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
