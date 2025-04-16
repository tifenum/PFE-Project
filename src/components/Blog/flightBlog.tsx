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

  const handleFlightClick = (flight: any) => {
    const destinationUrl = `/flight-details/${flight.id}?data=${encodeURIComponent(
      JSON.stringify(flight)
    )}`;
    console.log(token);
    if (token) {
      router.push(destinationUrl);
    } else {
      router.push(`/signin?redirect=${encodeURIComponent(destinationUrl)}`);
    }
  };

  return (
    <section
      id="blog"
      className="bg-gray-light dark:bg-bg-color-dark py-16 md:py-20 lg:py-28"
    >
      <div className="container">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-x-6 lg:gap-x-8 xl:grid-cols-3">
          {flights.map((flight) => (
            <div
              key={flight.id}
              className="group relative overflow-hidden rounded-sm bg-white shadow-one duration-300 hover:shadow-two dark:bg-dark dark:hover:shadow-gray-dark cursor-pointer"
              onClick={() => handleFlightClick(flight)}
            >
              <div className="relative block aspect-[37/22] w-full">
                <span className="absolute right-6 top-6 z-20 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold capitalize text-white">
                  {flight.validatingAirlineCodes &&
                  flight.validatingAirlineCodes[0]
                    ? flight.validatingAirlineCodes[0]
                    : "Flight"}
                </span>
                <Image
                  src="/images/blog/blog-02.jpg"
                  alt="flight"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 md:px-6 md:py-8 lg:p-8 xl:px-5 xl:py-8 2xl:p-8">
                <h3>
                  <span className="mb-4 block text-xl font-bold text-black hover:text-primary dark:text-white dark:hover:text-primary sm:text-2xl">
                    Flight {flight.id}
                  </span>
                </h3>
                <p className="mb-6 border-b border-body-color border-opacity-10 pb-6 text-base font-medium text-body-color dark:border-white dark:border-opacity-10">
                  Price: $ {flight.price}
                </p>
                <div className="flex items-center">
                  <div className="mr-5 flex items-center border-r border-body-color border-opacity-10 pr-5 dark:border-white dark:border-opacity-10 xl:mr-3 xl:pr-3 2xl:mr-5 2xl:pr-5">
                    <div className="w-full">
                      <p className="text-sm font-medium text-dark dark:text-white">
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
        {/* Pagination Section */}
        <div className="-mx-4 flex flex-wrap" data-wow-delay=".15s">
          <div className="w-full px-4">
            <ul className="flex items-center justify-center pt-8">
              <li className="mx-1">
                <a
                  href="#0"
                  className="flex h-9 min-w-[36px] items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white"
                >
                  Prev
                </a>
              </li>
              <li className="mx-1">
                <a
                  href="#0"
                  className="flex h-9 min-w-[36px] items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white"
                >
                  1
                </a>
              </li>
              <li className="mx-1">
                <a
                  href="#0"
                  className="flex h-9 min-w-[36px] items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white"
                >
                  2
                </a>
              </li>
              <li className="mx-1">
                <a
                  href="#0"
                  className="flex h-9 min-w-[36px] items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white"
                >
                  3
                </a>
              </li>
              <li className="mx-1">
                <span className="flex h-9 min-w-[36px] cursor-not-allowed items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 text-sm text-body-color">
                  ...
                </span>
              </li>
              <li className="mx-1">
                <a
                  href="#0"
                  className="flex h-9 min-w-[36px] items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white"
                >
                  12
                </a>
              </li>
              <li className="mx-1">
                <a
                  href="#0"
                  className="flex h-9 min-w-[36px] items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white"
                >
                  Next
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlightBlog;
