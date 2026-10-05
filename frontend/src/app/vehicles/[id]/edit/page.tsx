"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { VehicleDetail, VehicleDocument, VehicleAngle } from "@/types";

interface AngleSlot {
  angle: VehicleAngle;
  label: string;
  description: string;
  file: File | null;
  previewUrl: string | null;
  existingUrl?: string | null;
}

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const vehicleId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [existingDocs, setExistingDocs] = useState<VehicleDocument[]>([]);

  // Specs
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

  // Photo slots
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

  useEffect(() => {
    if (!vehicleId) return;

    setLoading(true);
    Promise.all([
      apiService.getVehicle(vehicleId),
      apiService.getVehicleDocuments(vehicleId).catch(() => [] as VehicleDocument[]),
    ])
      .then(([vData, docsData]) => {
        setVehicle(vData);
        setExistingDocs(docsData);

        // Prepopulate specs
        setBrand(vData.brand);
        setModel(vData.model);
        setYear(vData.year);
        setVehicleType(vData.vehicle_type);
        setFuelType(vData.fuel_type);
        setTransmission(vData.transmission);
        setSeats(vData.seats);
        setPricePerDay(vData.price_per_day);
        setDescription(vData.description);
        setPickupLocation(vData.pickup_location);

        // Prepopulate photos
        setPhotoSlots((slots) =>
          slots.map((slot) => {
            const matchedImg = vData.images.find(
              (img) => img.angle?.toUpperCase() === slot.angle.toUpperCase()
            );
            return {
              ...slot,
              existingUrl: matchedImg?.image_url || null,
              previewUrl: matchedImg?.image_url || null,
            };
          })
        );

        // Prepopulate documents
        const rc = docsData.find((d) => d.document_type === "RC");
        if (rc) {
          setRcNumber(rc.document_number || "");
        }

        const puc = docsData.find((d) => d.document_type === "PUC");
        if (puc) {
          setPucNumber(puc.document_number || "");
          if (puc.expiry_date) {
            setPucExpiryDate(new Date(puc.expiry_date).toISOString().split("T")[0]);
          }
        }

        const service = docsData.find((d) => d.document_type === "SERVICE_RECORD");
        if (service) {
          setServiceRecordNotes(service.document_number || "");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load vehicle details. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const handleAngleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPEG, PNG, WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image exceeds 5MB size limit.");
        return;
      }
      setError("");
      const previewUrl = URL.createObjectURL(file);
      setPhotoSlots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], file, previewUrl, existingUrl: null };
        return next;
      });
    }
  };

  const removeAngleFile = (index: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], file: null, previewUrl: null, existingUrl: null };
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

  const handleUpdate = async (targetStatus: "KEEP" | "SUBMIT_FOR_REVIEW") => {
    if (!brand.trim() || !model.trim() || !pickupLocation.trim()) {
      setError("Please fill out brand, model, and pickup location.");
      return;
    }

    if (targetStatus === "SUBMIT_FOR_REVIEW") {
      const hasPhotos = photoSlots.some((s) => s.file !== null || s.existingUrl);
      if (!hasPhotos) {
        setError("Please provide at least 2 vehicle photos before submitting for verification.");
        return;
      }
      if (!validateCompliance()) {
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Process images
      const imagesPayload: { image_url: string; angle: VehicleAngle; is_primary: boolean }[] = [];
      for (const slot of photoSlots) {
        if (slot.file) {
          const uploaded = await apiService.uploadDocument(slot.file);
          imagesPayload.push({
            image_url: uploaded.url,
            angle: slot.angle,
            is_primary: slot.angle === "FRONT",
          });
        } else if (slot.existingUrl) {
          imagesPayload.push({
            image_url: slot.existingUrl,
            angle: slot.angle,
            is_primary: slot.angle === "FRONT",
          });
        }
      }

      // 2. Update core vehicle record
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
        ...(imagesPayload.length > 0 ? { images: imagesPayload } : {}),
      });

      // 3. Upload and attach any new documents
      if (rcFile) {
        const rcUpload = await apiService.uploadDocument(rcFile);
        await apiService.addVehicleDocument(vehicleId, {
          document_type: "RC",
          document_url: rcUpload.url,
          document_number: rcNumber || undefined,
        });
      }

      if (pucFile) {
        const pucUpload = await apiService.uploadDocument(pucFile);
        await apiService.addVehicleDocument(vehicleId, {
          document_type: "PUC",
          document_url: pucUpload.url,
          document_number: pucNumber || undefined,
          expiry_date: pucExpiryDate ? new Date(pucExpiryDate).toISOString() : undefined,
        });
      }

      if (serviceFile) {
        const sUpload = await apiService.uploadDocument(serviceFile);
        await apiService.addVehicleDocument(vehicleId, {
          document_type: "SERVICE_RECORD",
          document_url: sUpload.url,
          document_number: serviceRecordNotes || undefined,
        });
      }

      // 4. Submit for review if requested
      if (targetStatus === "SUBMIT_FOR_REVIEW") {
        await apiService.submitVehicleForReview(vehicleId);
      }

      router.push(`/vehicles/${vehicleId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update vehicle. Please verify your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading vehicle specifications...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Vehicle not found</h2>
        <Link href="/my-vehicles">
          <Button variant="outline">Back to My Fleet</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/vehicles/${vehicleId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vehicle Details
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-xs text-gray-500">
              Update vehicle details, upload refreshed compliance certificates, or resubmit for verification.
            </p>
          </div>
        </div>
      </div>

      {/* Rejection Alert if Applicable */}
      {vehicle.status === "REJECTED" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-rose-900">Action Needed: Previous Submission Rejected</h4>
            <p className="text-rose-700 mt-0.5">
              Reason provided by Admin:{" "}
              <span className="font-semibold italic">"{vehicle.rejection_reason || "Documents or photos require revision."}"</span>
            </p>
            <p className="text-rose-600 text-xs mt-1">
              Please update the requested photos or upload updated documents below, then click &quot;Submit for Verification&quot;.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form sections */}
      <div className="space-y-8">
        {/* Section 1: Specifications */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-base text-gray-900">Vehicle Specifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="MAKE / BRAND"
              placeholder="e.g. Tesla, BMW, Toyota"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
            <Input
              label="MODEL"
              placeholder="e.g. Model 3, M4, RAV4"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
            <Input
              label="YEAR"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={1990}
              max={2027}
              required
            />
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Luxury">Luxury</option>
                <option value="Electric">Electric</option>
                <option value="Convertible">Convertible</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <Input
              label="SEATING CAPACITY"
              type="number"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              min={1}
              max={15}
              required
            />
            <Input
              label="DAILY RENTAL RATE ($ USD)"
              type="number"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(Number(e.target.value))}
              min={1}
              required
            />
          </div>

          <Input
            label="PICKUP / RETURN LOCATION"
            placeholder="e.g. San Francisco Airport (SFO), Mission District"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Vehicle Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight standout features..."
              className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 2: Multi-Angle Photography */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-base text-gray-900">Multi-Angle Photography</h3>
            </div>
            <span className="text-xs text-gray-500">Max 5MB per photo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photoSlots.map((slot, index) => (
              <div
                key={slot.angle}
                className="relative border border-gray-200 rounded-xl p-3 flex flex-col justify-between h-56 bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800">{slot.label}</span>
                  {slot.angle === "FRONT" && (
                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                </div>

                {slot.previewUrl ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden group">
                    <img src={slot.previewUrl} alt={slot.label} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAngleFile(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 bg-white">
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-[11px] font-semibold text-gray-600">Upload Photo</span>
                    <span className="text-[9px] text-gray-400 text-center px-2">{slot.description}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleAngleFileChange(index, e)}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Legal & Compliance Documents */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <h3 className="font-bold text-base text-gray-900">Compliance & Legal Documents</h3>
              <p className="text-xs text-gray-500">
                Uploaded documents are securely stored and verified by RideSync admins.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RC Card */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-sm text-gray-900">Registration Certificate (RC)</span>
                </div>
                {existingDocs.some((d) => d.document_type === "RC") && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> On File
                  </span>
                )}
              </div>
              <Input
                label="REGISTRATION NUMBER"
                placeholder="e.g. DL 01 AB 1234 or CA 8XYZ123"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Replace RC Document (PDF or Photo)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setRcFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            {/* PUC Card */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-sm text-gray-900">PUC Emission Certificate</span>
                </div>
                {existingDocs.some((d) => d.document_type === "PUC") && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> On File
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="CERTIFICATE NO."
                  placeholder="PUC Certificate #"
                  value={pucNumber}
                  onChange={(e) => setPucNumber(e.target.value)}
                />
                <Input
                  label="EXPIRY DATE"
                  type="date"
                  value={pucExpiryDate}
                  onChange={(e) => setPucExpiryDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Replace PUC Document (PDF or Photo)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setPucFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            {/* Service Record */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-bold text-sm text-gray-900">Recent Service History</span>
                </div>
                {existingDocs.some((d) => d.document_type === "SERVICE_RECORD") && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> On File
                  </span>
                )}
              </div>
              <Input
                label="SERVICE LOG / WORKSHOP NOTES"
                placeholder="e.g. Authorized 40,000 km general service, brake pads replaced"
                value={serviceRecordNotes}
                onChange={(e) => setServiceRecordNotes(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Attach New Service Invoice / Log
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setServiceFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => handleUpdate("KEEP")}
            className="w-full sm:w-auto"
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={submitting}
            onClick={() => handleUpdate("SUBMIT_FOR_REVIEW")}
            className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Submit for Verification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
