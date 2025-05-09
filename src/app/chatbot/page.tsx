'use client';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid';
import { askAssistant } from '@/services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel } from 'lucide-react';
import { Parallax } from 'react-parallax';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  bookUrl?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [flightOffers, setFlightOffers] = useState<Array<any>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [sessionId] = useState(uuidv4());

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);

    try {
      const { message: rawBot, flightOffers: offers = [] } = await askAssistant(input, sessionId);
      setIsTyping(false);
      setFlightOffers(offers);

      const assistantMessages: Message[] = [];

      if (rawBot.startsWith('[FLIGHT_RESULTS]')) {
        let cleanBotMessage = rawBot
          .replace(/\[FLIGHT_RESULTS\]/g, '')
          .replace(/\[PARAMETERS:[\s\S]*?]/, '')
          .trim();

        if (cleanBotMessage) {
          assistantMessages.push({ role: 'assistant', content: cleanBotMessage });
        }
        if (Array.isArray(offers)) {
          offers.forEach(offer => {
            assistantMessages.push({
              role: 'assistant',
              content: `${offer.AirlineCodes} – $${offer.price}`,
              bookUrl: `http://localhost:3000/flight-details/${offer.id}`,
            });
          });
        }
      } else if (rawBot.startsWith('[HOTEL_RESULTS]')) {
        const hotelLines = rawBot.replace(/\[HOTEL_RESULTS\]/, '').split('\n').filter(line => line.trim());
        hotelLines.forEach(line => {
          const match = line.match(/(.*?)\s*\[BOOK_NOW:(.*?)\]/);
          if (match) {
            const hotelDescription = match[1].trim();
            const bookUrl = match[2].trim();
            assistantMessages.push({
              role: 'assistant',
              content: hotelDescription,
              bookUrl,
            });
          } else if (line.trim()) {
            assistantMessages.push({ role: 'assistant', content: line.trim() });
          }
        });
      } else {
        assistantMessages.push({ role: 'assistant', content: rawBot });
      }

      setMessages(prev => [...prev, ...assistantMessages]);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Oops! Something went wrong.' },
      ]);
    }
  };

  const handleBookNow = (url: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

    if (url.includes('flight-details')) {
      const flightId = url.split('/').pop();
      const selectedFlight = flightOffers.find(offer => offer.id === parseInt(flightId || '0'));
      if (selectedFlight && typeof window !== 'undefined') {
        sessionStorage.setItem('pendingFlight', JSON.stringify(selectedFlight));
      }
    }

    if (token) {
      router.push(url);
    } else {
      router.push(`/signin?redirect=${encodeURIComponent(url)}`);
    }
  };

  return (
    <>
      <Head>
        <title>Travel Chatbot - Book Flights & Hotels</title>
      </Head>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-16 pb-16 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          {/* Clouds (Light Mode) */}
          <div className="cloud cloud-1 dark:hidden"></div>
          <div className="cloud cloud-2 dark:hidden"></div>
          <div className="cloud cloud-3 dark:hidden"></div>
          {/* Planes */}
          <div className="plane plane-1"></div>
          <div className="plane plane-2"></div>
          {/* Map (Dark Mode) */}
          <svg
            className="hidden dark:block absolute inset-0 w-full h-full opacity-10"
            viewBox="0 0 1000 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M200 300 C300 200, 400 400, 500 300 S600 200, 700 300, 800 400 C900 500, 850 600, 750 600 S650 500, 550 600, 450 500 C350 400, 250 500, 200 400 Z"
              stroke="#4A6CF7"
              strokeWidth="2"
              opacity="0.2"
            />
            <path
              d="M150 350 C250 250, 350 450, 450 350 S550 250, 650 350, 750 450 C850 550, 800 650, 700 650 S600 550, 500 650, 400 550 C300 450, 200 550, 150 450 Z"
              stroke="#4A6CF7"
              strokeWidth="2"
              opacity="0.2"
            />
          </svg>
        </div>
        {/* Parallax Container */}
        <Parallax strength={200} bgClassName="bg-transparent">
          <div className="flex flex-1 justify-center items-start px-4 py-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-6 flex flex-col"
            >
              <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                Travel Buddy Chat
              </h1>
              <div
                ref={containerRef}
                className="overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6"
                style={{ height: '65vh' }}
              >
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-3 flex items-start space-x-2 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                        } shadow-md`}
                      >
                        {msg.role === 'assistant' && msg.bookUrl && (
                          msg.bookUrl.includes('flight-details') ? (
                            <Plane className="w-5 h-5 text-blue-400 mt-1" />
                          ) : (
                            <Hotel className="w-5 h-5 text-green-400 mt-1" />
                          )
                        )}
                        <div>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          {msg.bookUrl && (
                            <button
                              onClick={() => handleBookNow(msg.bookUrl!)}
                              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg text-sm transition-all duration-200"
                            >
                              Book Now
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="rounded-xl bg-white dark:bg-gray-600 px-4 py-3 flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Typing...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <footer className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about flights or hotels..."
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  Send
                </button>
              </footer>
            </motion.div>
          </div>
        </Parallax>
      </div>
      <style jsx>{`
        .cloud {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          filter: blur(20px);
          animation: drift linear infinite;
          pointer-events: none;
        }
        .cloud-1 {
          width: 150px;
          height: 50px;
          top: 10%;
          left: -150px;
          animation-duration: 60s;
        }
        .cloud-2 {
          width: 200px;
          height: 70px;
          top: 30%;
          left: -200px;
          animation-duration: 80s;
        }
        .cloud-3 {
          width: 100px;
          height: 40px;
          top: 50%;
          left: -100px;
          animation-duration: 50s;
        }
        .plane {
          position: absolute;
          width: 30px;
          height: 30px;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234A6CF7" stroke-width="2"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>') no-repeat center;
          animation: fly linear infinite;
          pointer-events: none;
        }
        .plane-1 {
          top: 20%;
          left: -30px;
          animation-duration: 30s;
        }
        .plane-2 {
          top: 60%;
          left: -30px;
          animation-duration: 40s;
        }
        @keyframes drift {
          from { transform: translateX(-100%); }
          to { transform: translateX(100vw); }
        }
        @keyframes fly {
          from { transform: translateX(-100%) rotate(-10deg); }
          to { transform: translateX(100vw) rotate(-10deg); }
        }
      `}</style>
    </>
  );
}