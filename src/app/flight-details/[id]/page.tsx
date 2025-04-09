
"use client";
import { Metadata } from "next";
import React, { useEffect, useRef, useState } from "react";
import OfferList from "@/components/Pricing/OfferList";
import PricingBox from "@/components/Pricing/PricingBox";
import { useSearchParams } from "next/navigation";
import {bookFlight} from "@/services/flightService"; // Import flightService
import { jwtDecode } from "jwt-decode";

declare global {
  interface Window {
    anychart: any;
    acgraph: any;
    $: any;
  }
}

const FlightDetails = () => {
  const chartRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const data = searchParams.get("data");
  const initialFlight = data ? JSON.parse(data) : null;
  const [flightData, setFlightData] = useState(initialFlight);

  // Extract userId from localStorage (or sessionStorage)

  const getUserIdFromToken = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.sub; // Assuming 'sub' contains the user ID
      } catch (error) {
        console.error("Error decoding token", error);
        return null;
      }
    }
    return null;
  };

  const userId = getUserIdFromToken();

  const handleBook = async () => {
    if (userId && flightData) {
      const bookingData = {
        userId,
        flightDetails: flightData,
        bookingStatus: 'Pending',
      };
      console.log("Booking Data:", bookingData); // logging the entire object
      await bookFlight(bookingData); // passing the entire object
    }
  };
  

  useEffect(() => {
    // Load external scripts for seat map rendering
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
              if (!flightData || !flightData.seatMap[0]) {
                console.error("No seat map data found in flight data");
                return;
              }

              const seatData = flightData.seatMap[0].map((seat: { id: string; isReserved: boolean; class: string }) => {
                let fillColor = "#4CAF50";
                if (seat.isReserved) {
                  fillColor = "red";
                } else {
                  if (seat.class === "Business") fillColor = "#00BFFF";
                  else if (seat.class === "Econom-Plus") fillColor = "#FFA500";
                  else if (seat.class === "Economy") fillColor = "#4CAF50";
                }
                return {
                  id: seat.id,
                  fill: fillColor,
                  class: seat.class,
                  isReserved: seat.isReserved,
                };
              });
              const chart = window.anychart.seatMap(seatData);
              chart.geoData(svgData);
              chart.padding([10, 0, 15, 0]).unboundRegions("as-is");
              chart.background().fill("#1E232E");
              chart.container(stage);
              chart.draw();
              chartRef.current = chart;

              const series = chart.getSeries(0);

              series
                .fill(function () {
                  var attrs = this.attributes;
                  return attrs ? attrs.fill : this.sourceColor;
                })
                .stroke(function () {
                  var attrs = this.attributes;
                  return attrs ? attrs.stroke : this.sourceColor;
                });

              series.tooltip().useHtml(true);
              series.tooltip().format(function () {
                const seatId = this.getData("id");
                const fill = this.getData("fill");
                const reserved = fill === "red";
                const seatClass = this.getData("class");

                let extraCost = 0;
                if (seatClass === "Business") extraCost = 150;
                else if (seatClass === "Econom-Plus") extraCost = 80;
                else extraCost = 30;

                return (
                  "Seat: " + seatId +
                  "<br>" + (reserved ? "Reserved" : "Available") +
                  "<br>Extra Cost: +" + extraCost + " $"
                );
              });
              series.tooltip().titleFormat("Seat Details");

              series.listen("pointClick", function (e) {
                const seatId = e.point.get("id");
                const seatClass = e.point.get("class");
                if (e.point.get("isReserved")) return;
              
                let extraCost = 0;
                if (seatClass === "Business") extraCost = 150;
                else if (seatClass === "Econom-Plus") extraCost = 80;
                else extraCost = 30;
              
                const currentPrice = parseFloat(flightData.price.replace(',', '.'));
                const newPriceValue = currentPrice + extraCost;
                const newPrice = newPriceValue.toFixed(2).replace('.', ',');
              
                const updatedFlight = {
                  ...flightData,
                  price: newPrice,
                  selectedSeat: {
                    id: seatId,
                    class: seatClass,
                    extraCost: extraCost,
                  },
                };
              
                setFlightData(updatedFlight);
              });
            },
          });
        });
      }
    });
  }, [flightData]);

  return (
    <section className="overflow-hidden pb-[120px] pt-[180px]">
      <div className="container">
        <div className="flex flex-wrap lg:flex-nowrap -mx-4">
          <div className="w-full lg:w-1/2 px-4">
            <PricingBox
              packageName="Flight Information"
              price={flightData?.price || "N/A"}
              duration=""
              subtitle={`Experience a world-class journey with ${flightData?.AirlineCodes || "Unknown Airline"}.`}
              handleBook={handleBook} // Pass the handleBook function to PricingBox
            >
              <OfferList
                text={`Trajectory: ${flightData?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || "Unknown"} → ${flightData?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || "Unknown"}`}
                status="active"
              />
              <OfferList
                text={`Segments: ${flightData?.itineraries?.[0]?.segments?.length || 1} Stop(s)`}
                status="active"
              />
              <OfferList
                text={`Duration: ${flightData?.itineraries?.[0]?.duration || "N/A"}`}
                status="active"
              />
              <OfferList
                text={`Type of Plane: Boeing 737`}
                status="active"
              />
              <OfferList
                text={`Destination: ${flightData?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || "Unknown"}`}
                status="active"
              />
              <OfferList
                text={`Airline: ${flightData?.AirlineCodes || "Unknown Airline"}`}
                status="active"
              />
              <OfferList
                text={`Departure: ${new Date(flightData?.itineraries?.[0]?.segments?.[0]?.departure?.at || "").toLocaleTimeString() || "N/A"}`}
                status="active"
              />
              <OfferList
                text={`Arrival: ${new Date(flightData?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.at || "").toLocaleTimeString() || "N/A"}`}
                status="active"
              />
              <OfferList
                text={`Seat Class: ${flightData?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "Economy"}`}
                status="active"
              />
              {flightData?.selectedSeat && (
                <OfferList
                  text={`Selected Seat: ${flightData.selectedSeat.id} (${flightData.selectedSeat.class} +$ ${flightData.selectedSeat.extraCost} $)`}
                  status="active"
                />
              )}
            </PricingBox>
          </div>
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

export default FlightDetails;
