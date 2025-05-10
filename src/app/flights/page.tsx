"use client";
export const dynamic = 'force-dynamic';

import Global from "@/components/globe/globe2";
import React, { useRef, useEffect } from "react";
import AutocompleteCountry from "@/components/globe/countries";
import CityAutocomplete from "@/components/globe/city";
import { searchFlights } from "@/services/flightService";
import FlightBlog from "@/components/Blog/flightBlog";
import SectionTitle from "@/components/Common/SectionTitle";
import { toast } from "sonner";

interface CityOption {
  name: string;
  code: string;
}

const BlogSidebarPage = () => {
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [departureCity, setDepartureCity] = React.useState<CityOption | null>(null);
  const [destinationCity, setDestinationCity] = React.useState<CityOption | null>(null);
  const [departureDate, setDepartureDate] = React.useState("");
  const [returnDate, setReturnDate] = React.useState("");
  const [flightType, setFlightType] = React.useState<"one-way" | "round-trip">("one-way");
  const [flightResults, setFlightResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);

  const handleCountrySelect = (type: 'origin' | 'destination', countryName: string) => {
    if (type === 'origin') {
      setOrigin(countryName);
    } else {
      setDestination(countryName);
    }
  };

  const handleSearchFlights = async () => {
    if (!departureCity || !destinationCity) {
      toast.error("Please fill in the departure airport and destination airport.");
      return;
    }
    if (!departureDate) {
      toast.error("Please select a departure date.");
      return;
    }
    if (flightType === "round-trip" && !returnDate) {
      toast.error("Please select a return date for round-trip flights.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await searchFlights(
        departureCity.code,
        destinationCity.code,
        departureDate,
        flightType === "round-trip" ? returnDate : "",
        flightType
      );
      console.log('Flight Search Data:', data);
      if (!Array.isArray(data) || data.length === 0) {
        setError("No flights found for the selected criteria.");
        setFlightResults([]);
      } else {
        setFlightResults(data);
      }
    } catch (err: any) {
      console.error('Search Error:', err);
      setError("An error occurred while searching for flights.");
      setFlightResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const syncHeight = () => {
      if (formRef.current && globeRef.current) {
        const formHeight = formRef.current.getBoundingClientRect().height;
        const globeHeight = Math.max(formHeight - 100, 700);
        globeRef.current.style.height = `${globeHeight}px`;
        console.log(`Form Height: ${formHeight}px, Globe Height: ${globeHeight}px`);
      } else {
        console.warn('formRef or globeRef is null');
      }
    };

    syncHeight();
    window.addEventListener('resize', syncHeight);
    return () => window.removeEventListener('resize', syncHeight);
  }, []);

  return (
    <section className="overflow-hidden pt-32 pb-16 min-h-screen">
      <div className="container">
        <div className="mt-12">
          <SectionTitle
            title="The Best Flight Deals"
            paragraph="Find the Best Flight Deals and offers from all over the world. Book your Flight now!"
            center
            width="1000px"
          />
        </div>
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4 flex flex-col lg:flex-row-reverse gap-8">
            {/* Flight Search Form (Right, 1/3) */}
            <div className="w-full lg:w-1/3" ref={formRef}>
              <div className="shadow-three dark:bg-gray-dark rounded-sm bg-white p-6 dark:shadow-none">
                <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
                  Flight Search
                </h2>
                <div className="space-y-4">
                  <AutocompleteCountry
                    label="Origin Country"
                    value={origin}
                    onChange={(value) => {
                      setOrigin(value.name);
                      handleCountrySelect('origin', value.name);
                    }}
                  />
                  <CityAutocomplete
                    label="Departure Airport"
                    value={departureCity}
                    onChange={setDepartureCity}
                    country={origin}
                  />
                  <AutocompleteCountry
                    label="Destination Country"
                    value={destination}
                    onChange={(value) => {
                      setDestination(value.name);
                      handleCountrySelect('destination', value.name);
                    }}
                  />
                  <CityAutocomplete
                    label="Destination Airport"
                    value={destinationCity}
                    onChange={setDestinationCity}
                    country={destination}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Departure Date
                      </label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        min={today} // Disable past dates
                        className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Return Date
                      </label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        min={departureDate} // Disable dates before departure
                        disabled={flightType === "one-way"}
                        className={`border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B] ${flightType === "one-way" ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white text-center">
                        Flight Type
                      </label>
                      <div className="flex items-center justify-center space-x-4">
                        <span className="text-sm text-dark dark:text-white">One-way</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={flightType === "round-trip"}
                            onChange={(e) => setFlightType(e.target.checked ? "round-trip" : "one-way")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-sm text-dark dark:text-white">Round-trip</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSearchFlights}
                    className="flex w-full items-center justify-center rounded-sm bg-primary px-4 py-3 text-white transition hover:bg-opacity-90"
                  >
                    {loading ? "Searching..." : "Search Flights"}
                  </button>
                </div>
              </div>
            </div>
            {/* Globe (Left, 2/3) */}
            <div className="w-full lg:w-2/3" ref={globeRef}>
              <div className="rounded-xl overflow-hidden min-h-[800px]">
                <Global 
                  origin={origin}
                  destination={destination}
                  onCountrySelect={(type, country) => 
                    handleCountrySelect(type, country.properties.ADMIN)
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <FlightBlog flights={flightResults} />
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
            <circle
              cx="277"
              cy="63"
              r="225"
              fill="url(#paint0_linear_25:217)"
            />
            <circle
              cx="17.9997"
              cy="182"
              r="18"
              fill="url(#paint1_radial_25:217)"
            />
            <circle
              cx="76.9997"
              cy="288"
              r="34"
              fill="url(#paint2_radial_25:217)"
            />
            <circle
              cx="325.486"
              cy="302.87"
              r="180"
              transform="rotate(-37.6852 325.486 302.87)"
              fill="url(#paint3_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="184.521"
              cy="315.521"
              r="132.862"
              transform="rotate(114.874 184.521 315.521)"
              stroke="url(#paint4_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="356"
              cy="290"
              r="179.5"
              transform="rotate(-30 356 290)"
              stroke="url(#paint5_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="191.659"
              cy="302.659"
              r="133.362"
              transform="rotate(133.319 191.659 302.659)"
              fill="url(#paint6_linear_25:217)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_25:217"
                x1="-54.5003"
                y1="-178"
                x2="222"
                y2="288"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient
                id="paint1_radial_25:217"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(17.9997 182) rotate(90) scale(18)"
              >
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient
                id="paint2_radial_25:217"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(76.9997 288) rotate(90) scale(34)"
              >
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <linearGradient
                id="paint3_linear_25:217"
                x1="226.775"
                y1="-66.1548"
                x2="292.157"
                y2="351.421"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint4_linear_25:217"
                x1="184.521"
                y1="182.159"
                x2="184.521"
                y2="448.882"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint5_linear_25:217"
                x1="356"
                y1="110"
                x2="356"
                y2="470"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint6_linear_25:217"
                x1="118.524"
                y1="29.2497"
                x2="166.965"
                y2="338.63"
                gradientUnits="userSpaceOnUse"
              >
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
              <linearGradient
                id="paint0_linear_25:218"
                x1="184.389"
                y1="69.2405"
                x2="184.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_25:218"
                x1="156.389"
                y1="69.2405"
                x2="156.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint2_linear_25:218"
                x1="125.389"
                y1="69.2405"
                x2="125.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint3_linear_25:218"
                x1="93.8507"
                y1="67.2674"
                x2="89.9278"
                y2="210.214"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint4_linear_25:218"
                x1="214.505"
                y1="10.2849"
                x2="212.684"
                y2="99.5816"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient
                id="paint5_radial_25:218"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(220 63) rotate(90) scale(43)"
              >
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

export default BlogSidebarPage;