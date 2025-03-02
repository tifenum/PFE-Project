"use client"
import React, { useState, useEffect } from 'react'
import airportsData from '@/components/globe/airports_by_country.json' // Import directly here

interface Airport {
  code: string;
  lat: string;
  lon: string;
  name: string;
  city: string;
  state: string;
  icao: string;
  direct_flights: string;
  carriers: string;}

  interface CountryAirports {
    country: string;
    airports: Airport[];
  }
  
  interface CityAutocompleteProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    country: string;
  }
  
  const CityAutocomplete = ({
    label,
    value,
    onChange,
    country,
  }: CityAutocompleteProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
  
    // Get cities for selected country
    const countryCities = React.useMemo(() => {
      if (!country) return []
      const countryEntry = airportsData.find(c => 
        c.country.toLowerCase() === country.toLowerCase()
      )
      return countryEntry ? [...new Set(countryEntry.airports.map(a => a.name))] : []
    }, [country])
  
    const filteredCities = countryCities.filter(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  
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
            {value || `Select ${label}`}
          </button>
  
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-[#2C303B] max-h-48 overflow-y-auto">
              {/* <div className="p-2">
                <input
                  type="text"
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 mb-2 rounded border dark:bg-gray-800"
                />
              </div> */}
              
              {filteredCities.map((name) => (
                <div
                  key={name}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    onChange(name)
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  export default CityAutocomplete