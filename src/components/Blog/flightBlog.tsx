"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FlightBlog = ({ flights }: { flights: any[] }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("jwt_token"));
    }
  }, []);

  if (!flights || flights.length === 0) return null;

  const getRandomHotelImage = (index: number): string => {
    const imageNumber = Math.floor(Math.random() * 15) + 1;
    return `/images/flight-images/flight${imageNumber}.jpg`;
  };

  const handleFlightClick = (flight: any) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingFlight", JSON.stringify(flight));
    }
    const destinationPath = `/flight-details/${flight.id}`;
    if (token) {
      router.push(destinationPath);
    } else {
      router.push(`/signin?redirect=${encodeURIComponent(destinationPath)}`);
    }
  };

  return (
    <section
      id="blog"
      className="bg-gray-light dark:bg-bg-color-dark py-12 md:py-16 lg:py-20" // Reduced padding
    >
      <div className="container">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 md:gap-x-4 lg:gap-x-6 xl:grid-cols-3">
          {flights.map((flight) => (
            <div
              key={flight.id}
              className="group relative overflow-hidden rounded-sm bg-white shadow-one duration-300 hover:shadow-two dark:bg-dark dark:hover:shadow-gray-dark cursor-pointer"
              onClick={() => handleFlightClick(flight)}
            >
              <div className="relative block aspect-[37/25] w-full">
                <span className="absolute right-4 top-4 z-20 inline-flex items-center justify-center rounded-full bg-primary px-3 py-1 text-xs font-semibold capitalize text-white"> {/* Smaller badge */}
                  {flight.validatingAirlineCodes?.[0] ?? "Flight"}
                </span>
                <Image
                  src={getRandomHotelImage(flight.id)}
                  alt="flight"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4 sm:p-6 md:px-4 md:py-6 lg:p-6 xl:px-4 xl:py-6 2xl:p-6"> {/* Reduced padding */}
                <h3>
                  <span className="mb-2 block text-lg font-bold text-black hover:text-primary dark:text-white dark:hover:text-primary sm:text-xl"> {/* Smaller title */}
                    Flight {flight.id}
                  </span>
                </h3>
                <p className="mb-4 border-b border-body-color border-opacity-10 pb-4 text-sm font-medium text-body-color dark:border-white dark:border-opacity-10"> {/* Tighter spacing */}
                  Price: ${flight.price}
                </p>
                <div className="flex items-center">
                  <div className="mr-4 flex items-center border-r border-body-color border-opacity-10 pr-4 dark:border-white dark:border-opacity-10 xl:mr-2 xl:pr-2 2xl:mr-4 2xl:pr-4">
                    <div className="w-full">
                      <p className="text-xs font-medium text-dark dark:text-white">
                        {flight.itineraries[0]?.segments[0]?.departure.iataCode}{" "}
                        to{" "}
                        {flight.itineraries[0]?.segments[
                          flight.itineraries[0]?.segments.length - 1
                        ]?.arrival.iataCode}
                      </p>
                    </div>
                  </div>
                  <div className="inline-block">
                    <p className="text-xs text-body-color">
                      Duration: {flight.itineraries[0]?.duration}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlightBlog;