  "use client"
  import RelatedPost from "@/components/Blog/RelatedPost";
  import SharePost from "@/components/Blog/SharePost";
  import TagButton from "@/components/Blog/TagButton";
  import NewsLatterBox from "@/components/Contact/NewsLatterBox";
  import Image from "next/image";
  import Global from "@/components/globe/globe2";
  import { Metadata } from "next";
  import React from "react";
  import Head from 'next/head';
  import aireports from './airports_by_country.json';
  import AutocompleteCountry from "@/components/globe/countries";
  import CityAutocomplete from "@/components/globe/city";

  const BlogSidebarPage = () => {
    const [origin, setOrigin] = React.useState('');
    const [destination, setDestination] = React.useState('');
    const [departureCity, setDepartureCity] = React.useState('');
    const [destinationCity, setDestinationCity] = React.useState('');
    const handleCountrySelect = (type: 'origin' | 'destination', countryName: string) => {
      // console.log('Selected country:', countryName);
      if (type === 'origin') {
        setOrigin(countryName);
      } else {
        setDestination(countryName);
      }
    };
  
    return (
      <section className="overflow-hidden pb-[120px] pt-[180px]">
        <div className="container">
          <h1 className="mb-8 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight">
            The world is in your hands
          </h1>
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4 lg:w-8/12">
              <div className="rounded-xl overflow-hidden">
                <Global 
                  origin={origin}
                  destination={destination}
                  onCountrySelect={(type, country) => 
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
                <div className="space-y-4">
                  <AutocompleteCountry
                    label="Origin Country"
                    value={origin}
                    onChange={(value) => {
                      setOrigin(value);
                      handleCountrySelect('origin', value);
                    }}
                  />
  
                  {/* <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Department City
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Department city"
                      className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                    />
                  </div> */}
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
                      setDestination(value);
                      handleCountrySelect('destination', value);
                    }}
                  />
        <CityAutocomplete
        label="Destination Airport"
        value={destinationCity}
        onChange={setDestinationCity}
        country={destination}
      />
                   {/* <div>
                   <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Destination City
                   </label>
                     <input
                      type="text"
                      placeholder="Enter Destination city"
                      className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                    />
                  </div> */}
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Return Date
                    </label>
                    <input
                      type="date"
                      className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                    />
                  </div>
                </div>
                {/* Passengers */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Adults
                  </label>
                  <select
                    className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                {/* Search Button */}
                <button className="flex w-full items-center justify-center rounded-sm bg-primary px-4 py-3 text-white transition hover:bg-opacity-90">
                  Search Flights
                </button>
              </div>
            </div>
          </div>
            </div>
          </div>
        </section>
    );
  };
  
  export default BlogSidebarPage;