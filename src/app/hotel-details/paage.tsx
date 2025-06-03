"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchFakeHotel, createBooking } from "@/services/hotelService";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

const BookHotelPage = () => {
  const searchParams = useSearchParams();
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

const parseHotelName = (name) => {
  if (!name) return "";
  // Replace '%20' with a space and make the entire string lowercase
  const cleanedName = name.replace(/%20/g, " ").toLowerCase();
  // Capitalize the first letter of each word
  return cleanedName.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Decode the hotelName to remove % signs from spaces
const initialRawName = searchParams.get("hotelName") || "";
const [rawHotelName, setRawHotelName] = useState(initialRawName);


  const getUserIdFromToken = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token") : null;
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

  const getRandomHotelImage = (index) => {
    const imageNumber = (index % 61) + 1;
    return `/images/hotel-images/hotel${imageNumber}.jpg`;
  };
  useEffect(() => {
    const suffix = "?login=success";
    if (rawHotelName.endsWith(suffix)) {
      // show success toast once
      toast.success("Login successful! 🎉" ,{ id: "login-success" });;
      // strip suffix
      const cleaned = rawHotelName.slice(0, -suffix.length);
      setRawHotelName(cleaned);
      // update URL without reloading
      const qs = new URLSearchParams(window.location.search);
      qs.set("hotelName", cleaned);
      window.history.replaceState(null, "", window.location.pathname + "?" + qs.toString());
    }
  }, [rawHotelName]);
  const hotelName = parseHotelName(rawHotelName);

const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");
  useEffect(() => {
    const getHotelData = async () => {
      if (!latitude || !longitude || !hotelName) {
        setError("Missing required params: latitude, longitude, or hotelName");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchFakeHotel({ latitude, longitude, hotelName });
        if (data) {
          setHotelData(data);
        } else {
          setError("Failed to fetch hotel data");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getHotelData();
  }, [latitude, longitude, hotelName]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isModalOpen]);

  const openModal = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <section className="bg-gray-light dark:bg-bg-color-dark py-16 md:py-20 lg:py-28">
      <div className="container">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200">{hotelName}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{hotelData.address}</p>

        <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-300">Available Rooms</h2>
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

        {isModalOpen && (
          <BookingModal
            room={selectedRoom}
            hotelData={hotelData}
            userId={userId}
            onClose={closeModal}
          />
        )}
      </div>
    </section>
  );
};

// Define BookingModal inside the same file
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

export default BookHotelPage;
