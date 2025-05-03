// frontend/app/hotel-details/HotelDetailsClient.tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { createBooking } from "@/services/hotelService";

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

interface BookingModalProps {
  room: Room;
  hotelData: HotelData;
  userId: string | null;
  onClose: () => void;
}

// Define BookingModal inside the same file
const BookingModal: React.FC<BookingModalProps> = ({ room, hotelData, userId, onClose }) => {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const today = new Date().toISOString().split("T")[0];

  const parseHotelName = (name: string): string => {
    if (!name) return "";
    const cleanedName = name.replace(/%20/g, " ").toLowerCase();
    return cleanedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      console.log("Booking successful:", savedBooking);
      toast.success("Booking confirmed, dude! Redirecting...");
      setTimeout(() => {
        router.push("/"); // send them home, bro 🏄‍♂️
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
          You are booking the {room.type} room at {parseHotelName(hotelData.name)}. Please select your check-in and
          check-out dates to proceed.
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

interface HotelDetailsClientProps {
  hotelData: HotelData;
  rawHotelName: string;
}

const HotelDetailsClient: React.FC<HotelDetailsClientProps> = ({ hotelData, rawHotelName }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const getUserIdFromToken = (): string | null => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
    if (token) {
      try {
        const decodedToken: { sub: string } = jwtDecode(token);
        return decodedToken.sub;
      } catch (error) {
        console.error("Error decoding token", error);
        return null;
      }
    }
    return null;
  };

  const userId = getUserIdFromToken();

  const getRandomHotelImage = (index: number): string => {
    const imageNumber = (index % 63) + 1;
    return `/images/hotel-images/hotel${imageNumber}.jpg`;
  };

  useEffect(() => {
    const suffix = "?login=success";
    if (rawHotelName.endsWith(suffix)) {
      toast.success("Login successful! 🎉", { id: "login-success" });
      const cleaned = rawHotelName.slice(0, -suffix.length);
      console.log("Cleaned hotel name:", cleaned);
      const qs = new URLSearchParams(window.location.search);
      qs.set("hotelName", cleaned);
      window.history.replaceState(null, "", window.location.pathname + "?" + qs.toString());
    }
  }, [rawHotelName]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isModalOpen]);

  const openModal = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-x-6 lg:gap-x-8 xl:grid-cols-3">
        {hotelData.rooms.map((room, index) => (
          <div key={index} className="w-full">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transform hover:scale-105 transition">
              <img
                src={getRandomHotelImage(index)}
                alt={`${room.type} Image`}
                className="w-full h-48 object-cover rounded-md mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/hotel-images/hotel1.jpg";
                }}
              />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{room.type}</h3>
              <p className="text-gray-700 dark:text-gray-300">Price: ${room.price.toFixed(2)}</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 mb-4">
                {[...new Set(room.features)].map((feature, idx) => (
                  <li key={idx}>{String(feature)}</li>
                ))}
              </ul>
              <button
                onClick={() => openModal(room)}
                className="flex items-center justify-center rounded-md bg-body-color bg-opacity-[15%] px-4 py-2 text-sm text-body-color transition hover:bg-primary hover:bg-opacity-100 hover:text-white"
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedRoom && (
        <BookingModal
          room={selectedRoom}
          hotelData={hotelData}
          userId={userId}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default HotelDetailsClient;