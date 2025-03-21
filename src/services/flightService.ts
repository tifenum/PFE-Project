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
