
"use client"
import RelatedPost from "@/components/Blog/RelatedPost";
import SharePost from "@/components/Blog/SharePost";
import TagButton from "@/components/Blog/TagButton";
import NewsLatterBox from "@/components/Contact/NewsLatterBox";
import Image from "next/image";
import Global from "@/components/globe/globe2";
import { Metadata } from "next";
import React, { useEffect } from "react";
import Head from 'next/head';
import AutocompleteCountry from "@/components/globe/countries";
import CityAutocomplete from "@/components/globe/city";
import Blog from "@/components/Blog";
import { searchFlights } from "@/services/flightService";
import FlightBlog from "@/components/Blog/flightBlog"; // Updated import clipPath
interface CityOption {
  name: string;
  code: string;
}
declare global {
  interface Window {
    anychart: any;
    acgraph: any;
    $: any;
    boeingData: any;
  }
}
const BlogSidebarPage = () => {
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [departureCity, setDepartureCity] = React.useState<CityOption | null>(null);
  const [destinationCity, setDestinationCity] = React.useState<CityOption | null>(null);
  const [departureDate, setDepartureDate] = React.useState("");
  const [returnDate, setReturnDate] = React.useState(""); // if needed in future
  const [adults, setAdults] = React.useState(1);
  const [flightResults, setFlightResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const handleCountrySelect = (type: 'origin' | 'destination', countryName: string) => {
    // console.log('Selected country:', countryName);
    if (type === 'origin') {
      setOrigin(countryName);
    } else {
      setDestination(countryName);
    }
  };
  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const loadScripts = async () => {
      try {
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-base.min.js");
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-ui.min.js");
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-exports.min.js");
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-map.min.js");
        await loadScript("https://code.jquery.com/jquery-latest.min.js");
        await loadScript("https://cdn.anychart.com/csv-data/boeing_737.js");
      } catch (error) {
        console.error("Error loading scripts", error);
      }
    };

    loadScripts().then(() => {
      if (typeof window !== "undefined" && window.anychart) {
        window.anychart.onDocumentReady(() => {
          const stage = window.acgraph.create("container");
          
          
          window.$.ajax({
            type: "GET",
            url: "https://cdn.anychart.com/svg-data/seat-map/boeing_737.svg",
            success: (svgData) => {
              const data = window.boeingData();
              const chart = window.anychart.seatMap(data);
              chart.geoData(svgData);
              chart.padding([105, 0, 20, 0]).unboundRegions("as-is");
              chart.background().fill("#1E232E"); // Set the background color to #f0f0f0

              chart.container(stage);
              chart.draw();
            },
          });
        });
      }
    });
  }, []);
  return (
    <section className="overflow-hidden pb-[120px] pt-[180px]">
      <div className="container">
        <h1 className="mb-8 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight">
          The world is in your hands
        </h1>
        <div className="flex flex-wrap lg:flex-nowrap -mx-4">
  {/* Globe Component */}
  <div className="w-full lg:w-1/2 px-4">
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

  {/* Plane Seat Map */}
  <div className="w-full lg:w-1/2 px-4 flex flex-col justify-center">
    <div className="shadow-three dark:bg-gray-dark mb-10 mt-12 rounded-sm bg-white p-6 dark:shadow-none lg:mt-0 h-full">
      <section className="relative z-10 overflow-hidden h-full flex items-center">
        <div id="container" className="w-full h-[700px]"></div>
      </section>
    </div>
  </div>
</div>

          <FlightBlog flights={flightResults} />

        </div>
      </section>
  );
};

export default BlogSidebarPage;