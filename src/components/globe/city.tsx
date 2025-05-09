"use client";
import React, { useState } from "react";
import airportsData from "@/components/globe/airports_by_country.json"; // Import directly

interface Airport {
  code: string;
  lat: string;
  lon: string;
  name: string;
  city: string;
  state: string;
  icao: string;
  direct_flights: string;
  carriers: string;
}

interface CountryAirports {
  country: string;
  airports: Airport[];
}

interface CityOption {
  name: string;
  code: string;
}

interface CityAutocompleteProps {
  label: string;
  value: CityOption | null;
  onChange: (value: CityOption) => void;
  country: string;
}

const CityAutocomplete = ({
  label,
  value,
  onChange,
  country,
}: CityAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Compute unique cities (with airport codes) for the selected country
  const citiesWithCode = React.useMemo<CityOption[]>(() => {
    if (!country) return [];
    const countryEntry = (airportsData as CountryAirports[]).find(
      (c) => c.country.toLowerCase() === country.toLowerCase()
    );
    if (!countryEntry) return [];
    const uniqueCities: CityOption[] = [];
    const seen = new Set<string>();
    countryEntry.airports.forEach((airport) => {
      if (!seen.has(airport.name)) {
        seen.add(airport.name);
        uniqueCities.push({ name: airport.name, code: airport.code });
      }
    });
    return uniqueCities;
  }, [country]);

  const filteredCities = citiesWithCode.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-left text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
        >
          {value ? value.name : `Select ${label}`}
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-[#2C303B] max-h-48 overflow-y-auto">
            {filteredCities.map((city) => (
              <div
                key={city.code}
                className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  onChange(city);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
              >
                {city.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CityAutocomplete;
