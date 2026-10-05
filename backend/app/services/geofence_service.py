import math
from typing import Dict, Any, Optional

class GeofenceService:
    """
    Evaluates coordinate distance against circular boundaries and calculates
    dynamic accuracy gradients according to platform privacy & safety rules.
    """

    EARTH_RADIUS_KM = 6371.0

    @classmethod
    def calculate_haversine_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculates great-circle distance between two points in kilometers.
        """
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return cls.EARTH_RADIUS_KM * c

    @classmethod
    def evaluate_geofence(
        cls,
        vehicle_lat: float,
        vehicle_lng: float,
        geofence_type: str,
        center_lat: Optional[float],
        center_lng: Optional[float],
        radius_km: Optional[float],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluates boundary state and computes progressive accuracy gradient.

        Precision resolution behavior:
        - If Flexible or In-Bounds: Coarse baseline (~1.0 - 2.0 km, default 1.5 km)
        - Near Breach (0 - 2 km outside): Intermediate resolution (~500 m)
        - Distant Breach (>5 km outside): High precision (~50 - 100 m or direct pin)
        """
        default_buffer_m = config.get("default_masking_buffer_km", 1.5) * 1000.0
        near_thresh_km = config.get("gradient_near_threshold_km", 2.0)
        near_acc_m = config.get("gradient_near_accuracy_km", 0.5) * 1000.0
        far_thresh_km = config.get("gradient_far_threshold_km", 5.0)
        far_acc_m = config.get("gradient_far_accuracy_km", 0.08) * 1000.0
        sensitivity = config.get("gradient_sensitivity", 1.0)

        # 1. Flexible Geofence: No fixed perimeter lock
        if geofence_type == "FLEXIBLE" or center_lat is None or center_lng is None or radius_km is None:
            return {
                "is_breached": False,
                "breach_distance_km": 0.0,
                "distance_from_center_km": 0.0,
                "accuracy_radius_m": default_buffer_m,
                "status_chip": "Flexible Zone (In-Bounds)"
            }

        # 2. Circular Geofence evaluation
        distance_from_center = cls.calculate_haversine_distance(
            vehicle_lat, vehicle_lng, center_lat, center_lng
        )

        if distance_from_center <= radius_km:
            # Inside safe perimeter
            return {
                "is_breached": False,
                "breach_distance_km": 0.0,
                "distance_from_center_km": round(distance_from_center, 2),
                "accuracy_radius_m": default_buffer_m,
                "status_chip": "Inside Safe Zone"
            }

        # 3. Breach State: Vehicle is outside the allowed perimeter
        breach_distance = distance_from_center - radius_km
        effective_breach = breach_distance * sensitivity

        if effective_breach <= near_thresh_km:
            # Near breach: interpolate between default buffer and near_acc_m (~500m)
            ratio = effective_breach / max(near_thresh_km, 0.001)
            accuracy_m = default_buffer_m - ratio * (default_buffer_m - near_acc_m)
            chip = f"Geofence Breached (+{breach_distance:.1f} km)"
        elif effective_breach <= far_thresh_km:
            # Intermediate breach: interpolate between near_acc_m (~500m) and far_acc_m (~80m)
            ratio = (effective_breach - near_thresh_km) / max((far_thresh_km - near_thresh_km), 0.001)
            accuracy_m = near_acc_m - ratio * (near_acc_m - far_acc_m)
            chip = f"Critical Breach (+{breach_distance:.1f} km)"
        else:
            # Distant breach: high precision recovery mode (~50 - 100m)
            accuracy_m = max(far_acc_m, 50.0)
            chip = f"Severe Out-of-Bounds (+{breach_distance:.1f} km)"

        return {
            "is_breached": True,
            "breach_distance_km": round(breach_distance, 2),
            "distance_from_center_km": round(distance_from_center, 2),
            "accuracy_radius_m": round(accuracy_m, 1),
            "status_chip": chip
        }
