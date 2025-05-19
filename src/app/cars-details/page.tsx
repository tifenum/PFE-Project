"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createBooking } from "@/services/carsService";
import { jwtDecode } from "jwt-decode";
import SectionTitle from "@/components/Common/SectionTitle";

// Client-side component for search params
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
      transmission: searchParams.get("transmission") || ""
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

    const inDate = new Date(pickupDate);
    const outDate = new Date(dropoffDate);
    const diffMs = outDate.getTime() - inDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const totalPrice = days * bookingData.pricePerDay;

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
      totalPrice
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
      transmission: bookingData?.transmission || ""
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
    <section className="overflow-hidden pt-32 pb-16 min-h-screen">
      <div className="container">
        <div className="mt-12">
          <SectionTitle
            title="Car Rental Details"
            paragraph="Provide additional details to finalize your car rental booking."
            center
            width="1000px"
          />
        </div>
        <div className="mt-8 px-4">
          <div className="shadow-three dark:bg-gray-dark rounded-2xl bg-white p-8 dark:shadow-none max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Read-only Booking Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Car Provider
                  </label>
                  <input
                    type="text"
                    value={bookingData.carProvider}
                    readOnly
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Car Type
                  </label>
                  <input
                    type="text"
                    value={bookingData.carType}
                    readOnly
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={`${bookingData.pickupCity}, ${bookingData.pickupCountry}`}
                    readOnly
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 opacity-70"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pickup Date *
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={today}
                      className="w-full p-2 border rounded-md dark:bg-[#2C303B] dark:border-transparent dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pickup Time *
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-[#2C303B] dark:border-transparent dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Drop-off Date *
                    </label>
                    <input
                      type="date"
                      value={dropoffDate}
                      onChange={(e) => setDropoffDate(e.target.value)}
                      min={pickupDate || today}
                      className="w-full p-2 border rounded-md dark:bg-[#2C303B] dark:border-transparent dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Drop-off Time *
                    </label>
                    <input
                      type="time"
                      value={dropoffTime}
                      onChange={(e) => setDropoffTime(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-[#2C303B] dark:border-transparent dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selected Car Type
                  </label>
                  <input
                    type="text"
                    value={bookingData.carTypeFilter}
                    readOnly
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Passengers
                  </label>
                  <input
                    type="text"
                    value={bookingData.passengers}
                    readOnly
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transmission Type
                  </label>
                  <input
                    type="text"
                    value={bookingData.transmission}
                    readOnly
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price Per Day
                  </label>
                  <input
                    type="text"
                    value={`$${bookingData.pricePerDay}`}
                    readOnly
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 opacity-70"
                  />
                </div>

                {/* Editable Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Driver’s License Number *
                  </label>
                  <input
                    type="text"
                    value={driversLicense}
                    onChange={(e) => setDriversLicense(e.target.value)}
                    placeholder="Enter your driver’s license number"
                    className="w-full p-2 border rounded-md dark:bg-[#2C303B] dark:border-transparent dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Insurance
                  </label>
                  <select
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-[#2C303B] dark:border-transparent dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="no">No Insurance</option>
                    <option value="yes">Add Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any additional requests or information..."
                    className="w-full p-2 border rounded-md dark:bg-[#2C303B] dark:border-transparent dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Background SVGs */}
        <div className="absolute right-0 top-0 z-[-1] opacity-30 lg:opacity-100">
          <svg
            width="450"
            height="556"
            viewBox="0 0 450 556"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="277" cy="63" r="225" fill="url(#paint0_linear_25:217)" />
            <circle cx="17.9997" cy="182" r="18" fill="url(#paint1_radial_25:217)" />
            <circle cx="76.9997" cy="288" r="34" fill="url(#paint2_radial_25:217)" />
            <circle cx="325.486" cy="302.87" r="180" transform="rotate(-37.6852 325.486 302.87)" fill="url(#paint3_linear_25:217)" />
            <circle opacity="0.8" cx="184.521" cy="315.521" r="132.862" transform="rotate(114.874 184.521 315.521)" stroke="url(#paint4_linear_25:217)" />
            <circle opacity="0.8" cx="356" cy="290" r="179.5" transform="rotate(-30 356 290)" stroke="url(#paint5_linear_25:217)" />
            <circle opacity="0.8" cx="191.659" cy="302.659" r="133.362" transform="rotate(133.319 191.659 302.659)" fill="url(#paint6_linear_25:217)" />
            <defs>
              <linearGradient id="paint0_linear_25:217" x1="-54.5003" y1="-178" x2="222" y2="288" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="paint1_radial_25:217" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17.9997 182) rotate(90) scale(18)">
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient id="paint2_radial_25:217" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(76.9997 288) rotate(90) scale(34)">
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <linearGradient id="paint3_linear_25:217" x1="226.775" y1="-66.1548" x2="292.157" y2="351.421" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="paint4_linear_25:217" x1="184.521" y1="182.159" x2="184.521" y2="448.882" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="paint5_linear_25:217" x1="356" y1="110" x2="356" y2="470" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="paint6_linear_25:217" x1="118.524" y1="29.2497" x2="166.965" y2="338.63" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 z-[-1] opacity-30 lg:opacity-100">
          <svg
            width="364"
            height="201"
            viewBox="0 0 364 201"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24"
              stroke="url(#paint0_linear_25:218)"
            />
            <path
              d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24"
              stroke="url(#paint1_linear_25:218)"
            />
            <path
              d="M-53.1107 72.3303C-25.3401 66.4798 42.3965 64.9086 91.1783 105.427C152.155 156.076 170.59 162.093 205.333 166.607C240.076 171.12 278.718 183.657 303.889 212.24"
              stroke="url(#paint2_linear_25:218)"
            />
            <path
              d="M-98.1618 65.0889C-68.1416 60.0601 4.73364 60.4882 56.0734 102.431C120.248 154.86 139.905 161.419 177.137 166.956C214.37 172.493 255.575 186.165 281.856 215.481"
              stroke="url(#paint3_linear_25:218)"
            />
            <circle
              opacity="0.8"
              cx="214.505"
              cy="60.5054"
              r="49.7205"
              transform="rotate(-13.421 214.505 60.5054)"
              stroke="url(#paint4_linear_25:218)"
            />
            <circle cx="220" cy="63" r="43" fill="url(#paint5_radial_25:218)" />
            <defs>
              <linearGradient id="paint0_linear_25:218" x1="184.389" y1="69.2405" x2="184.389" y2="212.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint1_linear_25:218" x1="156.389" y1="69.2405" x2="156.389" y2="212.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint2_linear_25:218" x1="125.389" y1="69.2405" x2="125.389" y2="212.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint3_linear_25:218" x1="93.8507" y1="67.2674" x2="89.9278" y2="210.214" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient id="paint4_linear_25:218" x1="214.505" y1="10.2849" x2="212.684" y2="99.5816" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="paint5_radial_25:218" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(220 63) rotate(90) scale(43)">
                <stop offset="0.145833" stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" stopOpacity="0.08" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
};

// Main page component
const CarsDetailsPage = () => {
  return (
    <Suspense fallback={
      <section className="py-16 md:py-20 lg:py-28">
        <div className="container text-center">
          <div className="flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-t-[#4A6CF7] border-[#4A6CF7]/30 rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    }>
      <CarsDetailsContent />
    </Suspense>
  );
};

export default CarsDetailsPage;