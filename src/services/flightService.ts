import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "./config";

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  flightType: string
) {
  const params = new URLSearchParams({
    origin,
    destination,
    flightType,
    ...(departureDate && { departureDate }),
    ...(returnDate && { returnDate }),
  });

  const response = await fetch(`${API_BASE_URL}/flights/fake?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch flight offers');
  }
  console.log("Flight offers response:", response);
  return response.json();
}

export async function bookFlight(bookingData) {
  try {
    const response = await fetch(`${API_BASE_URL}/flights/book-flight`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token")}`,
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
    const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
    if (!token) throw new Error("No token found");

    interface DecodedToken {
      sub: string;
    }
    const decoded: DecodedToken = jwtDecode(token);
    const userId = decoded.sub;

    const res = await fetch(
      `${API_BASE_URL}/flights/bookings?userId=${userId}`,
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
  const url = `${API_BASE_URL}/flights/all-bookings`;
  const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
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
      `${API_BASE_URL}/flights/bookings/${bookingId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

export const deleteFlightReservation = async (bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/flights/bookings/${bookingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete flight reservation");
    }

    return true;
  } catch (error) {
    console.error("Error deleting flight reservation:", error);
    throw error;
  }
};