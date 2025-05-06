'use client';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  bookUrl?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [flightOffers, setFlightOffers] = useState<Array<any>>([]); // Store flight offers here
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
      const res = await axios.get('api/users/ask', {
        params: { message: input, sessionId },
      });
      setIsTyping(false);

      const rawBot = res.data.message as string;
      const offers = res.data.flightOffers as Array<{
        id: number;
        AirlineCodes: string;
        price: number;
      }>;
      setFlightOffers(offers); // Save flight offers to state

      const assistantMessages: Message[] = [];

      if (rawBot.startsWith('[FLIGHT_RESULTS]')) {
        let cleanBotMessage = rawBot
          .replace(/\[FLIGHT_RESULTS\]/g, '')
          .replace(/\[PARAMETERS:.*?]/s, '')
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

    // Flight booking logic
    if (url.includes('flight-details')) {
      const flightId = url.split('/').pop(); // Get the flight ID from the URL
      const selectedFlight = flightOffers.find(offer => offer.id === parseInt(flightId || '0'));
      if (selectedFlight && typeof window !== 'undefined') {
        sessionStorage.setItem('pendingFlight', JSON.stringify(selectedFlight));
      }
    }
    // Hotel booking logic
    // Authentication check
    if (token) {
      router.push(url);
    } else {
      router.push(`/signin?redirect=${encodeURIComponent(url)}`);
    }
  };

  return (
    <>
      <Head>
        <title>Chat with Travel Bot</title>
      </Head>
      <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-900 mt-16 mb-16">
        <div className="flex flex-1 justify-center items-start px-4 py-6">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col">
            <div
              ref={containerRef}
              className="overflow-y-auto space-y-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-4"
              style={{ height: '60vh' }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 text-body-color dark:text-white ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-600'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    {msg.bookUrl && (
                      <button
                        onClick={() => handleBookNow(msg.bookUrl!)}
                        className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-white dark:bg-gray-600 px-4 py-2">
                    <div className="dots text-gray-500">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <footer className="mt-4 pt-4 border-t flex items-center space-x-4">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border bg-white dark:bg-gray-700 dark:text-white px-4 py-2 focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="rounded-lg bg-primary px-6 py-2 text-white transition hover:bg-opacity-90"
              >
                Send
              </button>
            </footer>
          </div>
        </div>
      </div>
      <style jsx>{`
        .dots span { display: inline-block; width: 8px; height: 8px; margin: 0 2px; background-color: currentColor; border-radius: 50%; animation: dots 1.4s infinite ease-in-out both; }
        .dots span:nth-child(1) { animation-delay: -0.32s; }
        .dots span:nth-child(2) { animation-delay: -0.16s; }
        .dots span:nth-child(3) { animation-delay: 0; }
        @keyframes dots { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>
    </>
  );
}