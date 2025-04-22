"use client";
import { useState, useEffect } from "react";
// Assuming a service to fetch hotel reservations exists
import { fetchAllPendingHotelReservations, updateHotelReservationStatus } from "@/services/hotelService"; // Adjust imports
import { toast } from "sonner";
const HotelReservationsPage = () => {
  const [hotelReservations, setHotelReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const hotelData = await fetchAllPendingHotelReservations(); // Fetch all hotel reservations
        setHotelReservations(hotelData);
        console.log(hotelData);
      } catch (error) {
        console.error("Error fetching hotel reservations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Accepted": return "text-green-600 font-semibold";
      case "Pending": return "text-yellow-500 font-semibold";
      case "Rejected": return "text-red-500 font-semibold";
      default: return "";
    }
  };
  const handleStatusChange = async (reservationId: string, newStatus: "Accepted" | "Refused") => {
    try {
      const updatedReservation = await updateHotelReservationStatus(reservationId, newStatus);
      // Option 1: Update state locally (no reload)
      setHotelReservations((prevReservations) =>
        prevReservations.map((res) =>
          res.id === reservationId ? { ...res, reservationStatus: newStatus } : res
        )
      );
      if (newStatus === "Accepted") {
        toast.success("Reservation accepted! 🏨");
      } else {
        toast.error("Reservation refused ❌");
      }
    } catch (error) {
      console.error(`Error updating reservation ${reservationId} to ${newStatus}:`, error);
      toast.error("Failed to update reservation status. Try again 😓");
    }
  };
  if (loading) {
    return (
      <section className="py-16 md:py-20 lg:py-28">
        <div className="container text-center">
          <p>Loading hotel reservations...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Hotel Reservations
          </h2>
          <p className="text-base text-body-color mt-3 max-w-xl mx-auto">
            View and manage all hotel reservations here.
          </p>
        </div>

        <div className="overflow-x-auto">
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
  {hotelReservations.length > 0 ? (
    hotelReservations.map((res) => (
      <tr key={res.id || `${res.hotelName}-${res.checkInDate}`} className="border-t border-gray-200 dark:border-gray-700">
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{decodeURIComponent(res.hotelName) || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.hotelAddress || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.checkInDate || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.checkOutDate || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.guests ?? "N/A"}</td>
        <td className="px-6 py-4 text-sm flex gap-2">
                      {res.reservationStatus === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleStatusChange(res.id, "Accepted")}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(res.id, "Refused")}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 text-xs"
                          >
                            Refuse
                          </button>
                        </>
                      ) : (
                        <span
                          className={
                            res.reservationStatus === "Accepted"
                              ? "text-green-600 font-semibold"
                              : "text-red-500 font-semibold"
                          }
                        >
                          {res.reservationStatus || "-"}
                        </span>
                      )}
                    </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
        No hotel reservations found
      </td>
    </tr>
  )}
</tbody>

          </table>
        </div>
      </div>
    </section>
  );
};

export default HotelReservationsPage;