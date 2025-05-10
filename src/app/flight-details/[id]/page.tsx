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
  const stageRef = useRef<any>(null);
  const seatMapRef = useRef<any[]>([]);
  const params = useSearchParams();
  const [flightData, setFlightData] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [price, setPrice] = useState<string>("N/A");
  const router = useRouter();

  // Generate random flight image
  const getRandomFlightImage = (index: number): string => {
    const imageNumber = Math.floor(Math.random() * 15) + 1;
    return `/images/flight-images/flight${imageNumber}.jpg`;
  };

  // Track theme changes
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    updateTheme(); // Initial check

    const observer = new MutationObserver(() => {
      updateTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("pendingFlight");
    if (raw) {
      const flight = JSON.parse(raw);
      setFlightData(flight);
      setPrice(flight?.price || "N/A");
      seatMapRef.current = flight?.seatMap?.[0] || [];
    } else {
      console.error("No pendingFlight in sessionStorage");
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
    if (!flightData || !seatMapRef.current.length) return;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.body.appendChild(s);
      });

    const renderChart = async () => {
      try {
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-base.min.js");
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-ui.min.js");
        await loadScript("https://cdn.anychart.com/releases/v8/js/anychart-map.min.js");
        await loadScript("https://code.jquery.com/jquery-latest.min.js");

        window.anychart.onDocumentReady(() => {
          // Clear previous stage
          if (stageRef.current) {
            stageRef.current.remove();
            stageRef.current = null;
          }

          // Create new stage
          stageRef.current = window.acgraph.create("container");

          window.$.ajax({
            type: "GET",
            url: "https://cdn.anychart.com/svg-data/seat-map/boeing_737.svg",
            dataType: "text",
            success: (svgData: string) => {
              const isDarkMode = theme === "dark";

              // Adjust SVG plane body for theme
              let modifiedSvg = svgData;
              if (isDarkMode) {
                modifiedSvg = svgData
                  .replace(/fill="#F[0-9A-F]{6}"/gi, 'fill="#FFFFFF"')
                  .replace(/fill="#E[0-9A-F]{6}"/gi, 'fill="#FFFFFF"')
                  .replace(/fill="white"/gi, 'fill="#FFFFFF"');
              } else {
                modifiedSvg = svgData
                  .replace(/fill="#F[0-9A-F]{6}"/gi, 'fill="#E5E7EB"')
                  .replace(/fill="#E[0-9A-F]{6}"/gi, 'fill="#E5E7EB"')
                  .replace(/fill="white"/gi, 'fill="#E5E7EB"');
              }

              const seatData = seatMapRef.current.map((seat: any) => {
                let fill;
                if (seat.isReserved) {
                  fill = isDarkMode ? '#4B5563' : '#9CA3AF'; // Reserved
                } else {
                  switch (seat.class) {
                    case "Business":
                      fill = isDarkMode ? '#60A5FA' : '#1D4ED8';
                      break;
                    case "Econom-Plus":
                      fill = isDarkMode ? '#93C5FD' : '#3B82F6';
                      break;
                    case "Economy":
                      fill = isDarkMode ? '#BFDBFE' : '#60A5FA';
                      break;
                    default:
                      fill = isDarkMode ? '#BFDBFE' : '#60A5FA';
                  }
                }
                return {
                  id: seat.id,
                  fill,
                  class: seat.class,
                  isReserved: seat.isReserved,
                };
              });

              const chart = window.anychart.seatMap(seatData);
              chart.geoData(modifiedSvg);
              chart.padding([10, 0, 15, 0]).unboundRegions("as-is");
              chart.background().fill(isDarkMode ? '#1F2937' : '#F3F4F6');
              chart.container(stageRef.current);
              chart.draw();

              chartRef.current = chart; // Store chart instance

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
                const reserved = this.getData("isReserved");
                const cls = this.getData("class");
                let extra = 0;
                if (cls === "Business") extra = 150;
                else if (cls === "Econom-Plus") extra = 80;
                else extra = 30;
                return (
                  `Seat: ${id}<br>Status: ${reserved ? "Reserved" : "Available"}<br>Class: ${cls}<br>Extra Cost: +$${extra}`
                );
              });

              series.listen("pointClick", (e: any) => {
                if (e.point.get("isReserved")) return;
                const id = e.point.get("id");
                const cls = e.point.get("class");
                const extra = cls === "Business" ? 150 : cls === "Econom-Plus" ? 80 : 30;
                const current = parseFloat(price.replace(",", "."));
                const newPrice = (current + extra).toFixed(2).replace(".", ",");
                setPrice(newPrice);
                setSelectedSeat({ id, class: cls, extraCost: extra });
              });
            },
            error: (xhr: any, status: string, error: string) => {
              console.error("Failed to load SVG:", status, error);
            },
          });
        });
      } catch (err) {
        console.error("Error loading chart scripts", err);
      }
    };

    renderChart();

    // Cleanup on unmount or theme change
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
      if (stageRef.current) {
        stageRef.current.remove();
        stageRef.current = null;
      }
    };
  }, [flightData, theme]);

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

  const handleBook = async () => {
    if (!userId || !flightData) {
      toast.error("You must be logged in and have a flight selected.");
      return;
    }
    if (!selectedSeat) {
      toast.error("Please select a seat before booking.");
      return;
    }

    try {
      await bookFlight({
        userId,
        flightDetails: { ...flightData, price, selectedSeat },
        bookingStatus: "Pending",
      });

      sessionStorage.removeItem("pendingFlight");
      toast.success("Your flight has been booked 🎉");

      setTimeout(() => {
        router.push("/");
      }, 800);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Booking failed. Please try again.");
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        {!flightData ? (
          <div className="text-center text-gray-600 dark:text-gray-400 animate-pulse text-lg">
            Loading flight details...
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="relative w-full h-64 md:h-80 lg:h-96 mb-12 rounded-2xl overflow-hidden shadow-xl">
              <img
                src={getRandomFlightImage(flightData.id || 1)}
                alt="Flight Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/images/flight-images/flight1.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {flightData?.AirlineCodes || "Your Flight"} to{" "}
                  {flightData?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || "Destination"}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <PricingBox
                  packageName="Flight Information"
                  price={price}
                  duration=""
                  subtitle={`Experience a world-class journey with ${flightData?.AirlineCodes || "Unknown Airline"}.`}
                  handleBook={handleBook}
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
                  {selectedSeat && (
                    <OfferList
                      text={`Selected Seat: ${selectedSeat.id} (${selectedSeat.class} +$${selectedSeat.extraCost})`}
                      status="active"
                    />
                  )}
                </PricingBox>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Select Your Seat</h2>
                <div id="container" className="w-full h-[400px] sm:h-[500px] md:h-[550px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
