import hashlib
import json
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.vehicle import Vehicle
from app.models.booking import Booking
from app.models.notification import Notification
from app.models.system_config import SystemConfig
from app.services.geofence_service import GeofenceService
from app.schemas.tracking import VehicleLocationResponse, VehicleTelemetryUpdate

class VehicleTrackingService:
    """
    Handles vehicle location ingestion, Wire Privacy coordinate fuzzer
    transformations, progressive accuracy calculations, and breach alerts.
    """

    DEFAULT_TRACKING_CONFIG = {
        "default_masking_buffer_km": 1.5,
        "gradient_near_threshold_km": 2.0,
        "gradient_near_accuracy_km": 0.5,
        "gradient_far_threshold_km": 5.0,
        "gradient_far_accuracy_km": 0.08,
        "gradient_sensitivity": 1.0,
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_tracking_config(self) -> Dict[str, Any]:
        """
        Retrieves active admin tracking & geofencing gradient parameters.
        """
        stmt = select(SystemConfig).filter(SystemConfig.key == "tracking_config")
        res = await self.db.execute(stmt)
        record = res.scalar_one_or_none()
        if record and record.value:
            try:
                cfg = json.loads(record.value)
                return {**self.DEFAULT_TRACKING_CONFIG, **cfg}
            except Exception:
                pass
        return dict(self.DEFAULT_TRACKING_CONFIG)

    async def update_tracking_config(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates platform-wide tracking & geofencing gradient parameters.
        """
        current = await self.get_tracking_config()
        for k, v in updates.items():
            if v is not None:
                current[k] = float(v)

        stmt = select(SystemConfig).filter(SystemConfig.key == "tracking_config")
        res = await self.db.execute(stmt)
        record = res.scalar_one_or_none()
        if not record:
            record = SystemConfig(
                key="tracking_config",
                value=json.dumps(current),
                description="Global location masking buffer and breach gradient sensitivity"
            )
            self.db.add(record)
        else:
            record.value = json.dumps(current)
            record.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        return current

    @classmethod
    def apply_wire_privacy_fuzzer(
        cls,
        raw_lat: float,
        raw_lng: float,
        accuracy_radius_m: float,
        seed_key: str
    ) -> tuple[float, float]:
        """
        Never expose exact coordinates in the client API response while a vehicle
        is within its normal geofenced area.

        Generates a deterministic spatial obfuscation offset proportional to the
        accuracy radius.
        """
        # When accuracy is under 70m (high precision breach mode), preserve near-direct pin
        if accuracy_radius_m <= 70.0:
            return round(raw_lat, 6), round(raw_lng, 6)

        # Deterministic pseudorandom angle & magnitude from seed
        h = int(hashlib.sha256(seed_key.encode("utf-8")).hexdigest()[:8], 16)
        angle_rad = (h % 360) * (math.pi / 180.0)
        # Shift between 40% and 75% of accuracy radius
        dist_m = accuracy_radius_m * (0.4 + ((h % 35) / 100.0))

        # 1 degree latitude ~ 111,000 meters
        delta_lat = (dist_m * math.cos(angle_rad)) / 111000.0
        # 1 degree longitude ~ 111,000 * cos(lat) meters
        lat_rad = math.radians(raw_lat)
        delta_lng = (dist_m * math.sin(angle_rad)) / (111000.0 * max(math.cos(lat_rad), 0.1))

        return round(raw_lat + delta_lat, 6), round(raw_lng + delta_lng, 6)

    async def get_vehicle_location_response(
        self,
        vehicle: Vehicle,
        config: Optional[Dict[str, Any]] = None
    ) -> VehicleLocationResponse:
        """
        Computes the privacy-preserved location payload with progressive accuracy.
        """
        if config is None:
            config = await self.get_tracking_config()

        # Fallback to pickup/center coords if telemetry not set yet
        raw_lat = vehicle.current_latitude or vehicle.geofence_center_lat or vehicle.latitude or 37.7749
        raw_lng = vehicle.current_longitude or vehicle.geofence_center_lng or vehicle.longitude or -122.4194

        center_lat = vehicle.geofence_center_lat or vehicle.latitude or raw_lat
        center_lng = vehicle.geofence_center_lng or vehicle.longitude or raw_lng
        radius_km = vehicle.geofence_radius_km or 25.0

        eval_res = GeofenceService.evaluate_geofence(
            vehicle_lat=raw_lat,
            vehicle_lng=raw_lng,
            geofence_type=vehicle.geofence_type,
            center_lat=center_lat,
            center_lng=center_lng,
            radius_km=radius_km,
            config=config
        )

        accuracy_radius_m = eval_res["accuracy_radius_m"]

        # Hour-bucketed seed key so coordinates are stable over short intervals
        now = datetime.now(timezone.utc)
        hour_bucket = now.strftime("%Y-%m-%d-%H")
        seed = f"v-{vehicle.id}-{hour_bucket}"

        fuzzed_lat, fuzzed_lng = self.apply_wire_privacy_fuzzer(
            raw_lat=raw_lat,
            raw_lng=raw_lng,
            accuracy_radius_m=accuracy_radius_m,
            seed_key=seed
        )

        # Check rental status
        active_booking_stmt = (
            select(Booking)
            .filter(
                Booking.vehicle_id == vehicle.id,
                Booking.status.in_(["RENTAL_ACTIVE", "CONFIRMED"])
            )
            .limit(1)
        )
        active_booking = (await self.db.execute(active_booking_stmt)).scalar_one_or_none()

        status_chip = eval_res["status_chip"]
        if not eval_res["is_breached"]:
            if active_booking:
                status_chip = f"Rented ({status_chip})"
            else:
                status_chip = f"Idle ({status_chip})"

        breach_severity = "SAFE"
        if eval_res["is_breached"]:
            breach_severity = "DISTANT_BREACH" if eval_res["breach_distance_km"] >= (config.get("gradient_far_threshold_km") or 5.0) else "NEAR_BREACH"

        last_upd = vehicle.last_location_update or vehicle.updated_at or now

        return VehicleLocationResponse(
            vehicle_id=vehicle.id,
            brand=vehicle.brand,
            model=vehicle.model,
            year=vehicle.year,
            pickup_location=vehicle.pickup_location,
            geofence_type=vehicle.geofence_type,
            geofence_center_lat=center_lat if vehicle.geofence_type == "CIRCULAR" else None,
            geofence_center_lng=center_lng if vehicle.geofence_type == "CIRCULAR" else None,
            geofence_radius_km=radius_km if vehicle.geofence_type == "CIRCULAR" else None,
            geofence_center_name=vehicle.geofence_center_name or vehicle.pickup_location,
            obfuscated_latitude=fuzzed_lat,
            obfuscated_longitude=fuzzed_lng,
            approx_latitude=fuzzed_lat,
            approx_longitude=fuzzed_lng,
            accuracy_radius_m=accuracy_radius_m,
            is_obfuscated=accuracy_radius_m > 70.0,
            speed_kmh=vehicle.speed_kmh or 0.0,
            battery_or_fuel_level=vehicle.battery_or_fuel_level or 85,
            last_location_update=last_upd,
            last_updated=last_upd,
            is_geofence_breached=eval_res["is_breached"],
            is_breached=eval_res["is_breached"],
            breach_distance_km=eval_res["breach_distance_km"],
            breach_severity=breach_severity,
            status_chip=status_chip,
            status_label=status_chip,
            is_active_rental=active_booking is not None,
            rental_status=active_booking.status if active_booking else "Idle"
        )

    async def get_owner_fleet(self, owner_id: int) -> List[VehicleLocationResponse]:
        """
        Returns real-time fleet map payloads for all vehicles belonging to the owner.
        """
        config = await self.get_tracking_config()
        stmt = select(Vehicle).filter(Vehicle.owner_id == owner_id).order_by(Vehicle.created_at.desc())
        res = await self.db.execute(stmt)
        vehicles = res.scalars().all()

        responses = []
        for v in vehicles:
            responses.append(await self.get_vehicle_location_response(v, config))
        return responses

    async def get_vehicle_location(self, vehicle_id: int, user_id: int) -> VehicleLocationResponse:
        """
        Returns location response for a vehicle if user is owner or active renter.
        """
        stmt = select(Vehicle).filter(Vehicle.id == vehicle_id)
        res = await self.db.execute(stmt)
        vehicle = res.scalar_one_or_none()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

        # Access check: owner or active renter
        is_owner = vehicle.owner_id == user_id
        if not is_owner:
            b_stmt = (
                select(Booking)
                .filter(
                    Booking.vehicle_id == vehicle_id,
                    Booking.renter_id == user_id,
                    Booking.status.in_(["RENTAL_ACTIVE", "CONFIRMED"])
                )
            )
            has_booking = (await self.db.execute(b_stmt)).scalar_one_or_none()
            if not has_booking:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access to vehicle telemetry is restricted to host and active renter."
                )

        return await self.get_vehicle_location_response(vehicle)

    async def simulate_movement(
        self,
        vehicle_id: int,
        user_id: int,
        target_state: str = "AUTO"
    ) -> VehicleLocationResponse:
        """
        Simulates vehicle coordinates transitioning through safe, near-breach,
        and distant breach states to demonstrate dynamic accuracy gradients.
        """
        stmt = select(Vehicle).filter(Vehicle.id == vehicle_id)
        res = await self.db.execute(stmt)
        vehicle = res.scalar_one_or_none()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

        center_lat = vehicle.geofence_center_lat or vehicle.latitude or 37.7749
        center_lng = vehicle.geofence_center_lng or vehicle.longitude or -122.4194
        radius_km = vehicle.geofence_radius_km or 25.0

        now = datetime.now(timezone.utc)
        prev_breached = vehicle.is_geofence_breached

        # Select target distance from center based on simulation request
        if target_state == "IN_BOUNDS":
            target_dist_km = radius_km * 0.4
            speed = 35.0
        elif target_state == "BREACH_NEAR":
            target_dist_km = radius_km + 1.5  # 1.5 km outside
            speed = 65.0
        elif target_state == "BREACH_FAR":
            target_dist_km = radius_km + 6.2  # 6.2 km outside
            speed = 88.0
        else:
            # AUTO cycle: in-bounds -> near breach -> far breach -> in-bounds
            if not prev_breached:
                target_dist_km = radius_km + 1.8
                speed = 60.0
            elif vehicle.breach_distance_km and vehicle.breach_distance_km < 3.0:
                target_dist_km = radius_km + 6.5
                speed = 85.0
            else:
                target_dist_km = radius_km * 0.5
                speed = 40.0

        # Calculate coordinates at angle ~ 45 degrees northeast
        angle_rad = math.radians(45.0 + (now.minute * 6.0))
        delta_lat = (target_dist_km * math.cos(angle_rad)) / 111.0
        delta_lng = (target_dist_km * math.sin(angle_rad)) / (111.0 * max(math.cos(math.radians(center_lat)), 0.1))

        vehicle.current_latitude = round(center_lat + delta_lat, 6)
        vehicle.current_longitude = round(center_lng + delta_lng, 6)
        vehicle.speed_kmh = speed
        vehicle.battery_or_fuel_level = max(10, (vehicle.battery_or_fuel_level or 85) - 2)
        vehicle.last_location_update = now

        config = await self.get_tracking_config()
        eval_res = GeofenceService.evaluate_geofence(
            vehicle_lat=vehicle.current_latitude,
            vehicle_lng=vehicle.current_longitude,
            geofence_type=vehicle.geofence_type,
            center_lat=center_lat,
            center_lng=center_lng,
            radius_km=radius_km,
            config=config
        )

        vehicle.is_geofence_breached = eval_res["is_breached"]
        vehicle.breach_distance_km = eval_res["breach_distance_km"]

        # Out-of-Bounds Notification to owner on new breach
        if vehicle.is_geofence_breached and not prev_breached:
            notif = Notification(
                user_id=vehicle.owner_id,
                title=f"⚠️ Out-of-Bounds Alert: {vehicle.brand} {vehicle.model}",
                message=(
                    f"Your vehicle has exited its designated operational zone by "
                    f"{eval_res['breach_distance_km']:.1f} km. Tracking precision has tightened to "
                    f"~{eval_res['accuracy_radius_m']:.0f}m."
                ),
                type="GEOFENCE_BREACH",
                link_url="/dashboard?tab=fleet-map"
            )
            self.db.add(notif)

        await self.db.commit()
        await self.db.refresh(vehicle)

        return await self.get_vehicle_location_response(vehicle, config)

    async def update_telemetry(
        self,
        vehicle_id: int,
        telemetry: VehicleTelemetryUpdate
    ) -> VehicleLocationResponse:
        """
        Receives raw GPS readings from simulated/actual tracking sources.
        """
        stmt = select(Vehicle).filter(Vehicle.id == vehicle_id)
        res = await self.db.execute(stmt)
        vehicle = res.scalar_one_or_none()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

        now = datetime.now(timezone.utc)
        prev_breached = vehicle.is_geofence_breached

        vehicle.current_latitude = telemetry.latitude
        vehicle.current_longitude = telemetry.longitude
        if telemetry.speed_kmh is not None:
            vehicle.speed_kmh = telemetry.speed_kmh
        if telemetry.battery_or_fuel_level is not None:
            vehicle.battery_or_fuel_level = telemetry.battery_or_fuel_level
        vehicle.last_location_update = now

        config = await self.get_tracking_config()
        center_lat = vehicle.geofence_center_lat or vehicle.latitude or telemetry.latitude
        center_lng = vehicle.geofence_center_lng or vehicle.longitude or telemetry.longitude
        radius_km = vehicle.geofence_radius_km or 25.0

        eval_res = GeofenceService.evaluate_geofence(
            vehicle_lat=vehicle.current_latitude,
            vehicle_lng=vehicle.current_longitude,
            geofence_type=vehicle.geofence_type,
            center_lat=center_lat,
            center_lng=center_lng,
            radius_km=radius_km,
            config=config
        )

        vehicle.is_geofence_breached = eval_res["is_breached"]
        vehicle.breach_distance_km = eval_res["breach_distance_km"]

        if vehicle.is_geofence_breached and not prev_breached:
            notif = Notification(
                user_id=vehicle.owner_id,
                title=f"⚠️ Out-of-Bounds Alert: {vehicle.brand} {vehicle.model}",
                message=(
                    f"Vehicle has crossed beyond its permitted perimeter by "
                    f"{eval_res['breach_distance_km']:.1f} km. Tracking resolution refined to "
                    f"~{eval_res['accuracy_radius_m']:.0f}m."
                ),
                type="GEOFENCE_BREACH",
                link_url="/dashboard?tab=fleet-map"
            )
            self.db.add(notif)

        await self.db.commit()
        await self.db.refresh(vehicle)

        return await self.get_vehicle_location_response(vehicle, config)
