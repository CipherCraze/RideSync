"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Upload,
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Camera,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { VehicleAngle } from "@/types";

interface AngleSlot {
  angle: VehicleAngle;
  label: string;
  description: string;
  file: File | null;
  previewUrl: string | null;
}

export default function NewVehiclePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Basic Details
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

  // Multi-Angle Photos
  const [photoSlots, setPhotoSlots] = useState<AngleSlot[]>([
    { angle: "FRONT", label: "Front View", description: "Front face with number plate visible", file: null, previewUrl: null },
    { angle: "REAR", label: "Rear View", description: "Rear face and trunk view", file: null, previewUrl: null },
    { angle: "SIDE_LEFT", label: "Left Profile", description: "Full side profile showing driver doors", file: null, previewUrl: null },
    { angle: "SIDE_RIGHT", label: "Right Profile", description: "Full passenger side profile", file: null, previewUrl: null },
    { angle: "INTERIOR", label: "Interior & Cockpit", description: "Steering wheel, seats, and odometer", file: null, previewUrl: null },
  ]);

  // Documents
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [rcNumber, setRcNumber] = useState("");

  const [pucFile, setPucFile] = useState<File | null>(null);
  const [pucNumber, setPucNumber] = useState("");
  const [pucExpiryDate, setPucExpiryDate] = useState("");

  const [serviceFile, setServiceFile] = useState<File | null>(null);
  const [serviceRecordNotes, setServiceRecordNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAngleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPEG, PNG, WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image exceeds 5MB size limit.`);
        return;
      }
      setError("");
      const previewUrl = URL.createObjectURL(file);
      setPhotoSlots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], file, previewUrl };
        return next;
      });
    }
  };

  const removeAngleFile = (index: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], file: null, previewUrl: null };
      return next;
    });
  };

  const validateCompliance = () => {
    if (pucExpiryDate) {
      const expDate = new Date(pucExpiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate <= today) {
        setError("PUC certificate has expired! Please provide a certificate with a future expiry date.");
        return false;
      }
    }
    return true;
  };

  const handleFormSubmit = async (targetStatus: "DRAFT" | "PENDING") => {
    if (!user) {
      router.push("/login?redirect=/vehicles/new");
      return;
    }

    if (!brand.trim() || !model.trim() || !pickupLocation.trim()) {
      setError("Please fill out brand, model, and pickup location.");
      return;
    }

    if (targetStatus === "PENDING") {
      const uploadedPhotos = photoSlots.filter((s) => s.file !== null);
      if (uploadedPhotos.length < 2) {
        setError("Please upload at least 2 vehicle photos (Front and Interior recommended) before submitting for verification.");
        return;
      }
      if (!rcFile && !rcNumber.trim()) {
        setError("Please provide Registration Certificate (RC) details or file for verification.");
        return;
      }
      if (!validateCompliance()) {
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // 1. Upload multi-angle images
      const imagesPayload: { image_url: string; angle: VehicleAngle; is_primary: boolean }[] = [];
      for (const slot of photoSlots) {
        if (slot.file) {
          const uploadedUrl = await apiService.uploadDocument(slot.file);
          imagesPayload.push({
            image_url: uploadedUrl.url,
            angle: slot.angle,
            is_primary: slot.angle === "FRONT",
          });
        }
      }

      // Fallback placeholder image if draft has no photos
      if (imagesPayload.length === 0) {
        imagesPayload.push({
          image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80",
          angle: "FRONT",
          is_primary: true,
        });
      }

      // 2. Create vehicle
      const created = await apiService.createVehicle({
        brand,
        model,
        year: Number(year),
        vehicle_type: vehicleType,
        fuel_type: fuelType,
        transmission,
        seats: Number(seats),
        price_per_day: Number(pricePerDay),
        description: description || `${year} ${brand} ${model} available for rent on RideSync.`,
        pickup_location: pickupLocation,
        status: targetStatus,
        images: imagesPayload,
      });

      // 3. Upload and attach documents
      if (rcFile) {
        const rcUpload = await apiService.uploadDocument(rcFile);
        await apiService.addVehicleDocument(created.id, {
          document_type: "RC",
          document_url: rcUpload.url,
          document_number: rcNumber || undefined,
        });
      } else if (rcNumber.trim()) {
        await apiService.addVehicleDocument(created.id, {
          document_type: "RC",
          document_url: "http://localhost:8000/uploads/documents/sample_rc.pdf",
          document_number: rcNumber,
        });
      }

      if (pucFile) {
        const pucUpload = await apiService.uploadDocument(pucFile);
        await apiService.addVehicleDocument(created.id, {
          document_type: "PUC",
          document_url: pucUpload.url,
          document_number: pucNumber || undefined,
          expiry_date: pucExpiryDate ? new Date(pucExpiryDate).toISOString() : undefined,
        });
      } else if (pucExpiryDate) {
        await apiService.addVehicleDocument(created.id, {
          document_type: "PUC",
          document_url: "http://localhost:8000/uploads/documents/sample_puc.pdf",
          document_number: pucNumber || "PUC-VERIFIED",
          expiry_date: new Date(pucExpiryDate).toISOString(),
        });
      }

      if (serviceFile) {
        const serviceUpload = await apiService.uploadDocument(serviceFile);
        await apiService.addVehicleDocument(created.id, {
          document_type: "SERVICE_RECORD",
          document_url: serviceUpload.url,
          document_number: serviceRecordNotes || "Recent Service Log",
        });
      }

      router.push(`/vehicles/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create vehicle listing. Please review the inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <Link
        href="/my-vehicles"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Fleet Manager
      </Link>

      <div className="border-b border-gray-100 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Car className="w-6 h-6" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            List Your Vehicle
          </h1>
        </div>
        <p className="text-xs text-gray-500 max-w-2xl">
          List your vehicle on RideSync's verified peer-to-peer marketplace. Submit multi-angle photos
          and compliance documents (RC, PUC) to achieve <strong>Verified Host</strong> standing.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
        {/* Section 1: Specifications */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Vehicle Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Make / Brand" placeholder="e.g. Tesla, BMW, Toyota" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            <Input label="Model" placeholder="e.g. Model 3, M4, RAV4" value={model} onChange={(e) => setModel(e.target.value)} required />
            <Input label="Year" type="number" min={1990} max={2027} value={year} onChange={(e) => setYear(Number(e.target.value))} required />
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Vehicle Type</label>
              <select
                className="w-full text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-600 focus:bg-white"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                {["Sedan", "SUV", "Hatchback", "Convertible", "Truck", "Van", "Electric", "Luxury"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Fuel Type</label>
              <select
                className="w-full text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-600 focus:bg-white"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
              >
                {["Petrol", "Diesel", "Electric", "Hybrid"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Transmission</label>
              <select
                className="w-full text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-600 focus:bg-white"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
              >
                {["Automatic", "Manual"].map((tr) => (
                  <option key={tr} value={tr}>{tr}</option>
                ))}
              </select>
            </div>

            <Input label="Seating Capacity" type="number" min={1} max={20} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required />
            <Input label="Daily Rental Rate ($ USD)" type="number" min={10} value={pricePerDay} onChange={(e) => setPricePerDay(Number(e.target.value))} required />
          </div>

          <div className="space-y-4">
            <Input label="Pickup / Return Location" placeholder="e.g. San Francisco Airport (SFO), CA or Street Address" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required />
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Description & Rental Rules</label>
              <textarea
                className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-600 focus:bg-white min-h-[90px]"
                placeholder="Highlight vehicle features, accessories, charging instructions, or guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Multi-Angle Photos */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Multi-Angle Vehicle Photography
            </h2>
            <span className="text-[11px] text-gray-400 font-medium">JPEG, PNG, WEBP (Max 5MB each)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoSlots.map((slot, idx) => (
              <div
                key={slot.angle}
                className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 flex flex-col justify-between space-y-3 relative hover:border-blue-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      {slot.label}
                    </span>
                    {slot.angle === "FRONT" && (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Primary</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{slot.description}</p>
                </div>

                {slot.previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 border border-gray-200">
                    <img src={slot.previewUrl} alt={slot.label} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAngleFile(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-white hover:border-blue-400 transition-all text-center">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[11px] font-semibold text-blue-600">Upload {slot.label}</span>
                    <span className="text-[10px] text-gray-400">Click to browse file</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAngleFileChange(idx, e)}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Compliance & Legal Documents */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              Compliance & Legal Verification
            </h2>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified by RideSync Admins
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RC Card */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <FileText className="w-4 h-4 text-blue-600" />
                Registration Certificate (RC)
                <span className="text-rose-500">*</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Upload your official vehicle registration smartcard or document (PDF or Photo).
              </p>
              <Input
                label="Registration Number"
                placeholder="e.g. DL-01-AB-1234 or CA-99214"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
              />
              <div className="pt-1">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setRcFile(e.target.files?.[0] || null)}
                  className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {rcFile && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selected: {rcFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* PUC Card */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Pollution Under Control (PUC)
                <span className="text-rose-500">*</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Must be an active emission certificate with a valid future expiry date.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  label="PUC Certificate #"
                  placeholder="e.g. PUC-88219"
                  value={pucNumber}
                  onChange={(e) => setPucNumber(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" /> Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={pucExpiryDate}
                    onChange={(e) => setPucExpiryDate(e.target.value)}
                    className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="pt-1">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setPucFile(e.target.files?.[0] || null)}
                  className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {pucFile && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selected: {pucFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Service Record Card */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <FileText className="w-4 h-4 text-purple-600" />
                Latest Service Record / Maintenance Log (Optional)
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Verified maintenance logs reassure renters and fast-track administrative approval.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <Input
                  label="Service Summary / Mileage"
                  placeholder="e.g. Authorized Dealer 30,000 km periodic service"
                  value={serviceRecordNotes}
                  onChange={(e) => setServiceRecordNotes(e.target.value)}
                />
                <div>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setServiceFile(e.target.files?.[0] || null)}
                    className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                  {serviceFile && (
                    <p className="text-[11px] text-purple-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selected: {serviceFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleFormSubmit("DRAFT")}
            className="w-full sm:w-auto"
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => handleFormSubmit("PENDING")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Processing..." : "Submit for Verification & Approval"}
          </Button>
        </div>
      </form>
    </div>
  );
}
