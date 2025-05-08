// frontend/app/hotel-details/page.tsx
import HotelDetailsClient from "./HotelDetailsClient";

interface HotelDetailsPageProps {
  searchParams: Promise<{ hotelName?: string; lat?: string; lng?: string }>;
}

export default async function BookHotelPage({ searchParams }: HotelDetailsPageProps) {
  const params = await searchParams;
  const rawHotelName = params.hotelName || "";
  const latitude     = params.lat         || "";
  const longitude    = params.lng         || "";

  if (!rawHotelName || !latitude || !longitude) {
    return (
      <div className="text-center py-10 text-red-500">
        Error: Missing required query params: hotelName, lat, or lng
      </div>
    );
  }

  return (
    <section className="bg-gray-light dark:bg-bg-color-dark py-16 md:py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <HotelDetailsClient
          rawHotelName={rawHotelName}
          latitude={latitude}
          longitude={longitude}
        />
      </div>
    </section>
  );
}
