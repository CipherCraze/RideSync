"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Compass,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Navigation,
  Car,
  Layers,
  Gauge,
  BatteryCharging,
  Clock,
  Radio,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { VehicleTrackingInfo } from "@/types";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface FleetMapViewProps {
  initialVehicles?: VehicleTrackingInfo[];
  onRefresh?: () => void;
}

export function FleetMapView({ initialVehicles, onRefresh }: FleetMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});

  const [fleet, setFleet] = useState<VehicleTrackingInfo[]>(initialVehicles || []);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(!initialVehicles);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const fetchFleet = async () => {
    try {
      const data = await apiService.getMyFleetTracking();
      setFleet(data);
      if (data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].vehicle_id);
      }
    } catch (err) {
      console.error("Failed to load fleet tracking", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialVehicles) {
      fetchFleet();
    } else {
      setFleet(initialVehicles);
      if (initialVehicles.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(initialVehicles[0].vehicle_id);
      }
    }
  }, [initialVehicles]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet on client side
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([37.7749, -122.4194], 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      renderVehicleLayers(L, fleet);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map overlays whenever fleet data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      renderVehicleLayers(L, fleet);
    });
  }, [fleet, selectedVehicleId]);

  const renderVehicleLayers = (L: any, vehicles: VehicleTrackingInfo[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing vehicle layers
    Object.values(layersRef.current).forEach((layer: any) => {
      map.removeLayer(layer);
    });
    layersRef.current = {};

    if (vehicles.length === 0) return;

    const bounds: any[] = [];

    vehicles.forEach((v) => {
      const isSelected = v.vehicle_id === selectedVehicleId;
      const isBreached = v.is_breached;

      // 1. Designated Circular Geofence Boundary (if CIRCULAR)
      if (v.geofence_type === "CIRCULAR" && v.geofence_center_lat && v.geofence_center_lng && v.geofence_radius_km) {
        const fenceCircle = L.circle([v.geofence_center_lat, v.geofence_center_lng], {
          radius: v.geofence_radius_km * 1000,
          color: isBreached ? "#ef4444" : "#2563eb",
          weight: 2,
          dashArray: "6, 8",
          fillColor: isBreached ? "#fee2e2" : "#dbeafe",
          fillOpacity: 0.12,
        }).addTo(map);

        fenceCircle.bindTooltip(
          `<strong>${v.brand} ${v.model}</strong>: Geofence Safe Zone (${v.geofence_radius_km} km radius)`,
          { sticky: true }
        );

        layersRef.current[`fence_${v.vehicle_id}`] = fenceCircle;
        bounds.push([v.geofence_center_lat, v.geofence_center_lng]);
      }

      // 2. Current Approximate Location Uncertainty Radius (dynamically sized based on accuracy_radius_m)
      const bufferColor = isBreached
        ? v.breach_severity === "DISTANT_BREACH"
          ? "#dc2626"
          : "#ea580c"
        : "#10b981";

      const accuracyCircle = L.circle([v.approx_latitude, v.approx_longitude], {
        radius: v.accuracy_radius_m,
        color: bufferColor,
        weight: isSelected ? 3 : 1.5,
        fillColor: bufferColor,
        fillOpacity: isBreached ? 0.25 : 0.18,
      }).addTo(map);

      layersRef.current[`acc_${v.vehicle_id}`] = accuracyCircle;

      // 3. Center Vehicle Marker Pin
      const markerHtml = `
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${isBreached ? "#dc2626" : "#2563eb"};
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
          transform: translate(-50%, -50%);
          ${isSelected ? "ring: 3px solid #3b82f6;" : ""}
        ">
          🚗
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-car-pin",
        iconSize: [34, 34],
      });

      const marker = L.marker([v.approx_latitude, v.approx_longitude], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 200px; padding: 2px;">
          <div style="font-weight: 800; font-size: 14px; color: #111827; margin-bottom: 2px;">
            ${v.brand} ${v.model} (${v.year})
          </div>
          <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; margin-bottom: 8px; background: ${
            isBreached ? "#fee2e2" : "#dcfce7"
          }; color: ${isBreached ? "#991b1b" : "#166534"};">
            ${v.status_label}
          </div>
          <div style="font-size: 11px; color: #4b5563; line-height: 1.5;">
            <div><strong>Accuracy Buffer:</strong> ±${Math.round(v.accuracy_radius_m)}m (${v.is_obfuscated ? "Wire Privacy Masked" : "Direct GPS Pin"})</div>
            <div><strong>Speed:</strong> ${v.speed_kmh} km/h</div>
            <div><strong>Battery / Fuel:</strong> ${v.battery_or_fuel_level ? `${v.battery_or_fuel_level}%` : "N/A"}</div>
            <div><strong>Rental Status:</strong> ${v.rental_status}</div>
            ${
              isBreached
                ? `<div style="color: #b91c1c; font-weight: bold; margin-top: 4px;">⚠️ Exceeded boundary by ${v.breach_distance_km.toFixed(1)} km!</div>`
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        setSelectedVehicleId(v.vehicle_id);
      });

      layersRef.current[`marker_${v.vehicle_id}`] = marker;
      bounds.push([v.approx_latitude, v.approx_longitude]);
    });

    if (bounds.length > 0 && !selectedVehicleId) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      } catch (e) {
        // Fallback
      }
    }
  };

  const handleSelectVehicle = (vehicle: VehicleTrackingInfo) => {
    setSelectedVehicleId(vehicle.vehicle_id);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([vehicle.approx_latitude, vehicle.approx_longitude], 13, { duration: 1 });
      const marker = layersRef.current[`marker_${vehicle.vehicle_id}`];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleSimulate = async (
    targetState: "IN_BOUNDS" | "NEAR_BREACH" | "DISTANT_BREACH" | "RESET"
  ) => {
    if (!selectedVehicleId) return;

    setSimulating(true);
    setStatusMessage("");

    try {
      const updated = await apiService.simulateVehicleMovement(selectedVehicleId, targetState);
      
      // Update local fleet state
      setFleet((prev) =>
        prev.map((v) => (v.vehicle_id === updated.vehicle_id ? updated : v))
      );

      const targetLabel =
        targetState === "IN_BOUNDS"
          ? "Vehicle returned within safe zone. Privacy masking re-enabled (~1.5 km buffer)."
          : targetState === "NEAR_BREACH"
          ? "Near breach simulated (1.2 km outside). Resolution tightened to ~500m."
          : targetState === "DISTANT_BREACH"
          ? "Distant breach simulated (6.0 km outside). Resolution refined to ~65m high precision!"
          : "Vehicle reset to home operational coordinates.";

      setStatusMessage(targetLabel);

      // Pan to new vehicle location
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(
          [updated.approx_latitude, updated.approx_longitude],
          targetState === "DISTANT_BREACH" ? 14 : 12,
          { duration: 0.8 }
        );
      }

      if (onRefresh) onRefresh();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.detail || "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  };

  const selectedVehicle = fleet.find((v) => v.vehicle_id === selectedVehicleId) || fleet[0];
  const breachedVehicles = fleet.filter((v) => v.is_breached);

  return (
    <div className="space-y-6">
      {/* Out-of-Bounds Active Alert Banner */}
      {breachedVehicles.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                🚨 Out-of-Bounds Security Alert
              </span>
              <p className="text-sm font-extrabold">
                {breachedVehicles.length} {breachedVehicles.length === 1 ? "vehicle has" : "vehicles have"} crossed outside their permitted geofence perimeter!
              </p>
              <p className="text-xs text-rose-700">
                Tracking precision has automatically escalated to assist fleet safety & vehicle recovery.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {breachedVehicles.map((bv) => (
              <Button
                key={bv.vehicle_id}
                size="sm"
                onClick={() => handleSelectVehicle(bv)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Track {bv.model} (+{bv.breach_distance_km.toFixed(1)} km)
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Map & Fleet Control Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Map Container */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-gray-200/90 shadow-card bg-gray-100">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-[540px] z-10" />

            {/* Map HUD Overlay: Legend */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-gray-200/80 shadow-md text-xs space-y-1.5 pointer-events-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Gradient Accuracy Key
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-600 inline-block" />
                <span>Safe Zone Buffer (~1.5 km masked)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-700">
                <span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-600 inline-block" />
                <span>Near Breach Resolution (~500 m)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-700">
                <span className="w-3 h-3 rounded-full bg-rose-600/40 border border-rose-700 inline-block" />
                <span>Distant Breach High-Precision (~65 m)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-blue-700 pt-0.5 border-t border-gray-100">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-600 inline-block" />
                <span>Designated Circular Geofence</span>
              </div>
            </div>

            {/* Map HUD Overlay: Active Vehicle Badge */}
            {selectedVehicle && (
              <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200/80 shadow-md max-w-sm pointer-events-auto">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <span className="text-xs font-extrabold text-gray-900">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedVehicle.is_breached
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {selectedVehicle.status_label}
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 space-y-0.5">
                  <div>Operating Boundary: <strong>{selectedVehicle.geofence_type === "CIRCULAR" ? `${selectedVehicle.geofence_radius_km} km radius` : "Flexible"}</strong></div>
                  <div>Current Precision Radius: <strong className="text-blue-600">±{Math.round(selectedVehicle.accuracy_radius_m)}m</strong></div>
                  <div className="text-gray-400 text-[10px] flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> Updated: {new Date(selectedVehicle.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Simulation Panel */}
          {selectedVehicle && (
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                    GPS Telemetry & Gradient Simulator ({selectedVehicle.brand} {selectedVehicle.model})
                  </h4>
                  <p className="text-xs text-gray-500">
                    Trigger simulated coordinates to test live gradient privacy shifting without hardware.
                  </p>
                </div>
                {statusMessage && (
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                    {statusMessage}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={simulating}
                  onClick={() => handleSimulate("IN_BOUNDS")}
                  className="text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  In-Bounds (1.5 km)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={simulating}
                  onClick={() => handleSimulate("NEAR_BREACH")}
                  className="text-xs text-amber-700 hover:bg-amber-50 border-amber-200"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Near Breach (~500m)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={simulating}
                  onClick={() => handleSimulate("DISTANT_BREACH")}
                  className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <Navigation className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  Distant Breach (~65m)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={simulating}
                  onClick={() => handleSimulate("RESET")}
                  className="text-xs text-gray-700 hover:bg-gray-100"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reset Base
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Fleet Vehicles List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              Host Fleet ({fleet.length})
            </h3>
            <button
              onClick={fetchFleet}
              className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {fleet.map((v) => {
              const isSelected = v.vehicle_id === selectedVehicleId;
              return (
                <div
                  key={v.vehicle_id}
                  onClick={() => handleSelectVehicle(v)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/40 shadow-sm"
                      : "border-gray-200/80 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900">
                        {v.brand} {v.model}
                      </h4>
                      <span className="text-[10px] text-gray-500">{v.year} • {v.rental_status}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        v.is_breached
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {v.status_label}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Boundary:</span>
                      <span className="font-semibold text-gray-800">
                        {v.geofence_type === "CIRCULAR" ? `${v.geofence_radius_km} km radius` : "Flexible"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Precision:</span>
                      <span className="font-semibold text-blue-600">
                        ±{Math.round(v.accuracy_radius_m)}m
                      </span>
                    </div>

                    {v.is_breached && (
                      <div className="text-[11px] font-bold text-rose-600 pt-1 border-t border-rose-100 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Breached by {v.breach_distance_km.toFixed(1)} km!
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-gray-500" /> {v.speed_kmh} km/h
                    </span>
                    {v.battery_or_fuel_level !== null && (
                      <span className="flex items-center gap-1">
                        <BatteryCharging className="w-3 h-3 text-emerald-600" /> {v.battery_or_fuel_level}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
