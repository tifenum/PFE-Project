'use client';
import { useState, useEffect } from "react";
import { fetchHotelReservations } from "@/services/hotelService"; // Adjust import path accordingly

// Mock Data with Status
const flightReservations = [
  {
    id: 1,
    type: "One-Way",
    from: "New York (JFK)",
    to: "London (LHR)",
    date: "2025-04-15",
    time: "08:30 AM",
    airline: "British Airways",
    status: "Accepted",
  },
  {
    id: 2,
    type: "Round-Trip",
    from: "Paris (CDG)",
    to: "Tokyo (NRT)",
    date: "2025-05-01",
    returnDate: "2025-05-14",
    time: "10:00 AM",
    airline: "Air France",
    status: "Pending",
  },
];

const ReservationsPage = () => {
  const [activeTab, setActiveTab] = useState<"flight" | "hotel">("flight");
  const [hotelReservations, setHotelReservations] = useState<any[]>([]); // Add state for hotel reservations

  useEffect(() => {
    const fetchReservations = async () => {
      const reservations = await fetchHotelReservations();
      console.log(reservations);
      setHotelReservations(reservations);
    };

    fetchReservations();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Accepted":
        return "text-green-600 font-semibold";
      case "Pending":
        return "text-yellow-500 font-semibold";
      case "Rejected":
        return "text-red-500 font-semibold";
      default:
        return "";
    }
  };

  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Your Reservations
          </h2>
          <p className="text-base text-body-color mt-3 max-w-xl mx-auto">
            Toggle between flight and hotel reservations below.
          </p>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                activeTab === "flight"
                  ? "bg-primary text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
              }`}
              onClick={() => setActiveTab("flight")}
            >
              Flight Reservations
            </button>
            <button
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                activeTab === "hotel"
                  ? "bg-primary text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
              }`}
              onClick={() => setActiveTab("hotel")}
            >
              Hotel Reservations
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === "flight" ? (
            <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">From</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">To</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Airline</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Return</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {flightReservations.map((res) => (
                  <tr key={res.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.from}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.to}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.time}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.airline}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.returnDate ?? "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getStatusStyle(res.status)}>{res.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Hotel</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Check-In</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Check-Out</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Guests</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody>
  {hotelReservations.map((res, index) => (
    <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {decodeURIComponent(res.hotelName)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {res.hotelAddress}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {res.checkInDate}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {res.checkOutDate}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {res.guests ?? "N/A"}
      </td>
      <td className="px-6 py-4 text-sm">
        <span className={getStatusStyle(res.status)}>{res.status}</span>
      </td>
    </tr>
  ))}
</tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReservationsPage;
