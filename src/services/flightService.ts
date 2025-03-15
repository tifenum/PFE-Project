export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  adults: number
) {
  const url = `http://localhost:8222/api/flights/search?origin=${origin}&destination=${destination}&departureDate=${departureDate}&adults=${adults}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Flight search failed');
  }
  return response.json();
}
