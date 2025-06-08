"use client";
import { useEffect, useState, useMemo } from "react";
import { fetchFakeHotel, createBooking } from "@/services/hotelService";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Room {
  type: string;
  price: number;
  features: string[];
}

interface HotelData {
  name: string;
  address: string;
  rooms: Room[];
}

interface HotelDetailsClientProps {
  rawHotelName: string;
  latitude: string;
  longitude: string;
}

export default function HotelDetailsClient({ rawHotelName, latitude, longitude }: HotelDetailsClientProps) {
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomToBook, setRoomToBook] = useState<Room | null>(null);
  const router = useRouter();

  // Parse hotel name: remove ?login=success, replace %20, capitalize first letters
  const parseHotelName = (name: string) => {
    if (!name) return "";
    const cleanedName = decodeURIComponent(name)
      .replace(/\?login=success/gi, "")
      .replace(/%20/g, " ")
      .toLowerCase()
      .trim();
    return cleanedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const displayName = parseHotelName(rawHotelName);

  // Generate random hotel image between 1 and 63
  const getRandomHotelImage = (): string => {
    const imageNumber = Math.floor(Math.random() * 63) + 1;
    return `/images/hotel-images/hotel${imageNumber}.jpg`;
  };

  // Generate stable images for hero and rooms
  const hotelImages = useMemo(() => {
    const hero = getRandomHotelImage();
    // Generate unique images for rooms, avoiding duplicates
    const roomImages: string[] = [];
    const usedNumbers = new Set<number>();
    
    while (roomImages.length < 10) { // Max 10 rooms to prevent infinite loop
      const imageNumber = Math.floor(Math.random() * 63) + 1;
      if (!usedNumbers.has(imageNumber)) {
        usedNumbers.add(imageNumber);
        roomImages.push(`/images/hotel-images/hotel${imageNumber}.jpg`);
      }
    }
    
    return { hero, rooms: roomImages };
  }, []); // Empty dependency array ensures images are generated once on mount

  // Fetch hotel data
  useEffect(() => {
    const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
    if (!token) {
      toast.error("No auth token, please login.");
      setLoading(false);
      return;
    }

    fetchFakeHotel({ latitude, longitude, hotelName: rawHotelName })
      .then((data) => {
        if (data) {
          setHotelData({
            ...data,
            name: parseHotelName(data.name), // Parse name from fetchFakeHotel
          });
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load hotel details.");
      })
      .finally(() => setLoading(false));
  }, [latitude, longitude, rawHotelName]);

  if (loading) return <p className="text-center text-gray-600 dark:text-gray-400 animate-pulse">Loading Available Rooms...</p>;
  if (!hotelData) return <p className="text-center text-red-500">No hotel data found.</p>;

  const openBooking = (room: Room) => setRoomToBook(room);
  const closeBooking = () => setRoomToBook(null);

  const getUserIdFromToken = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token") : null;
    if (token) {
      try {
        const decodedToken = jwtDecode<{ sub: string }>(token);
        return decodedToken.sub;
      } catch (error) {
        console.error("Error decoding token", error);
        return null;
      }
    }
    return null;
  };
  const userId = getUserIdFromToken();

  return (
    <>
      {/* Hero Section with rounded corners */}
      <div className="relative mb-12 overflow-hidden rounded-2xl">
        <img
          src={hotelImages.hero}
          alt={`${displayName} Hero`}
          className="w-full h-64 md:h-96 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/hotel-images/hotel1.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{displayName}</h1>
            <p className="text-lg text-gray-200">{hotelData.address}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-white">Available Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotelData.rooms.map((room, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105"
            >
              <img
                src={hotelImages.rooms[idx] || "/images/hotel-images/hotel1.jpg"}
                alt={`${room.type} Image`}
                className="w-full h-64 object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/hotel-images/hotel1.jpg";
                }}
              />
              <div className="flex flex-col p-6 h-80 bg-gradient-to-t from-gray-100/90 to-transparent dark:from-gray-800/90 dark:to-transparent">
                <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">{room.type}</h3>
                <p className="mb-3 text-gray-600 dark:text-gray-300">Price: ${room.price} / night</p>
                <ul className="list-none mb-4 space-y-2 flex-grow">
                  {[...new Set(room.features)].slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openBooking(room)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-auto"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {roomToBook && (
        <BookingModal room={roomToBook} hotelData={hotelData} onClose={closeBooking} userId={userId} />
      )}
    </>
  );
}

const BookingModal = ({ room, hotelData, userId, onClose }) => {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [note, setNote] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (checkIn && checkOut && checkOut > checkIn) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const diffMs = outDate.getTime() - inDate.getTime();
      const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setTotalPrice(nights * room.price);
    } else {
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, room.price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkIn || !checkOut) {
      toast.warning("You should pick your check-in and check-out dates!");
      return;
    }
    if (checkIn < today) {
      toast.error("Check-in can’t be in the past");
      return;
    }
    if (checkOut <= checkIn) {
      toast.warning("Check-out’s must be after check-in");
      return;
    }

    const bookingData = {
      userId,
      hotelName: hotelData.name, // Already parsed in hotelData
      hotelAddress: hotelData.address,
      roomType: room.type,
      roomFeatures: room.features,
      roomPricePerNight: room.price,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      notes: note,
    };

    setIsSubmitting(true);
    try {
      const savedBooking = await createBooking(bookingData);
      toast.success("Booking confirmed, Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
      onClose();
    } catch (error) {
      toast.error("Failed to book the room. Try again");
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-500 ease-out scale-0 animate-[modalFadeIn_0.5s_ease-out_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx>{`
          @keyframes modalFadeIn {
            from {
              transform: scale(0.7);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Book {room.type}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          At {hotelData.name}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Check-in Date
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Check-out Date
              </label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Special requests..."
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">Room: {room.type}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Price per Night: ${room.price}
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-2">
              Total: ${totalPrice}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
};