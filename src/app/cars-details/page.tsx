"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createBooking } from "@/services/carsService";
import { jwtDecode } from "jwt-decode";
import SectionTitle from "@/components/Common/SectionTitle";

const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-3 text-left text-lg font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-t-lg"
      >
        {title}
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-b-lg">{children}</div>
      )}
    </div>
  );
};

const ProgressBar = ({ currentStep }) => {
  const steps = ["Review Booking", "Enter Details", "Confirm"];
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex-1 text-center">
          <div
            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white ${
              index + 1 <= currentStep ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            {index + 1}
          </div>
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {step}
          </p>
          {index < steps.length - 1 && (
            <div
              className={`h-1 flex-1 mx-2 mt-4 ${
                index + 1 < currentStep ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const CarsDetailsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [driversLicense, setDriversLicense] = useState("");
  const [insurance, setInsurance] = useState("no");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      const destinationPath = `/cars-details?${searchParams.toString()}`;
      router.push(`/signin?redirect=${encodeURIComponent(destinationPath)}`);
      return;
    }

    const data = {
      userId: searchParams.get("userId") || "",
      carProvider: searchParams.get("carProvider") || "",
      pickupCountry: searchParams.get("pickupCountry") || "",
      pickupCity: searchParams.get("pickupCity") || "",
      carType: searchParams.get("carType") || "",
      carFeatures: searchParams.get("carFeatures")?.split(",") || [],
      pricePerDay: parseFloat(searchParams.get("pricePerDay") || "0"),
      carTypeFilter: searchParams.get("carTypeFilter") || "",
      passengers: searchParams.get("passengers") || "",
      transmission: searchParams.get("transmission") || "",
    };

    setBookingData(data);
  }, [searchParams, router]);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      try {
        const decoded: { sub: string } = jwtDecode(token);
        return decoded.sub;
      } catch (error) {
        console.error("Error decoding token", error);
        return null;
      }
    }
    return null;
  };
  const userId = getUserIdFromToken();

  const calculateTotalPrice = () => {
    if (!pickupDate || !dropoffDate || !bookingData?.pricePerDay) return 0;
    const inDate = new Date(pickupDate);
    const outDate = new Date(dropoffDate);
    const diffMs = outDate.getTime() - inDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days * bookingData.pricePerDay;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driversLicense) {
      toast.warning("Driver’s license number is required!");
      return;
    }
    if (!pickupDate) {
      toast.warning("Pickup date is required!");
      return;
    }
    if (!pickupTime) {
      toast.warning("Pickup time is required!");
      return;
    }
    if (!dropoffDate) {
      toast.warning("Drop-off date is required!");
      return;
    }
    if (!dropoffTime) {
      toast.warning("Drop-off time is required!");
      return;
    }

    if (!bookingData) {
      toast.error("Booking data is missing!");
      return;
    }

    if (pickupDate < today) {
      toast.error("Pickup date can’t be in the past!");
      return;
    }
    if (dropoffDate <= pickupDate) {
      toast.warning("Drop-off date must be after pickup date!");
      return;
    }

    const totalPrice = calculateTotalPrice();

    const finalBookingData = {
      userId: userId || bookingData.userId,
      carProvider: bookingData.carProvider,
      pickupCountry: bookingData.pickupCountry,
      pickupCity: bookingData.pickupCity,
      carType: bookingData.carType,
      carFeatures: bookingData.carFeatures,
      pricePerDay: bookingData.pricePerDay,
      pickupDate,
      pickupTime,
      dropoffDate,
      dropoffTime,
      notes: `Driver's License: ${driversLicense}; Insurance: ${insurance}; Car Type Filter: ${bookingData.carTypeFilter}; Passengers: ${bookingData.passengers}; Transmission: ${bookingData.transmission}; Additional Notes: ${additionalNotes}`,
      totalPrice,
    };

    setIsSubmitting(true);
    try {
      await createBooking(finalBookingData);
      toast.success("Booking confirmed! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      toast.error("Failed to book the car. Try again!");
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const searchParams = new URLSearchParams({
      pickupCountry: bookingData?.pickupCountry || "",
      pickupCity: bookingData?.pickupCity || "",
      carType: bookingData?.carTypeFilter || "",
      passengers: bookingData?.passengers || "",
      transmission: bookingData?.transmission || "",
    }).toString();
    router.push(`/car-rental?${searchParams}`);
  };

  if (!bookingData) {
    return (
      <section className="py-16 md:py-20 lg:py-28">
        <div className="container text-center">
          <div className="flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-t-[#4A6CF7] border-[#4A6CF7]/30 rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-blue-900 py-16 md:py-20 lg:py-28">
      <div className="container max-w-4xl mx-auto px-4">
        <SectionTitle
          title="Finalize Your Car Rental"
          paragraph="Review your booking details and provide additional information to confirm your rental."
          center
          width="800px"
        />

        <ProgressBar currentStep={2} />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <CollapsibleSection title="Booking Summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Car Provider
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bookingData.carProvider}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7h6v10m-6 0h6m-9 4h12" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Car Type
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bookingData.carType}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={`${bookingData.pickupCity}, ${bookingData.pickupCountry}`}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price Per Day
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={`$${bookingData.pricePerDay}`}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Rental Dates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pickup Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={today}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pickup Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Drop-off Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dropoffDate}
                      onChange={(e) => setDropoffDate(e.target.value)}
                      min={pickupDate || today}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Drop-off Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={dropoffTime}
                      onChange={(e) => setDropoffTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Driver Information">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Driver’s License Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={driversLicense}
                      onChange={(e) => setDriversLicense(e.target.value)}
                      placeholder="Enter your driver’s license number"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Insurance
                  </label>
                  <div className="relative">
                    <select
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="no">No Insurance</option>
                      <option value="yes">Add Insurance</option>
                    </select>
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    Additional Notes
                    <span className="ml-2 text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Any additional requests or information..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                    <svg
                      className="absolute left-3 top-4 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4 mt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Price</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${calculateTotalPrice().toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">Rental Duration</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {pickupDate && dropoffDate
                    ? `${Math.ceil(
                        (new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} days`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-transform transform hover:scale-105"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-transform transform hover:scale-105 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

const CarsDetailsPage = () => {
  return (
    <Suspense
      fallback={
        <section className="py-16 md:py-20 lg:py-28">
          <div className="container text-center">
            <div className="flex justify-center items-center">
              <div className="w-16 h-16 border-4 border-t-[#4A6CF7] border-[#4A6CF7]/30 rounded-full animate-spin"></div>
            </div>
          </div>
        </section>
      }
    >
      <CarsDetailsContent />
    </Suspense>
  );
};

export default CarsDetailsPage;