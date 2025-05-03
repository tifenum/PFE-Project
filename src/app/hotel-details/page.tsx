// frontend/app/hotel-details/page.tsx
import { Suspense } from "react";
import { fetchFakeHotel } from "@/services/hotelService";
import HotelDetailsClient from "./HotelDetailsClient";

interface HotelDetailsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

interface HotelData {
  name: string;
  address: string;
  rooms: Array<{
    type: string;
    price: number;
    features: string[];
  }>;
}

// Server-side page component
const BookHotelPage = async ({ searchParams }: HotelDetailsPageProps) => {
  const hotelName = (searchParams?.hotelName as string) || "";
  const latitude = searchParams?.lat as string;
  const longitude = searchParams?.lng as string;

  // Validate required params
  if (!latitude || !longitude || !hotelName) {
    return <div className="text-center py-10 text-red-500">Error: Missing required params: latitude, longitude, or hotelName</div>;
  }

  // Fetch hotel data server-side
  let hotelData: HotelData | null = null;
  let error: string | null = null;
  try {
    hotelData = await fetchFakeHotel({ latitude, longitude, hotelName });
    if (!hotelData) {
      error = "Failed to fetch hotel data";
    }
  } catch (err) {
    error = (err as Error).message;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  // Parse hotel name on the server
  const parseHotelName = (name: string): string => {
    if (!name) return "";
    const cleanedName = name.replace(/%20/g, " ").toLowerCase();
    return cleanedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };
  const formattedHotelName = parseHotelName(hotelName);

  return (
    <section className="bg-gray-light dark:bg-bg-color-dark py-16 md:py-20 lg:py-28">
      <div className="container">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200">{formattedHotelName}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{hotelData.address}</p>
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-300">Available Rooms</h2>
        <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading...</div>}>
          <HotelDetailsClient hotelData={hotelData} rawHotelName={hotelName} />
        </Suspense>
      </div>
    </section>
  );
};

export default BookHotelPage;