

// frontend/app/hotel-details/HotelDetailsClient.tsx
"use client";
import { useEffect, useState } from "react";
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
  latitude:     string;
  longitude:    string;
}

export default function HotelDetailsClient({ rawHotelName, latitude, longitude }: HotelDetailsClientProps) {
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [roomToBook, setRoomToBook] = useState<Room | null>(null);
  const router = useRouter();
  const [totalPrice, setTotalPrice] = useState(0);

  // Parse display name
  const displayName = rawHotelName.replace(/%20/g, " ");
  const getRandomHotelImage = (index: number): string => {
    const imageNumber = (index % 63) + 1;
    return `/images/hotel-images/hotel${imageNumber}.jpg`;
  };
  
  // Fetch hotel data once browser is ready
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      toast.error("No auth token, please login.");
      setLoading(false);
      return;
    }
    
    fetchFakeHotel({ latitude, longitude, hotelName: rawHotelName})
      .then(data => {
        if (data) setHotelData(data);
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load hotel details.");
      })
      .finally(() => setLoading(false));
  }, [latitude, longitude, rawHotelName]);

  if (loading) return <p className="text-center">Loading Available Rooms...</p>;
  if (!hotelData) return <p className="text-center text-red-500">No hotel data found.</p>;

  const openBooking = (room: Room) => setRoomToBook(room);
  const closeBooking = () => setRoomToBook(null);
  const getUserIdFromToken = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
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
      <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200">{displayName}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{hotelData.address}</p>
      <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-300">Available Rooms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotelData.rooms.map((room, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition">
                <img
                src={getRandomHotelImage(idx)}
                alt={`${room.type} Image`}
                className="w-full h-48 object-cover rounded-md mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/hotel-images/hotel1.jpg";
                }}
              />
            <h3 className="text-xl font-semibold mb-2">{room.type}</h3>
            <p className="mb-2">Price: ${room.price.toFixed(2)}</p>
            <ul className="list-disc list-inside mb-4">
              {[...new Set(room.features)].map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <button onClick={() => openBooking(room)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Book Now
            </button>
          </div>
        ))}
      </div>

      {roomToBook && (
        <BookingModal room={roomToBook} hotelData={hotelData} onClose={closeBooking} userId={userId} />
      )}
    </>
  );
}

// BookingModal component


const BookingModal = ({ room, hotelData, userId, onClose }) => {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [note, setNote] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const parseHotelName = (name) => {
    if (!name) return "";
    const cleanedName = name.replace(/%20/g, " ").toLowerCase();
    return cleanedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!checkIn || !checkOut) {
      toast.warning("Yo, pick your check-in and check-out dates!");
      return;
    }
    if (checkIn < today) {
      toast.error("Check-in can’t be in the past, bro!");
      return;
    }
    if (checkOut <= checkIn) {
      toast.warning("Check-out’s gotta be after check-in, fam!");
      return;
    }
  
    const bookingData = {
      userId,
      hotelName: hotelData.name,
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
      toast.success("Booking confirmed, dude! Redirecting...");
      setTimeout(() => {
        router.push('/'); // send them home, bro 🏄‍♂️
      }, 1000); // give them 2 secs to enjoy that toast
      onClose();
    } catch (error) {
      toast.error("Failed to book the room. Try again, man!");
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          Book {room.type}
        </h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          You are booking the {room.type} room at {parseHotelName(hotelData.name)}. Please select your check-in and check-out dates to proceed.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Check-in Date</label>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Check-out Date</label>
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
          </div>
          {/* New Note Field */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Do you have a note?</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter any additional notes..."
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              rows={3}
            />
          </div>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Total Price: ${totalPrice.toFixed(2)}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 py-2 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
        <button onClick={onClose} className="mt-4 text-red-500 dark:text-red-400">
          Close
        </button>
      </div>
      
    </div>
  );
};