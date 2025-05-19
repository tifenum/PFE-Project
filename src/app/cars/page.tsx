"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import CityAutocomplete from "@/components/globe/city";
import AutocompleteCountry from "@/components/globe/countries";
import SectionTitle from "@/components/Common/SectionTitle";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { searchCars } from "@/services/carsService";
import { jwtDecode } from "jwt-decode";

interface CityOption {
  name: string;
  code: string;
}

interface CarType {
  type: string;
  pricePerDay: number;
  features: string[];
}

interface CarData {
  provider: string;
  pickupCountry: string;
  pickupCity: string;
  carTypes: CarType[];
}

const CarRentalSearchPage = () => {
  const [pickupCountry, setPickupCountry] = useState("");
  const [pickupCity, setPickupCity] = useState<CityOption | null>(null);
  const [carType, setCarType] = useState("");
  const [passengers, setPassengers] = useState("");
  const [carResults, setCarResults] = useState<CarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearchCars = async () => {
    if (!pickupCountry) {
      toast.error("Please select a pickup country.");
      return;
    }
    if (!pickupCity) {
      toast.error("Please select a pickup city.");
      return;
    }
    if (!carType) {
      toast.error("Please select a car type.");
      return;
    }
    if (!passengers) {
      toast.error("Please select the number of passengers.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await searchCars({
        pickupCountry,
        pickupCity: pickupCity.name,
        carType,
        passengers,
      });
      if (!data) throw new Error("No car data found");
      setCarResults(data);
    } catch (err) {
      setError("Failed to fetch car results. Try again.");
      toast.error("Failed to fetch car results.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <section className="overflow-hidden pt-32 pb-16 min-h-screen">
      <div className="container">
        <div className="mt-12">
          <SectionTitle
            title="The Best Car Rental Deals"
            paragraph="Find the Best Car Rental Deals from top providers worldwide. Book your car now!"
            center
            width="1000px"
          />
        </div>
        <div className="mt-8 px-4">
          <div className="shadow-three dark:bg-gray-dark rounded-2xl bg-white p-4 dark:shadow-none max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="flex-1 min-w-[150px]">
                <AutocompleteCountry
                  value={pickupCountry}
                  onChange={(value) => setPickupCountry(value.name)}
                  label=""
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <CityAutocomplete
                  value={pickupCity}
                  onChange={setPickupCity}
                  country={pickupCountry}
                  label=""
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <select
                  value={carType}
                  onChange={(e) => setCarType(e.target.value)}
                  className="border-stroke dark:focus:border-primary w-full h-12 rounded-lg border bg-[#f8f8f8] px-3 py-2 text-sm text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                >
                  <option value="">Select Car Type</option>
                  <option value="Economy">Economy</option>
                  <option value="SUV">SUV</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="border-stroke dark:focus:border-primary w-full h-12 rounded-lg border bg-[#f8f8f8] px-3 py-2 text-sm text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                >
                  <option value="">Select Passengers</option>
                  <option value="1-2">1-2 Passengers</option>
                  <option value="3-4">3-4 Passengers</option>
                  <option value="5+">5+ Passengers</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <button
                  onClick={handleSearchCars}
                  className="flex w-full h-12 items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm text-white transition hover:bg-opacity-90 mt-6 md:mt-0"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search Cars"}
                </button>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 text-center text-red-500">
            {error}
          </div>
        )}
        {carResults && (
          <CarDetailsClient
            carData={carResults}
            carTypeFilter={carType}
            passengers={passengers}
            userId={userId}
          />
        )}
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

const CarDetailsClient = ({ carData, carTypeFilter, passengers, userId }) => {
  const router = useRouter();

  const parseProviderName = (name: string) => {
    if (!name) return "";
    const cleanedName = name.toLowerCase().trim();
    return cleanedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const displayName = parseProviderName(carData.provider);

  const getRandomCarImage = (index: number): string => {
    const imageNumber = Math.floor(Math.random() * 20) + 1;
    return `/images/car-images/car${imageNumber}.jpg`;
  };

  const handleBookNow = (carType: CarType) => {
    const bookingData = {
      userId: String(userId ?? ""),
      carProvider: String(carData.provider ?? ""),
      pickupCountry: String(carData.pickupCountry ?? ""),
      pickupCity: String(carData.pickupCity ?? ""),
      carType: String(carType.type ?? ""),
      carFeatures: carType.features.join(','),
      pricePerDay: String(carType.pricePerDay ?? ""),
      carTypeFilter: String(carTypeFilter ?? ""),
      passengers: String(passengers ?? ""),
    };

    const queryParams = new URLSearchParams(bookingData).toString();
    const token = localStorage.getItem("jwt_token");

    if (!token) {
      router.push(`/signin?redirect=${encodeURIComponent(`/cars-details?${queryParams}`)}`);
      return;
    }

    router.push(`/cars-details?${queryParams}`);
  };

  if (!carData) return <p className="text-center text-red-500">No car data found.</p>;

  return (
    <div className="mt-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative mb-12 overflow-hidden rounded-2xl">
          <img
            src={getRandomCarImage(0)}
            alt={`${displayName} Hero`}
            className="w-full h-64 md:h-96 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/car-images/car1.jpg"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{displayName}</h1>
              <p className="text-lg text-gray-200">{carData.pickupCity}, {carData.pickupCountry}</p>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-white">Available Cars</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {carData.carTypes.map((carType, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105"
            >
              <img
                src={getRandomCarImage(idx)}
                alt={`${carType.type} Image`}
                className="w-full h-64 object-cover rounded-xl"
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/car-images/car1.jpg"; }}
              />
              <div className="flex flex-col p-6 h-80 bg-gradient-to-t from-gray-100/90 to-transparent dark:from-gray-800/90 dark:to-transparent">
                <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">{carType.type}</h3>
                <p className="mb-3 text-gray-600 dark:text-gray-300">Price: ${carType.pricePerDay} / day</p>
                <ul className="list-none mb-4 space-y-2 flex-grow">
                  {[...new Set(carType.features)].slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                      {String(f)}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleBookNow(carType)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-auto"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarRentalSearchPage;