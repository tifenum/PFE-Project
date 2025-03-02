"use client"
import React, { useState, useEffect } from 'react';
import Global from "@/components/globe/globe2";
import countries from '@/components/globe/contries.json'; // Import your JSON file

interface Country {
  name: string;
  code: string;
}

const AutocompleteCountry = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const [suggestions, setSuggestions] = useState<Country[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value.length > 0) {
      const searchTerm = value.toLowerCase();
      const filtered = countries.filter(country => 
        country.name.toLowerCase().startsWith(searchTerm) &&
        country.name.toLowerCase() !== searchTerm // Exclude exact match
      );
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleCountrySelect = (countryName: string) => {
    onChange(countryName);
    setShowSuggestions(false); // Immediately hide the dropdown
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
        {label}
      </label>
      <input
        type="text"
        placeholder={`Enter ${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
      />
      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-[#2C303B] max-h-48 overflow-y-auto">
          {suggestions.map((country) => (
            <div
              key={country.code}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleCountrySelect(country.name)}
            >
              {country.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteCountry;