"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FiArrowRight, FiMapPin, FiPaperclip } from "react-icons/fi";
import { searchCities, searchHotels, searchHotelsByGeocode, searchHotelsByKeyword } from "@/services/hotelService";
import AutocompleteCountry from "@/components/globe/countries";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SectionTitle from "@/components/Common/SectionTitle";

delete L.Icon.Default.prototype._getIconUrl;

interface Country {
  name: string;
  code: string;

}

const hotelIcon = new L.Icon({
  iconUrl: "/images/hotel/hotel.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};
function resetMapContainer(id) {
  const container = L.DomUtil.get(id);
  if (container && container._leaflet_id) {
    container._leaflet_id = null;
  }
}

const MapClickHandler = ({ isDrawing, onCircleSet }) => {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        const { lat, lng } = e.latlng;
        onCircleSet([lat, lng]);
      }
    },
  });
  return null;
};

const ClientBookingPage = () => {
  const router = useRouter(); // Add router for navigation
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelImage, setHotelImage] = useState(null);
  const [bookingCountry, setBookingCountry] = useState<Country>({ name: "", code: "" });
  type Destination = { name: string; iataCode: string; geoCode?: { latitude: number; longitude: number } } | string;
  const [destination, setDestination] = useState<Destination>("");
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [departureDate, setDepartureDate] = useState("");
  const [duration, setDuration] = useState("");
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [isSearching, setIsSearching] = useState(false);
  const [circleCenter, setCircleCenter] = useState(null);
  const [radiusKm, setRadiusKm] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hotelName, setHotelName] = useState("");

  const getRandomHotelImage = () => {
    const randomNumber = Math.floor(Math.random() * 63) + 1;
    return `/images/hotel-images/hotel${randomNumber}.jpg`;
  };
  const handleBookNow = (hotel) => {
    const stateName = typeof destination === "object" ? destination.name || "" : destination || "";
    const url = `/hotel-details?lat=${hotel.geoCode.latitude}&lng=${hotel.geoCode.longitude}&country=${encodeURIComponent(bookingCountry.name)}&state=${encodeURIComponent(stateName)}`;
    router.push(url);
  };
  useEffect(() => {
  }, [hotels]);

  
  useEffect(() => {
    if (
      typeof destination !== "string" ||
      !destination.trim() ||
      destination.trim().length < 3 ||
      !bookingCountry.code
    ) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchCities({ countryCode: bookingCountry.code, keyword: destination, max: 10 })
        .then((cities) => setCitySuggestions(cities))
        .catch((error) => console.error("Error fetching cities:", error));
    }, 300);

    return () => clearTimeout(timer);
  }, [destination, bookingCountry.code]);

  const handleMarkerClick = (hotel) => {
    setSelectedHotel(hotel);
    setHotelImage(getRandomHotelImage());
  };

  const handleCitySelect = (city) => {
    setDestination(city);
    setCitySuggestions([]);
    if (city.geoCode && typeof city.geoCode.latitude === "number" && typeof city.geoCode.longitude === "number") {
      setMapCenter([city.geoCode.latitude, city.geoCode.longitude]);
      setCircleCenter([city.geoCode.latitude, city.geoCode.longitude]);
    } else {
      console.warn("City has no valid geoCode:", city);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof destination !== "object" || !destination.iataCode) {
      console.error("No valid city selected");
      return;
    }

    setIsSearching(true);
    try {
      const fetchedHotels = await searchHotels({ cityCode: destination.iataCode });
      setHotels(fetchedHotels);
      if (destination.geoCode && destination.geoCode.latitude && destination.geoCode.longitude) {
        setMapCenter([destination.geoCode.latitude, destination.geoCode.longitude]);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHotelNameSearch = async () => {
    if (!hotelName.trim()) return;
    setIsSearching(true);
    try {
      const fetchedHotels = await searchHotelsByKeyword({ keyword: hotelName });
      setHotels(fetchedHotels);
      if (fetchedHotels.length > 0 && fetchedHotels[0].geoCode) {
        setMapCenter([fetchedHotels[0].geoCode.latitude, fetchedHotels[0].geoCode.longitude]);
      }
    } catch (error) {
      console.error("Error fetching hotels by name:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRadiusChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setRadiusKm(value);
    }
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
  };

  const clearCircle = () => {
    setCircleCenter(null);
    setIsDrawing(false);
  };

  const handleSearchByRadius = async () => {
    if (!circleCenter) {
      alert("Please select a destination to set the search center.");
      return;
    }
    setIsSearching(true);
    try {
      const [latitude, longitude] = circleCenter;
      const fetchedHotels = await searchHotelsByGeocode({ latitude, longitude, radius: radiusKm });
      setHotels(fetchedHotels);
    } catch (error) {
      console.error("Error fetching hotels by geocode:", error);
      alert("Failed to fetch hotels. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const radiusMeters = radiusKm * 1000;

  return (
    <section className="overflow-hidden pb-8 pt-16 lg:pt-20">
      <div className="container mx-auto">
        {/* <SectionTitle
          title="The Best Hotel Deals"
          paragraph="Find the Best Hotel Deals and offers from all over the world. Book your Hotel now!"
          center
          width="650px"
        /> */}
        <div className="flex flex-wrap lg:flex-nowrap -mx-4">
          <div className="w-full lg:w-8/12 px-4">
            <div style={{ height: "calc(105vh - 8rem)", overflow: "hidden" }}>
            <MapContainer
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >                
            <MapUpdater center={mapCenter} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler isDrawing={isDrawing} onCircleSet={setCircleCenter} />
                {circleCenter && (
                  <Circle
                    center={circleCenter}
                    radius={radiusMeters}
                    pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
                  />
                )}
                {hotels.length > 0 &&
                  hotels.map((hotel, index) =>
                    hotel.geoCode && hotel.geoCode.latitude && hotel.geoCode.longitude ? (
                      <Marker
                        key={hotel.hotelId || index}
                        position={[hotel.geoCode.latitude, hotel.geoCode.longitude]}
                        icon={hotelIcon}
                        eventHandlers={{ click: () => handleMarkerClick(hotel) }}
                      >
                        <Popup maxWidth={300} minWidth={200}>
                          {selectedHotel && selectedHotel.hotelId === hotel.hotelId && hotelImage ? (
                            <div className="text-center">
                              <h3 className="font-bold text-lg mb-2">{hotel.name}</h3>
                              <img
                                src={hotelImage}
                                alt={hotel.name}
                                style={{ width: "100%", height: "auto" }}
                                onError={(e) => (e.target.src = "/images/hotel-images/fallback.jpg")}
                              />
                                { typeof window !== "undefined" && (localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token")) ? (                                <Link
                                  href={{
                                    pathname: "/hotel-details",
                                    query: {
                                      lat: hotel.geoCode.latitude,
                                      lng: hotel.geoCode.longitude,
                                      hotelName: hotel.name, // Added hotelName for the endpoint
                                    },
                                  }}
                                >
                                  <button>Book Now</button>
                                </Link>
                              ) : (
                                <button
                                  onClick={() => {
                                    const redirectUrl = `/hotel-details?lat=${hotel.geoCode.latitude}&lng=${hotel.geoCode.longitude}&hotelName=${encodeURIComponent(hotel.name)}`;
                                    router.push(`/signin?redirect=${encodeURIComponent(redirectUrl)}`);
                                  }}
                                >
                                  Book Now
                                </button>
                              )}
                            </div>
                          ) : (
                            <p>Loading image...</p>
                          )}
                        </Popup>
                      </Marker>
                    ) : null
                  )}
              </MapContainer>
            </div>
          </div>
          <div className="w-full lg:w-4/12 px-4 mt-6 lg:mt-0 space-y-4 lg:space-y-6">
            {/* Section 1: City Search */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8 flex flex-col space-y-4 max-h-[30vh] lg:max-h-[40vh] overflow-y-auto">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <AutocompleteCountry
                  label="Country"
                  value={bookingCountry.name}
                  onChange={(country) => setBookingCountry(country)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destination
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <FiArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="City or country"
                      value={typeof destination === "object" ? destination.name : destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                    {citySuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 rounded-md max-h-40 overflow-auto">
                        {citySuggestions.map((city, index) => (
                          <li
                            key={index}
                            onClick={() => handleCitySelect(city)}
                            className="px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer text-sm"
                          >
                            {city.name} {city.iataCode ? `(${city.iataCode})` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className={`w-full flex items-center justify-center space-x-1 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 text-sm ${
                    isSearching ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSearching ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-1 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <FiPaperclip className="w-4 h-4" />
                      <span>Search Hotels</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Section 2: Hotel Name Search */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8 flex flex-col space-y-4 max-h-[25vh] lg:max-h-[30vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hotel Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter hotel name"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleHotelNameSearch}
                  disabled={isSearching}
                  className={`w-full flex items-center justify-center space-x-1 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 text-sm ${
                    isSearching ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSearching ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-1 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <FiPaperclip className="w-4 h-4" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Section 3: Radius Search */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8 flex flex-col space-y-4 max-h-[35vh] lg:max-h-[29vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Radius (km, max 100)
                  </label>
                  <input
                    type="number"
                    value={radiusKm}
                    onChange={handleRadiusChange}
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Enter radius"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={toggleDrawing}
                    className={`w-full py-2 px-3 rounded-lg text-white font-semibold transition-all duration-200 text-sm ${
                      isDrawing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isDrawing ? "Stop Drawing" : "Draw Circle"}
                  </button>
                  <button
                    onClick={clearCircle}
                    disabled={!circleCenter}
                    className="w-full py-2 px-3 rounded-lg text-white font-semibold bg-red-600 hover:bg-red-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    Clear Circle
                  </button>
                  <button
                    onClick={handleSearchByRadius}
                    disabled={!circleCenter || isSearching}
                    className={`w-full flex items-center justify-center space-x-1 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 text-sm ${
                      isSearching ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientBookingPage;