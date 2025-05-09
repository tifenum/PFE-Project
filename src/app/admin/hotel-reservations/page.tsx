"use client";
import { useState, useEffect } from "react";
import { fetchAllPendingHotelReservations, updateHotelReservationStatus } from "@/services/hotelService";
import { toast, Toaster } from "sonner";

const HotelReservationsPage = () => {
  const [hotelReservations, setHotelReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const hotelData = await fetchAllPendingHotelReservations();
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
      case "Refused": return "text-red-500 font-semibold";
      default: return "";
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: "Accepted" | "Refused") => {
    try {
      await updateHotelReservationStatus(reservationId, newStatus);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalPages = Math.ceil(hotelReservations.length / itemsPerPage);
  const paginatedHotelReservations = hotelReservations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const renderPagination = (currentPage: number, totalPages: number, setPage: (page: number) => void) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-6 space-x-2">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            currentPage === 1
              ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              currentPage === pageNum
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}
            onClick={() => setPage(pageNum)}
          >
            {pageNum}
          </button>
        ))}
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            currentPage === totalPages
              ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16 md:py-20 lg:py-28">
        <div className="container text-center">
          <div className="flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-t-[#4A6CF7] border-[#4A6CF7]/30 rounded-full animate-spin"></div>
          </div>
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
          <table className="min-w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow">
            <thead className="bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Hotel</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Location</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Check-In</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Check-Out</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHotelReservations.length > 0 ? (
                paginatedHotelReservations.map((res) => (
                  <tr key={res.id || `${res.hotelName}-${res.checkInDate}`} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{decodeURIComponent(res.hotelName) || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{res.hotelAddress || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(res.checkInDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(res.checkOutDate)}</td>
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
                        <span className={getStatusStyle(res.reservationStatus)}>
                          {res.reservationStatus || "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hotel reservations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && renderPagination(page, totalPages, setPage)}
        </div>

        <div className="absolute right-0 top-0 z-[-1] opacity-30 lg:opacity-100">
          <svg
            width="450"
            height="556"
            viewBox="0 0 450 556"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="277"
              cy="63"
              r="225"
              fill="url(#paint0_linear_25:217)"
            />
            <circle
              cx="17.9997"
              cy="182"
              r="18"
              fill="url(#paint1_radial_25:217)"
            />
            <circle
              cx="76.9997"
              cy="288"
              r="34"
              fill="url(#paint2_radial_25:217)"
            />
            <circle
              cx="325.486"
              cy="302.87"
              r="180"
              transform="rotate(-37.6852 325.486 302.87)"
              fill="url(#paint3_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="184.521"
              cy="315.521"
              r="132.862"
              transform="rotate(114.874 184.521 315.521)"
              stroke="url(#paint4_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="356"
              cy="290"
              r="179.5"
              transform="rotate(-30 356 290)"
              stroke="url(#paint5_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="191.659"
              cy="302.659"
              r="133.362"
              transform="rotate(133.319 191.659 302.659)"
              fill="url(#paint6_linear_25:217)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_25:217"
                x1="-54.5003"
                y1="-178"
                x2="222"
                y2="288"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient
                id="paint1_radial_25:217"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(17.9997 182) rotate(90) scale(18)"
              >
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient
                id="paint2_radial_25:217"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(76.9997 288) rotate(90) scale(34)"
              >
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <linearGradient
                id="paint3_linear_25:217"
                x1="226.775"
                y1="-66.1548"
                x2="292.157"
                y2="351.421"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint4_linear_25:217"
                x1="184.521"
                y1="182.159"
                x2="184.521"
                y2="448.882"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint5_linear_25:217"
                x1="356"
                y1="110"
                x2="356"
                y2="470"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint6_linear_25:217"
                x1="118.524"
                y1="29.2497"
                x2="166.965"
                y2="338.63"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 z-[-1] opacity-30 lg:opacity-100">
          <svg
            width="364"
            height="201"
            viewBox="0 0 364 201"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24"
              stroke="url(#paint0_linear_25:218)"
            />
            <path
              d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24"
              stroke="url(#paint1_linear_25:218)"
            />
            <path
              d="M-53.1107 72.3303C-25.3401 66.4798 42.3965 64.9086 91.1783 105.427C152.155 156.076 170.59 162.093 205.333 166.607C240.076 171.12 278.718 183.657 303.889 212.24"
              stroke="url(#paint2_linear_25:218)"
            />
            <path
              d="M-98.1618 65.0889C-68.1416 60.0601 4.73364 60.4882 56.0734 102.431C120.248 154.86 139.905 161.419 177.137 166.956C214.37 172.493 255.575 186.165 281.856 215.481"
              stroke="url(#paint3_linear_25:218)"
            />
            <circle
              opacity="0.8"
              cx="214.505"
              cy="60.5054"
              r="49.7205"
              transform="rotate(-13.421 214.505 60.5054)"
              stroke="url(#paint4_linear_25:218)"
            />
            <circle cx="220" cy="63" r="43" fill="url(#paint5_radial_25:218)" />
            <defs>
              <linearGradient
                id="paint0_linear_25:218"
                x1="184.389"
                y1="69.2405"
                x2="184.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_25:218"
                x1="156.389"
                y1="69.2405"
                x2="156.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint2_linear_25:218"
                x1="125.389"
                y1="69.2405"
                x2="125.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint3_linear_25:218"
                x1="93.8507"
                y1="67.2674"
                x2="89.9278"
                y2="210.214"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" />
              </linearGradient>
              <linearGradient
                id="paint4_linear_25:218"
                x1="214.505"
                y1="10.2849"
                x2="212.684"
                y2="99.5816"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient
                id="paint5_radial_25:218"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(220 63) rotate(90) scale(43)"
              >
                <stop offset="0.145833" stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" stopOpacity="0.08" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
      <Toaster />
    </section>
  );
};

export default HotelReservationsPage;