
"use client"
import { Metadata } from "next";
import React, { useEffect, useRef, useState } from "react";
import OfferList from "@/components/Pricing/OfferList";
import PricingBox from "@/components/Pricing/PricingBox";

declare global {
  interface Window {
    anychart: any;
    acgraph: any;
    $: any;
    boeingData: any;
  }
}
const BlogSidebarPage = () => {
  const chartRef = useRef<any>(null);




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
              chart.padding([10, 0, 10, 0]).unboundRegions("as-is");
              chart.background().fill("#1E232E");
              chartRef.current = chart;

              chart.container(stage);
              chart.draw();
              // chartRef.current.zoom(1.1);

            },
          });
        });
      }
    });
  }, []);
  return (
    <section className="overflow-hidden pb-[120px] pt-[180px]">
      <div className="container">
        <div className="flex flex-wrap lg:flex-nowrap -mx-4">
          {/* Flight Information Card */}
          <div className="w-full lg:w-1/2 px-4">
            {/* <PricingBox
              packageName="Flight Information"
              price="780"
              duration=""
              subtitle="Experience a world-class journey with Air France."
            >
              <OfferList text="Trajectory: New York (JFK) → Paris (CDG)" status="active" />
              <OfferList text="Segments: 1 Stop (London Heathrow - LHR)" status="active" />
              <OfferList text="Duration: 10h 45m" status="active" />
              <OfferList text="Type of Plane: Boeing 777-300ER" status="active" />
              <OfferList text="Destination: Charles de Gaulle, Paris" status="active" />
              <OfferList text="Airline: Air France" status="active" />
              <OfferList text="Departure: 7:30 PM" status="active" />
              <OfferList text="Arrival: 10:15 AM (Next Day)" status="active" />
              <OfferList text="Seat Class: Economy" status="active" />
            </PricingBox> */}
          </div>


  {/* Plane Seat Map */}
  <div className="w-full lg:w-1/2 px-4 flex flex-col justify-center">
            <div className="w-full h-full">
              <section className="relative z-10 overflow-hidden h-full flex items-center">
                <div id="container" className="w-full h-[610px]"></div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSidebarPage;