import axios from "axios";
import { jwtDecode } from "jwt-decode";

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  adults: number
) {
  const url = `http://localhost:8222/api/flights/fake?origin=${origin}&destination=${destination}&departureDate=${departureDate}&returnDate=${returnDate}&adults=${adults}`;
  const response = await fetch(url);
   console.log(response);
  if (!response.ok) {
    throw new Error('Flight search failed');
  }
  return response.json();
}

export async function bookFlight(bookingData) {
  try {
    console.log("Booking Data:", bookingData);
    const response = await fetch("http://localhost:8222/api/flights/book-flight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error("Error booking flight.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error booking flight:", error);
    throw error;
  }
}
export const fetchFlightReservations = async () => {
  try {
    const token = localStorage.getItem("jwt_token");
    if (!token) throw new Error("No token found");

    interface DecodedToken {
      sub: string;
    }
    const decoded: DecodedToken = jwtDecode(token);
    const userId = decoded.sub;

    const res = await fetch(
      `http://localhost:8222/api/flights/bookings?userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch flight reservations");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching flight reservations:", error);
    return [];
  }
};
export async function getPendingBookings() {
  const url = "http://localhost:8222/api/flights/all-bookings";
  const token = localStorage.getItem("jwt_token");
  if (!token) {
    throw new Error("No token found");
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch pending bookings.");
  }

  return response.json();
}

export const updateBookingStatus = async (bookingId: string, status: "Accepted" | "Refused") => {
  try {
    const response = await axios.put(
      `http://localhost:8222/api/flights/bookings/${bookingId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // Assuming it returns the updated booking
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};