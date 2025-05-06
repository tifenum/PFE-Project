// services/hotelService.js

import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "./config";

export async function searchCities({ countryCode, keyword, max = 10 }) {
  try {
    const queryParams = new URLSearchParams({ countryCode, keyword, max: max.toString() });
    const res = await fetch(`${API_BASE_URL}/hotels/cities?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch cities");
    }
    // The API returns a JSON array of city objects
    return await res.json();
  } catch (error) {
    console.error("Error searching cities:", error);
    return [];
  }
}
export const searchHotels = async ({ cityCode }) => {
  const response = await fetch(`${API_BASE_URL}/hotels/search?cityCode=${cityCode}`);
  if (!response.ok) {
    throw new Error("Failed to fetch hotels");
  }
  return response.json();
};
export const searchHotelsByGeocode = async ({ latitude, longitude, radius }) => {
  const response = await fetch(`${API_BASE_URL}/hotels/by-geocode?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
  if (!response.ok) {
    throw new Error("Failed to fetch hotels by geocode");
  }
  return response.json();
};
export const searchHotelsByKeyword = async ({ keyword }) => {
  try {
    const queryParams = new URLSearchParams({ keyword });
    const res = await fetch(`${API_BASE_URL}/hotels/by-keyword?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch hotels by keyword");
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching hotels by keyword:", error);
    return [];
  }
};
export const fetchFakeHotel = async ({ latitude, longitude, hotelName }) => {
  try {
    const queryParams = new URLSearchParams({
      latitude,
      longitude,
      hotelName: encodeURIComponent(hotelName), // Make sure hotelName is URL-safe
    });
    const res = await fetch(`${API_BASE_URL}/hotels/fake?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch fake hotel data");
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching fake hotel:", error);
    return null;
  }
};
export const createBooking = async (bookingData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/hotels/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,

      },
      body: JSON.stringify(bookingData),
    });

    if (!res.ok) {
      throw new Error("Failed to create booking");
    }

    return await res.json();
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};


export const fetchHotelReservations = async () => {
  try {
    const token = localStorage.getItem("jwt_token");

    if (!token) throw new Error("No token found");

    interface DecodedToken {
      sub: string; // Adjust the type of 'sub' based on your JWT structure
    }
    const decoded: DecodedToken = jwtDecode(token);
    const userId = decoded.sub;

    const res = await fetch(`${API_BASE_URL}/hotels/reservations?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // optional, remove if your API doesn't expect it
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch hotel reservations");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching hotel reservations:", error);
    return [];
  }
};

// services/flightService.ts


export const fetchAllPendingHotelReservations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/hotels/all-reservations`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch all pending hotel reservations");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching all pending hotel reservations:", error);
    return [];
  }
};


export const updateHotelReservationStatus = async (reservationId: string, status: "Accepted" | "Refused") => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/hotels/reservations/${reservationId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // Assuming it returns the updated reservation
  } catch (error) {
    console.error("Error updating reservation status:", error);
    throw error;
  }
}