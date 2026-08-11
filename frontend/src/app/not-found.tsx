import React from "react";
import Link from "next/link";
import { Car, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-100 shadow-subtle">
          <Car className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-gray-800">Page Not Found</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            The page or vehicle listing you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link href="/">
          <Button variant="primary" size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home Page
          </Button>
        </Link>
      </div>
    </div>
  );
}
