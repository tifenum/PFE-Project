import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "./config";

export async function searchCities({ countryCode, keyword, max = 10 }) {
  try {
    const queryParams = new URLSearchParams({ countryCode, keyword, max: max.toString() });
    const res = await fetch(`${API_BASE_URL}/cars/cities?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch cities");
    }
    return await res.json();
  } catch (error) {
    console.error("Error searching cities:", error);
    return [];
  }
}

export async function searchCars({ pickupCountry, pickupCity, carType, passengers }) {
  try {
    const queryParams = new URLSearchParams({
      pickupCountry,
      pickupCity,
      carType,
      passengers,
    });
    const res = await fetch(`${API_BASE_URL}/cars/fake?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch cars");
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching cars:", error);
    return null;
  }
}

export async function createBooking(bookingData) {
  try {
    const res = await fetch(`${API_BASE_URL}/cars/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token")}`,
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
}

export async function fetchCarReservations() {
  try {
    const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
    if (!token) throw new Error("No token found");

    const decoded = jwtDecode(token);
    const userId = decoded.sub;

    const res = await fetch(`${API_BASE_URL}/cars/reservations?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch car reservations");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching car reservations:", error);
    return [];
  }
}

export async function fetchAllPendingCarReservations() {
  try {
    const res = await fetch(`${API_BASE_URL}/cars/all-reservations`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch all pending car reservations");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching all pending car reservations:", error);
    return [];
  }
}

export async function updateCarReservationStatus(reservationId: string, status: string) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/cars/reservations/${reservationId}/status`,
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
    console.error("Error updating car reservation status:", error);
    throw error;
  }
}

export async function deleteCarReservation(reservationId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/cars/reservations/${reservationId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to delete car reservation");
    }

    return true;
  } catch (error) {
    console.error("Error deleting car reservation:", error);
    throw error;
  }
}