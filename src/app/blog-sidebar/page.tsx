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

  // export const metadata: Metadata = {
  //   title: "Blog Details Page | Free Next.js Template for Startup and SaaS",
  //   description: "This is Blog Details Page for Startup Nextjs Template",
  // };

  const BlogSidebarPage = () => {
    const [origin, setOrigin] = React.useState('');
    const [destination, setDestination] = React.useState('');

    const handleCountrySelect = (type: 'origin' | 'destination', country: any) => {
      console.log('Selected country:', country.properties.ADMIN);
      if (type === 'origin') {
        setOrigin(country.properties.ADMIN);
      } else {
        setDestination(country.properties.ADMIN);
      }
    };
  
    return (
      <>
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
                  onCountrySelect={handleCountrySelect}
                />
              </div>
            </div>
            {/* Modified Form */}
            <div className="w-full px-4 lg:w-4/12">
              <div className="shadow-three dark:bg-gray-dark mb-10 mt-12 rounded-sm bg-white p-6 dark:shadow-none lg:mt-0">
                <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
                  Flight Search
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Origin Location
                    </label>
                    <input
                      type="text"
                      placeholder="Enter origin city"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Destination
                    </label>
                    <input
                      type="text"
                      placeholder="Enter destination city"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="border-stroke dark:focus:border-primary w-full rounded-sm border bg-[#f8f8f8] px-4 py-3 text-body-color outline-none transition focus:border-primary dark:border-transparent dark:bg-[#2C303B]"
                    />
                  </div>
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
      </>
    );
  };

  export default BlogSidebarPage;
