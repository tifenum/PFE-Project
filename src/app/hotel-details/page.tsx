"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const BookHotelPage = () => {
  const searchParams = useSearchParams();
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Grab the URL params
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");
  const hotelName = searchParams.get("hotelName");

  // Fetch hotel data
  useEffect(() => {
    const fetchFakeHotel = async () => {
      try {
        const backendUrl = "http://localhost:8222/api/hotels/fake";
        const response = await fetch(
          `${backendUrl}?latitude=${latitude}&longitude=${longitude}&hotelName=${encodeURIComponent(hotelName)}`
        );
        if (!response.ok) throw new Error("Failed to fetch hotel data");
        const data = await response.json();
        setHotelData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude && hotelName) {
      fetchFakeHotel();
    } else {
      setError("Missing required params: latitude, longitude, or hotelName");
      setLoading(false);
    }
  }, [latitude, longitude, hotelName]);

  // Stop scrolling when modal’s up
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

  // Loading or error screens
  if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Hotel Info */}
      <h1 className="text-3xl font-bold mb-2 text-gray-800">{hotelData.name}</h1>
      <p className="text-gray-600 mb-4">{hotelData.address}</p>

      {/* Rooms List */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Available Rooms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotelData.rooms.map((room, index) => (
          <div
            key={index}
            className="bg-gray-100 p-4 rounded-lg shadow-sm transform hover:scale-105 transition"
          >
            <h3 className="text-lg font-bold text-gray-800">{room.type}</h3>
            <p className="text-gray-700">Price: ${room.price.toFixed(2)}</p>
            <ul className="list-disc list-inside text-gray-600">
              {[...new Set(room.features)].map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <button
              onClick={() => openModal(room)}
              className="mt-2 bg-blue-600 text-white py-1 px-4 rounded hover:bg-blue-700 transition"
            >
              Book Now
            </button>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {isModalOpen && <BookingModal room={selectedRoom} onClose={closeModal} />}
    </div>
  );
};

// Modal for Booking
const BookingModal = ({ room, onClose }) => {
  const [children, setChildren] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      alert("Yo, pick your check-in and check-out dates!");
      return;
    }
    if (checkIn < today) {
      alert("Check-in can’t be in the past, bro!");
      return;
    }
    if (checkOut <= checkIn) {
      alert("Check-out’s gotta be after check-in, fam!");
      return;
    }
    // Fake booking for now
    console.log(`Booking room: ${room.type}, Kids: ${children}, Check-in: ${checkIn}, Check-out: ${checkOut}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-96 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Book {room.type}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Number of Kids</label>
            <input
              type="number"
              min="0"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Check-in Date</label>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Check-out Date</label>
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          >
            Confirm Booking
          </button>
        </form>
        <button onClick={onClose} className="mt-4 text-red-500">
          Close
        </button>
      </div>
    </div>
  );
};

export default BookHotelPage;