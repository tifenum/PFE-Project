import { Feature } from "@/types/feature";

const featuresData: Feature[] = [
  {
    id: 1,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M30 20L40 25L35 30L25 25L30 20Z"
        />
        <path
          d="M20 5L30 10L25 20L15 20L10 10L20 5ZM10 25L15 30L20 25L25 30L30 25L35 30L30 35L20 30L10 35L5 30L10 25Z"
        />
      </svg>
    ),
    title: "Book Flights",
    paragraph:
      "Find the best flight deals across top airlines. Compare prices, choose flexible dates, and book with ease for your next adventure.",
  },
  {
    id: 2,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M10 30H30V35H10V30Z"
        />
        <path
          d="M5 5H35V25H5V5ZM10 10H15V15H10V10ZM25 10H30V15H25V10Z"
        />
      </svg>
    ),
    title: "Hotel Reservations",
    paragraph:
      "Discover cozy hotels or luxury resorts tailored to your budget. Secure your stay with instant confirmations and exclusive offers.",
  },
  {
    id: 3,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M10 30H15V35H10V30ZM25 30H30V35H25V30Z"
        />
        <path
          d="M5 10H35V25H5V10ZM10 15H30V20H10V15Z"
        />
      </svg>
    ),
    title: "Car Rentals",
    paragraph:
      "Rent a car for your trip with flexible pick-up and drop-off options. Choose from economy to premium vehicles at competitive rates.",
  },
  {
    id: 4,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M20 5C12.5 5 5 12.5 5 20C5 27.5 12.5 35 20 35C27.5 35 35 27.5 35 20"
        />
        <path
          d="M20 0C8.95 0 0 8.95 0 20C0 31.05 8.95 40 20 40C31.05 40 40 31.05 40 20C40 8.95 31.05 0 20 0ZM15 25L10 20L15 15L20 20L15 25Z"
        />
      </svg>
    ),
    title: "Exclusive Deals",
    paragraph:
      "Unlock special discounts and bundled packages for flights, hotels, and cars. Save more when you plan your entire trip with us.",
  },
  {
    id: 5,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M5 30H35V35H5V30Z"
        />
        <path
          d="M20 5C15 5 10 10 10 15C10 20 15 25 20 25C25 25 30 20 30 15C30 10 25 5 20 5ZM15 15H25V20H15V15Z"
        />
      </svg>
    ),
    title: "24/7 Support",
    paragraph:
      "Our dedicated team is here round-the-clock to assist with bookings, changes, or any travel queries, ensuring a smooth journey.",
  },
  {
    id: 6,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path
          opacity="0.5"
          d="M5 30H35V35H5V30Z"
        />
        <path
          d="M5 5H35V25H5V5ZM10 10H30V12H10V10ZM10 15H25V17H10V15ZM10 20H20V22H10V20Z"
        />
      </svg>
    ),
    title: "Travel Itinerary Planner",
    paragraph:
      "Plan your trip day-by-day with personalized suggestions for activities, dining, and sights, all tailored to your preferences.",
  },
];

export default featuresData;