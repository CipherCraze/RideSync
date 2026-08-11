"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const vehicleId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { user } = useAuth();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2024);
  const [vehicleType, setVehicleType] = useState("Sedan");
  const [fuelType, setFuelType] = useState("Petrol");
  const [transmission, setTransmission] = useState("Automatic");
  const [seats, setSeats] = useState(5);
  const [pricePerDay, setPricePerDay] = useState(75);
  const [description, setDescription] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiService
      .getVehicle(vehicleId)
      .then((v) => {
        setBrand(v.brand);
        setModel(v.model);
        setYear(v.year);
        setVehicleType(v.vehicle_type);
        setFuelType(v.fuel_type);
        setTransmission(v.transmission);
        setSeats(v.seats);
        setPricePerDay(v.price_per_day);
        setDescription(v.description);
        setPickupLocation(v.pickup_location);
        setIsAvailable(v.is_available);
        setImageUrls(v.images.map((img) => img.image_url));
      })
      .catch((err) => setError("Vehicle not found."))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const handleAddImageField = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const handleImageChange = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const validImages = imageUrls.filter((url) => url.trim().length > 0);
      await apiService.updateVehicle(vehicleId, {
        brand,
        model,
        year: Number(year),
        vehicle_type: vehicleType,
        fuel_type: fuelType,
        transmission,
        seats: Number(seats),
        price_per_day: Number(pricePerDay),
        description,
        pickup_location: pickupLocation,
        is_available: isAvailable,
        images: validImages.length > 0 ? validImages : undefined,
      });

      router.push(`/vehicles/${vehicleId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update vehicle listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto p-8 text-center text-xs text-gray-500">Loading details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link href="/my-vehicles" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Vehicles
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Edit Listing: {brand} {model}
        </h1>
        <p className="text-xs text-gray-500">Update rates, availability, specs, and photos.</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Vehicle Brand / Make" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          <Input label="Model Name" value={model} onChange={(e) => setModel(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Year</label>
            <input
              type="number"
              min="1990"
              max="2027"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Convertible">Convertible</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Electric">Electric</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Fuel Type</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Transmission</label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Price Per Day ($ USD)</label>
            <input
              type="number"
              min="10"
              step="1"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 font-bold focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Listing Availability Status</label>
            <select
              value={isAvailable ? "true" : "false"}
              onChange={(e) => setIsAvailable(e.target.value === "true")}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="true">Active & Rentable</option>
              <option value="false">Paused / Unavailable</option>
            </select>
          </div>
        </div>

        <Input
          label="Pickup Location"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            required
          />
        </div>

        {/* Images */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase text-gray-700">Photo Image URLs</label>
            <button
              type="button"
              onClick={handleAddImageField}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Image URL
            </button>
          </div>

          {imageUrls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageChange(idx, e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/my-vehicles">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" isLoading={submitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
