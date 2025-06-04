'use client';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { askAssistant } from '@/services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { FlightCard, HotelCard, CarCard } from './TravelCards';
import { parseBookings, BookingTable } from './BookingCards';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  bookUrl?: string;
  flightOffer?: FlightOffer;
  hotelOffer?: HotelOffer;
  carOffer?: CarOffer;
  bookings?: Booking[];
  message?: string;
}

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
  hotelName: string;
  description: string;
  lat: number;
  lng: number;
}

interface CarOffer {
  pickupCountry: string;
  pickupCity: string;
  carTypes: { type: string; pricePerDay: number; features: string[]; carTypeFilter: string; passengers: string }[];
  bookingLink: string;
}

interface Booking {
  type: 'flight' | 'hotel' | 'car';
  customId: string;
  details: {
    flightId?: string;
    origin?: string;
    destination?: string;
    departure?: string;
    status?: string;
    price?: string;
    name?: string;
    address?: string;
    checkIn?: string;
    checkOut?: string;
    carType?: string;
    location?: string;
    pickupDate?: string;
    dropoffDate?: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hey there! Ready to plan your next adventure? Ask me about flights, hotels, cars, or deals!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [flightOffers, setFlightOffers] = useState<FlightOffer[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [sessionId] = useState(uuidv4());

  useEffect(() => {
    const scrollToBottom = () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    };
    const frameId = requestAnimationFrame(() => scrollToBottom());
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askAssistant(input, sessionId);
      const { message: botMessage, flightOffers: flightOffersData = [], carOffers = [], hotelOffers = [], bookings = [] } = response;
      setIsTyping(false);
      setFlightOffers(flightOffersData);

      const assistantMessages: Message[] = [];

      // Handle bookings only for actual booking lists or explicit "no bookings" responses
      const parsedBookings = bookings.length > 0 ? bookings.map((b: any) => ({
        type: b.type,
        customId: b.customId,
        details: b.details,
      })) : [];

      if (parsedBookings.length > 0 || botMessage.includes('No bookings found') || botMessage.includes('Successfully deleted')) {
        assistantMessages.push({
          role: 'assistant',
          content: '',
          bookings: parsedBookings,
          message: parsedBookings.length === 0 ? botMessage : undefined,
        });
      } else {
        // Non-booking responses (flight/hotel/car offers or general messages)
        if (botMessage) {
          assistantMessages.push({ role: 'assistant', content: botMessage });
        }
        if (flightOffersData.length > 0) {
          flightOffersData.forEach((offer: FlightOffer) => {
            assistantMessages.push({ role: 'assistant', content: '', flightOffer: offer, bookUrl: offer.bookingLink });
          });
        }
        if (hotelOffers.length > 0) {
          hotelOffers.forEach((offer: HotelOffer) => {
            const bookUrl = `/hotel-details?lat=${offer.lat}&lng=${offer.lng}&hotelName=${encodeURIComponent(offer.hotelName)}`;
            assistantMessages.push({ role: 'assistant', content: '', hotelOffer: offer, bookUrl });
          });
        }
        if (carOffers.length > 0) {
          carOffers.forEach((offer: CarOffer) => {
            assistantMessages.push({ role: 'assistant', content: '', carOffer: offer, bookUrl: offer.bookingLink });
          });
        }
      }

      setMessages((prev) => [...prev, ...assistantMessages]);
    } catch (err) {
      console.error('Error in handleSendMessage:', err);
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Oops! Something went wrong, bro!' }]);
    }
  };

  const handleBookNow1 = (url: string) => {
    if (typeof window === 'undefined') return;
      const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
    let relativeUrl;
    try {
      const parsedUrl = new URL(url, window.location.origin);
      relativeUrl = parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      console.error('Invalid URL, bro:', url);
      return;
    }
    if (token) {
      router.push(relativeUrl);
    } else {
      router.push(`/signin?redirect=${encodeURIComponent(relativeUrl)}`);
    }
  };

  const handleBookNow = (url: string) => {
    if (typeof window === 'undefined') return;
      const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
    let relativeUrl;
    try {
      const parsedUrl = new URL(url, window.location.origin);
      relativeUrl = parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      console.error('Invalid URL, bro:', url);
      return;
    }
    if (url.includes('flight-details')) {
      const flightId = relativeUrl.split('/').pop();
      const selectedFlight = flightOffers.find((offer) => offer.id === parseInt(flightId || '0'));
      if (selectedFlight) {
        sessionStorage.setItem('pendingFlight', JSON.stringify(selectedFlight));
      }
    }
    if (token) {
      router.push(relativeUrl);
    } else {
      router.push(`/signin?redirect=${encodeURIComponent(relativeUrl)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="w-full h-[80px]" />
      <div className="absolute right-0 top-0 z-[-1] opacity-100">
        <svg width="450" height="556" viewBox="0 0 450 556" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="277" cy="63" r="225" fill="url(#paint0_linear_25_217)" />
          <circle cx="17.9997" cy="182" r="18" fill="url(#paint1_radial_25_217)" />
          <circle cx="76.9997" cy="288" r="34" fill="url(#paint2_radial_25_217)" />
          <circle cx="325.486" cy="302.87" r="180" transform="rotate(-37.6852 325.486 302.87)" fill="url(#paint3_linear_25_217)" />
          <circle opacity="0.8" cx="184.521" cy="315.521" r="132.862" transform="rotate(114.874 184.521 315.521)" stroke="url(#paint4_linear_25_217)" />
          <circle opacity="0.8" cx="356" cy="290" r="179.5" transform="rotate(-30 356 290)" stroke="url(#paint5_linear_25_217)" />
          <circle opacity="0.8" cx="191.659" cy="302.659" r="133.362" transform="rotate(133.319 191.659 302.659)" fill="url(#paint6_linear_25_217)" />
          <defs>
            <linearGradient id="paint0_linear_25_217" x1="-54.5003" y1="-178" x2="222" y2="288" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="paint1_radial_25_217" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17.9997 182) rotate(90) scale(18)">
              <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
            </radialGradient>
            <radialGradient id="paint2_radial_25_217" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(76.9997 288) rotate(90) scale(34)">
              <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
            </radialGradient>
            <linearGradient id="paint3_linear_25_217" x1="226.775" y1="-66.1548" x2="292.157" y2="351.421" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint4_linear_25_217" x1="184.521" y1="182.159" x2="184.521" y2="448.882" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint5_linear_25_217" x1="356" y1="110" x2="356" y2="470" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint6_linear_25_217" x1="118.524" y1="29.2497" x2="166.965" y2="338.63" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 z-[-1] opacity-100">
        <svg width="364" height="201" viewBox="0 0 364 201" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24" stroke="url(#paint0_linear_25_218)" />
          <path d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24" stroke="url(#paint1_linear_25_218)" />
          <path d="M-53.1107 72.3303C-25.3401 66.4798 42.3965 64.9086 91.1783 105.427C152.155 156.076 170.59 162.093 205.333 166.607C240.076 171.12 278.718 183.657 303.889 212.24" stroke="url(#paint2_linear_25_218)" />
          <path d="M-98.1618 65.0889C-68.1416 60.0601 4.73364 60.4882 56.0734 102.431C120.248 154.86 139.905 161.419 177.137 166.956C214.37 172.493 255.575 186.165 281.856 215.481" stroke="url(#paint3_linear_25_218)" />
          <circle opacity="0.8" cx="214.505" cy="60.5054" r="49.7205" transform="rotate(-13.421 214.505 60.5054)" stroke="url(#paint4_linear_25_218)" />
          <circle cx="220" cy="63" r="43" fill="url(#paint5_radial_25_218)" />
          <defs>
            <linearGradient id="paint0_linear_25_218" x1="184.389" y1="69.2405" x2="184.389" y2="212.24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient id="paint1_linear_25_218" x1="156.389" y1="69.2405" x2="156.389" y2="212.24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient id="paint2_linear_25_218" x1="125.389" y1="69.2405" x2="125.389" y2="212.24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient id="paint3_linear_25_218" x1="93.8507" y1="67.2674" x2="89.9278" y2="210.214" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient id="paint4_linear_25_218" x1="214.505" y1="10.2849" x2="212.684" y2="99.5816" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="paint5_radial_25_218" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(220 63) rotate(90) scale(43)">
              <stop offset="0.145833" stopColor="white" stopOpacity="0" />
              <stop offset="1" stopColor="white" stopOpacity="0.08" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="flex flex-1 flex-col items-center px-4 pt-8 pb-[120px] bg-transparent">
        <div className="w-full max-w-6xl bg-transparent">
          <div ref={containerRef} className="overflow-y-auto space-y-8 bg-transparent" style={{ minHeight: 'calc(100vh - 12rem)' }}>
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[70%] sm:max-w-[50%] ml-auto">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl px-6 py-4 shadow-lg">
                        <p className="text-base leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ) : msg.flightOffer ? (
                    <div className="flex items-start space-x-3">
                      <img src="/images/Assistant/agent.png" alt="Assistant Avatar" className="w-10 h-10 rounded-full mt-1" />
                      <div className="w-full">
                        <FlightCard offer={msg.flightOffer} bookUrl={msg.bookUrl || ''} index={i} handleBookNow={handleBookNow} />
                      </div>
                    </div>
                  ) : msg.hotelOffer ? (
                    <div className="flex items-start space-x-3">
                      <img src="/images/Assistant/agent.png" alt="Assistant Avatar" className="w-10 h-10 rounded-full mt-1" />
                      <div className="w-full">
                        <HotelCard offer={msg.hotelOffer} bookUrl={msg.bookUrl || ''} index={i} handleBookNow={handleBookNow} />
                      </div>
                    </div>
                  ) : msg.carOffer ? (
                    <div className="flex items-start space-x-3">
                      <img src="/images/Assistant/agent.png" alt="Assistant Avatar" className="w-10 h-10 rounded-full mt-1" />
                      <div className="w-full">
                        <CarCard offer={msg.carOffer} index={i} handleBookNow={handleBookNow1} />
                      </div>
                    </div>
                  ) : msg.bookings && msg.bookings.length > 0 ? (
                    <div className="flex items-start space-x-3">
                      <img src="/images/Assistant/agent.png" alt="Assistant Avatar" className="w-10 h-10 rounded-full mt-1" />
                      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm max-w-[70%] sm:max-w-[100%]">
                        <BookingTable bookings={msg.bookings} message={msg.message} />
                      </div>
                    </div>
                  ) : msg.message || msg.content ? (
                    <div className="flex items-start space-x-3">
                      <img src="/images/Assistant/agent.png" alt="Assistant Avatar" className="w-10 h-10 rounded-full mt-1" />
                      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm max-w-[70%] sm:max-w-[100%]">
                        <p className="text-base leading-relaxed">{msg.message || msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3">
                      <img src="/images/Assistant/agent.png" alt="Assistant Avatar" className="w-10 h-10 rounded-full mt-1" />
                      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm max-w-[70%] sm:max-w-[100%]">
                        <p className="text-base leading-relaxed">Something went wrong, bro!</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start w-full"
                >
                  <div className="flex items-start space-x-3">
                    <img src="/images/Assistant/agent.png" alt="Assistant Avatar" className="w-10 h-10 rounded-full mt-1" />
                    <div className="rounded-2xl bg-white/90 dark:bg-gray-800/90 px-6 py-4 flex items-center space-x-3 backdrop-blur-sm">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-base text-gray-500 dark:text-gray-400">Typing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full bg-transparent z-20 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4 max-w-6xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about flights, hotels, cars, or deals..."
              className="w-full rounded-full border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all backdrop-blur-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4 text-white font-medium text-base hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>
      <style>
        {`
          .animate-bounce {
            animation: bounce 1s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .animate-spin-slow {
            animation: spin 3s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}