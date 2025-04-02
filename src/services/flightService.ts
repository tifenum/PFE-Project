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
    console.log("Booking Data:", bookingData); // logging the entire object
    const response = await fetch("http://localhost:8222/api/flights/book-flight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData), // sending the full object
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
