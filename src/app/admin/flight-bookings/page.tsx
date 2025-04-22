"use client";
import { useState, useEffect } from "react";
import { getPendingBookings, updateBookingStatus } from "@/services/flightService"; // Adjust import, added updateBookingStatus
import { toast,Toaster } from "sonner";

const FlightBookingsPage = () => {
  const [flightBookings, setFlightBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const flightData = await getPendingBookings();
        setFlightBookings(flightData);
      } catch (error) {
        console.error("Error fetching flight bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle Accept/Refuse actions
  const handleStatusChange = async (bookingId: string, newStatus: "Accepted" | "Refused") => {
    try {
      const updatedBooking = await updateBookingStatus(bookingId, newStatus);
      // Option 1: Update state locally (no reload)
      setFlightBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, bookingStatus: newStatus } : booking
        )
      );
      if (newStatus === "Accepted") {
        toast.success("Booking accepted! ✈️");
      } else {
        toast.error("Booking refused ❌");
      }
    } catch (error) {
      console.error(`Error updating booking ${bookingId} to ${newStatus}:`, error);
      toast.error("Failed to update booking status. Try again 😓");
    }
  };

  if (loading) {
    return (
      <section className="py-16 md:py-20 lg:py-28">
        <div className="container text-center">
          <p>Loading flight bookings...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 lg:py-28">
          <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Flight Bookings
          </h2>
          <p className="text-base text-body-color mt-3 max-w-xl mx-auto">
            View and manage all flight bookings here.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Type</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">From</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">To</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Time</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Price</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flightBookings.length > 0 ? (
                flightBookings.map((booking, index) => (
                  <tr
                    key={`${booking.id || index}-${booking.departureAirport}-${booking.departureTime}`}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{booking.tripType || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{booking.departureAirport || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{booking.arrivalAirport || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(booking.departureTime)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatTime(booking.departureTime)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{booking.totalPrice || "-"}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      {/* Show buttons only if status is Pending */}
                      {booking.bookingStatus === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleStatusChange(booking.id, "Accepted")}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, "Refused")}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 text-xs"
                          >
                            Refuse
                          </button>
                        </>
                      ) : (
                        <span
                          className={
                            booking.bookingStatus === "Accepted"
                              ? "text-green-600 font-semibold"
                              : "text-red-500 font-semibold"
                          }
                        >
                          {booking.bookingStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No flight bookings found
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

export default FlightBookingsPage;