"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OfferList from "@/components/Pricing/OfferList";
import PricingBox from "@/components/Pricing/PricingBox";
import { bookFlight } from "@/services/flightService";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

declare global {
  interface Window {
    anychart: any;
    acgraph: any;
    $: any;
  }
}

export default function FlightDetails() {
  const chartRef = useRef<any>(null);
  const params = useSearchParams();
  const [flightData, setFlightData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("pendingFlight");
    if (raw) {
      const flight = JSON.parse(raw);
      console.log("Flight data loaded from sessionStorage:", flight);
      setFlightData(flight);
    } else {
      console.log("No pendingFlight in sessionStorage");
    }
  }, []);

  useEffect(() => {
    if (params.get("login") === "success") {
      toast.success("Login successful! 🎉", { id: "login-success" });
      const qs = new URLSearchParams(window.location.search);
      qs.delete("login");
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs.toString() ? "?" + qs.toString() : "")
      );
    }
  }, [params]);

  useEffect(() => {
    if (!flightData || !flightData.seatMap?.length) return;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.body.appendChild(s);
      });

    (async () => {
      try {
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-base.min.js");
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-ui.min.js");
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-map.min.js");
        await loadScript("https://code.jquery.com/jquery-latest.min.js");

        window.anychart.onDocumentReady(() => {
          const stage = window.acgraph.create("container");

          window.$.ajax({
            type: "GET",
            url: "https://cdn.anychart.com/svg-data/seat-map/boeing_737.svg",
            success: (svgData: string) => {
              const seatData = flightData.seatMap[0].map((seat: any) => {
                let fill = "#4CAF50";
                if (seat.isReserved) fill = "red";
                else if (seat.class === "Business") fill = "#00BFFF";
                else if (seat.class === "Econom-Plus") fill = "#FFA500";
                return {
                  id: seat.id,
                  fill,
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

              const series = chart.getSeries(0);
              series
                .fill(function () {
                  return this.attributes?.fill || this.sourceColor;
                })
                .stroke(function () {
                  return this.attributes?.fill || this.sourceColor;
                });

              series.tooltip().useHtml(true);
              series.tooltip().format(function () {
                const id = this.getData("id");
                const fill = this.getData("fill");
                const reserved = fill === "red";
                const cls = this.getData("class");
                let extra = 0;
                if (cls === "Business") extra = 150;
                else if (cls === "Econom-Plus") extra = 80;
                else extra = 30;
                return (
                  `Seat: ${id}<br>${reserved ? "Reserved" : "Available"}<br>Extra Cost: +$${extra}`
                );
              });

              series.listen("pointClick", (e: any) => {
                if (e.point.get("isReserved")) return;
                const id = e.point.get("id");
                const cls = e.point.get("class");
                let extra = cls === "Business" ? 150 : cls === "Econom-Plus" ? 80 : 30;
                const current = parseFloat(flightData.price.replace(",", "."));
                const newPrice = (current + extra).toFixed(2).replace(".", ",");
                setFlightData({
                  ...flightData,
                  price: newPrice,
                  selectedSeat: { id, class: cls, extraCost: extra },
                });
              });
            },
          });
        });
      } catch (err) {
        console.error("Error loading chart scripts", err);
      }
    })();
  }, [flightData]);

  // Extract user ID from JWT
  const getUserId = () => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("jwt_token");
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.sub;
    } catch {
      return null;
    }
  };
  const userId = getUserId();

  // Handle booking
  const handleBook = async () => {
    if (!userId || !flightData) {
      toast.error("You must be logged in and have a flight selected.");
      return;
    }
  
    try {
      // attempt the booking
      await bookFlight({
        userId,
        flightDetails: flightData,
        bookingStatus: "Pending",
      });
  
      // only clear the session if we got here without throwing
      sessionStorage.removeItem("pendingFlight");
  
      toast.success("Your flight has been booked 🎉");
  
      // give the toast a moment (optional) then redirect
      setTimeout(() => {
        router.push("/");
      }, 800);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Booking failed. Please try again.");
    }
  };

  return (
    <section className="overflow-hidden pb-[120px] pt-[180px]">
      <div className="container">
        {!flightData ? (
          <p>Loading flight…</p>
        ) : (
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
            </PricingBox>            </div>
            <div className="w-full lg:w-1/2 px-4 flex flex-col justify-center">
            <div className="w-full h-full">
              <section className="relative z-10 overflow-hidden h-full flex items-center">
                <div id="container" className="w-full h-[610px]"></div>
              </section>
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
