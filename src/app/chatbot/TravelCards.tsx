import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Hotel, Car } from 'lucide-react';

interface Seat {
  class: 'Business' | 'Econom-Plus' | 'Economy';
  id: string;
  isReserved: boolean;
}

interface Segment {
  duration: string;
  arrival: { iataCode: string; terminal: string; at: string };
  departure: { iataCode: string; terminal: string; at: string };
}

interface Itinerary {
  duration: string;
  segments: Segment[];
}

interface FlightOffer {
  id: number;
  AirlineCodes: string;
  price: string;
  tripType: 'One Way' | 'Round Trip';
  oneWay: boolean;
  returnDate: string | null;
  itineraries: Itinerary[];
  seatMap: Seat[][];
  bookingLink: string;
}

interface HotelOffer {
  name: string;
  description: string;
  bookUrl: string;
}

interface CarOffer {
  pickupCountry: string;
  pickupCity: string;
  carTypes: { type: string; pricePerDay: number; features: string[]; carTypeFilter: string; passengers: string }[];
  bookingLink: string;
}

// Simple hash function to generate a consistent number from a string
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000000;
  }
  return hash;
};

const getRandomFlightImage = (flightId: number): string => {
  const imageNumber = (flightId % 15) + 1;
  return `/images/flight-images/flight${imageNumber}.jpg`;
};

const getRandomHotelImage = (hotelName: string): string => {
  const hash = simpleHash(hotelName);
  const imageNumber = (hash % 61) + 1;
  return `/images/hotel-images/hotel${imageNumber}.jpg`;
};

const getRandomCarImage = (carType: string): string => {
  const hash = simpleHash(carType);
  const imageNumber = (hash % 15) + 1;
  return `/images/car-images/car${imageNumber}.jpg`;
};

const getAvailableSeats = (seatMap: Seat[][]): { [key: string]: number } => {
  const counts: { [key: string]: number } = {
    Business: 0,
    'Econom-Plus': 0,
    Economy: 0,
  };
  seatMap[0].forEach((seat) => {
    if (!seat.isReserved) {
      counts[seat.class]++;
    }
  });
  return counts;
};

export const FlightCard = ({ offer, bookUrl, index, handleBookNow }: { offer: FlightOffer; bookUrl: string; index: number; handleBookNow: (url: string) => void }) => {
  const availableSeats = getAvailableSeats(offer.seatMap);
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden w-full sm:w-[640px] border border-gray-100 dark:border-gray-800"
      whileHover={{ scale: 1.03, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)" }}
      transition={{ duration: 0.3 }}
      role="article"
      aria-labelledby={`flight-${offer.id}`}
    >
      <div className="relative">
        <img
          src={getRandomFlightImage(offer.id)}
          alt={`Flight ${offer.AirlineCodes} #${offer.id}`}
          className="w-full h-56 sm:h-64 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 right-4 bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
          ${offer.price}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center mb-4">
          <Plane className="w-6 h-6 text-indigo-500 mr-2" />
          <h3 id={`flight-${offer.id}`} className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            {offer.AirlineCodes} Flight #{offer.id}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {offer.itineraries.map((itinerary, idx) => {
            const segment = itinerary.segments[0];
            return (
              <div key={idx} className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {idx === 0 ? 'Outbound' : 'Return'}
                </p>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {segment.departure.iataCode} → {segment.arrival.iataCode}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(segment.departure.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration: {itinerary.duration}</p>
              </div>
            );
          })}
        </div>
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Trip Type: {offer.tripType}</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Available Seats:</p>
          <div className="flex space-x-3">
            {Object.entries(availableSeats).map(([className, count]) => (
              <span key={className} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">
                {className}: {count}
              </span>
            ))}
          </div>
        </div>
        <motion.button
          onClick={() => handleBookNow(bookUrl)}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center transition-all duration-300"
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -2 }}
          aria-label={`Book flight ${offer.AirlineCodes} #${offer.id}`}
        >
          <Plane className="w-5 h-5 mr-2" />
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
};

export const HotelCard = ({ offer, bookUrl, index, handleBookNow }: { offer: HotelOffer; bookUrl: string; index: number; handleBookNow: (url: string) => void }) => {
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden w-full sm:w-[640px] border border-gray-100 dark:border-gray-800"
      whileHover={{ scale: 1.03, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)" }}
      transition={{ duration: 0.3 }}
      role="article"
      aria-labelledby={`hotel-${offer.name}`}
    >
      <div className="relative">
        <img
          src={getRandomHotelImage(offer.name)}
          alt={`Hotel ${offer.name}`}
          className="w-full h-56 sm:h-64 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center mb-4">
          <Hotel className="w-6 h-6 text-indigo-500 mr-2" />
          <h3 id={`hotel-${offer.name}`} className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            {offer.name}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5 line-clamp-3">{offer.description}</p>
        <motion.button
          onClick={() => handleBookNow(bookUrl)}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center transition-all duration-300"
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -2 }}
          aria-label={`Book hotel ${offer.name}`}
        >
          <Hotel className="w-5 h-5 mr-2" />
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
};

export const CarCard = ({
  offer,
  index,
  handleBookNow,
}: {
  offer: CarOffer;
  index: number;
  handleBookNow: (url: string) => void;
}) => {
  const primaryCarType = offer.carTypes[0] || { type: "Unknown", pricePerDay: 0, features: [] };
  console.log("Primary Car Type:", primaryCarType);
  console.log("Car Types:", offer.carTypes);
  const bookUrl = `/cars-details?pickupCountry=${encodeURIComponent(
    offer.pickupCountry
  )}&pickupCity=${encodeURIComponent(offer.pickupCity)}&carType=${encodeURIComponent(
    primaryCarType.type
  )}&pricePerDay=${primaryCarType.pricePerDay}&carFeatures=${primaryCarType.features}&passengers=${'passengers' in primaryCarType ? primaryCarType.passengers : ''}`;

  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden w-full sm:w-[640px] border border-gray-100 dark:border-gray-800"
      whileHover={{ scale: 1.03, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)" }}
      transition={{ duration: 0.3 }}
      role="article"
      aria-labelledby={`car-${index}`}
    >
      <div className="relative">
        <img
          src={getRandomCarImage(primaryCarType.type)}
          alt={`Car ${primaryCarType.type}`}
          className="w-full h-56 sm:h-64 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 right-4 bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
          ${primaryCarType.pricePerDay}/day
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center mb-4">
          <Car className="w-6 h-6 text-indigo-500 mr-2" />
          <h3
            id={`car-${index}`}
            className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100"
          >
            {primaryCarType.type} in {offer.pickupCity}, {offer.pickupCountry}
          </h3>
        </div>
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Location: {offer.pickupCity}, {offer.pickupCountry}
          </p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Features:
          </p>
          <div className="flex flex-wrap gap-2">
            {primaryCarType.features.map((feature, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
        <motion.button
          onClick={() => handleBookNow(bookUrl)}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center transition-all duration-300"
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -2 }}
          aria-label={`Book car ${primaryCarType.type} in ${offer.pickupCity}`}
        >
          <Car className="w-5 h-5 mr-2" />
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
};
