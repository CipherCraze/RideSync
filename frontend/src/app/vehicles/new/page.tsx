"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function NewVehiclePage() {
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
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      if (selectedFiles.length > 10) {
        setError("You can only upload a maximum of 10 files.");
        e.target.value = "";
        setFiles([]);
        return;
      }
      
      for (const file of selectedFiles) {
        if (file.type.startsWith("image/") && file.size > 5 * 1024 * 1024) {
          setError(`Image ${file.name} exceeds the 5MB size limit.`);
          e.target.value = "";
          setFiles([]);
          return;
        }
        if (file.type.startsWith("video/") && file.size > 50 * 1024 * 1024) {
          setError(`Video ${file.name} exceeds the 50MB size limit.`);
          e.target.value = "";
          setFiles([]);
          return;
        }
      }
      
      setError("");
      setFiles(selectedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/vehicles/new");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        uploadedUrls = await apiService.uploadFiles(files);
      }
      
      const created = await apiService.createVehicle({
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
        images: uploadedUrls.length > 0 ? uploadedUrls : ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80"],
      });

      router.push(`/vehicles/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create vehicle listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link href="/my-vehicles" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Vehicles
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          List Your Vehicle
        </h1>
        <p className="text-xs text-gray-500">
          Reach thousands of verified community renters. Set your own terms and pricing.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-subtle space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Vehicle Brand / Make"
            placeholder="Tesla, BMW, Porsche..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
          <Input
            label="Model Name"
            placeholder="Model 3, M4, Taycan..."
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />
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
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Seats</label>
            <input
              type="number"
              min="1"
              max="20"
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Price Per Day ($ USD)</label>
            <input
              type="number"
              min="10"
              step="1"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 font-bold"
              required
            />
          </div>
        </div>

        <Input
          label="Pickup & Dropoff Location"
          placeholder="San Francisco International Airport (SFO), CA"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
            Vehicle Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Highlight unique features, cleaning standards, charging info, and guidelines..."
            className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            required
          />
        </div>

        {/* File Uploads */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase text-gray-700">
            Upload Photos & Videos
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {files.length > 0 && (
             <div className="text-xs text-gray-500">
               {files.length} file(s) selected
             </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/my-vehicles">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" isLoading={loading}>
            Publish Vehicle Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
