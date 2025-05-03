// frontend/app/flights/FlightSearchClient.tsx
"use client";
import React, { useState } from "react";
import Global from "@/components/globe/globe2";
import AutocompleteCountry from "@/components/globe/countries";
import CityAutocomplete from "@/components/globe/city";
import FlightBlog from "@/components/Blog/flightBlog";
import { searchFlights } from "@/services/flightService";

interface CityOption {
  name: string;
  code: string;
}

interface CountryOption {
  name: string;
}

const FlightSearchClient: React.FC = () => {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [departureCity, setDepartureCity] = useState<CityOption | null>(null);
  const [destinationCity, setDestinationCity] = useState<CityOption | null>(null);
  const [departureDate, setDepartureDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [adults, setAdults] = useState<number>(1);
  const [flightResults, setFlightResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleCountrySelect = (type: "origin" | "destination", countryName: string) => {
    if (type === "origin") {
      setOrigin(countryName);
    } else {
      setDestination(countryName);
    }
  };

  const handleSearchFlights = async () => {
    if (!departureCity || !destinationCity || !departureDate) {
      setError("Please fill in the departure airport, destination airport, and departure date.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await searchFlights(
        departureCity.code,
        destinationCity.code,
        departureDate,
        returnDate,
        adults
      );
      setFlightResults(data);
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while searching for flights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="-mx-4 flex flex-wrap">
        <div className="w-full px-4 lg:w-8/12">
          <div className="rounded-xl overflow-hidden">
            <Global
              origin={origin}
              destination={destination}
              onCountrySelect={(type: "origin" | "destination", country: any) =>
                handleCountrySelect(type, country.properties.ADMIN)
              }
            />
          </div>
        </div>
        <div className="w-full px-4 lg:w-4/12">
          <div className="shadow-three dark:bg-gray-dark mb-10 mt-12 rounded-sm bg-white p-6 dark:shadow-none lg:mt-0">
            <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
              Flight Search
            </h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="space-y-4">
              <AutocompleteCountry
                label="Origin Country"
                value={origin}
                onChange={(value: CountryOption) => {
                  setOrigin(value.name);
                  handleCountrySelect("origin", value.name);
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
                onChange={(value: CountryOption) => {
                  setDestination(value.name);
                  handleCountrySelect("destination", value.name);
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
                    className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Adults
                </label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} Adult{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Class
                </label>
                <select
                  className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Flight
                </label>
                <select
                  className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                >
                  <option value="economy">One-way</option>
                  <option value="business">Round-trip</option>
                </select>
              </div>
              <button
                onClick={handleSearchFlights}
                disabled={loading}
                className="flex w-full items-center justify-center rounded-sm bg-primary px-4 py-3 text-white transition hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search Flights"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <FlightBlog flights={flightResults} />
    </>
  );
};

export default FlightSearchClient;