// services/hotelService.js

export async function searchCities({ countryCode, keyword, max = 10 }) {
  try {
    const queryParams = new URLSearchParams({ countryCode, keyword, max: max.toString() });
    const res = await fetch(`http://localhost:8222/api/hotels/cities?${queryParams.toString()}`);
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
  const response = await fetch(`http://localhost:8222/api/hotels/search?cityCode=${cityCode}`);
  if (!response.ok) {
    throw new Error("Failed to fetch hotels");
  }
  return response.json();
};
export const searchHotelsByGeocode = async ({ latitude, longitude, radius }) => {
  const response = await fetch(`http://localhost:8222/api/hotels/by-geocode?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
  if (!response.ok) {
    throw new Error("Failed to fetch hotels by geocode");
  }
  return response.json();
};
export const searchHotelsByKeyword = async ({ keyword }) => {
  try {
    const queryParams = new URLSearchParams({ keyword });
    const res = await fetch(`http://localhost:8222/api/hotels/by-keyword?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch hotels by keyword");
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching hotels by keyword:", error);
    return [];
  }
};
