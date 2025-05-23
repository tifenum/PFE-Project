import { Plane, Hotel, Car } from 'lucide-react';

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

const parseBookings = (content: string): Booking[] => {
  const lines = content.split('\n');
  const bookings: Booking[] = [];
  let currentType: 'flight' | 'hotel' | 'car' | null = null;

  for (const line of lines) {
    if (line.includes('Flight Bookings:')) {
      currentType = 'flight';
    } else if (line.includes('Hotel Bookings:')) {
      currentType = 'hotel';
    } else if (line.includes('Car Bookings:')) {
      currentType = 'car';
    } else if (line.startsWith('- ID: ') && currentType) {
      const details = line.substring(2).split(' | ');
      const customId = details[0].split(': ')[1];
      if (currentType === 'flight') {
        const [, route, departureStr, statusStr, priceStr] = details;
        const [origin, destination] = route.split(' to ');
        const departure = departureStr.split(': ')[1].split('T')[0];
        const status = statusStr.split(': ')[1];
        const price = priceStr.replace('$', '');
        bookings.push({
          type: 'flight',
          customId,
          details: { origin, destination, departure, status, price },
        });
      } else if (currentType === 'hotel') {
        const [, name, address, checkInStr, checkOutStr, statusStr, priceStr] = details;
        const checkIn = checkInStr.split(': ')[1];
        const checkOut = checkOutStr.split(': ')[1];
        const status = statusStr.split(': ')[1];
        const price = priceStr.replace('$', '');
        bookings.push({
          type: 'hotel',
          customId,
          details: { name, address, checkIn, checkOut, status, price },
        });
      } else if (currentType === 'car') {
        const [, carType, location, pickupDateStr, dropoffDateStr, statusStr, priceStr] = details;
        const pickupDate = pickupDateStr.split(': ')[1];
        const dropoffDate = dropoffDateStr.split(': ')[1];
        const status = statusStr.split(': ')[1];
        const price = priceStr.replace('$', '');
        bookings.push({
          type: 'car',
          customId,
          details: { carType, location, pickupDate, dropoffDate, status, price },
        });
      }
    }
  }
  return bookings;
};

const BookingTable = ({ bookings, message }: { bookings: Booking[]; message?: string }) => (
  <div className="max-w-3xl mx-auto bg-white/80 dark:bg-gray-800/80 rounded-xl p-2 backdrop-blur-sm shadow-md">
    {bookings.length > 0 ? (
      <table className="w-full text-xs text-gray-700 dark:text-gray-200">
        <thead>
          <tr className="bg-blue-500/10 dark:bg-blue-500/20 text-left text-sm font-semibold">
            <th className="p-2 w-8"></th>
            <th className="p-2">ID</th>
            <th className="p-2">Details</th>
            <th className="p-2 hidden sm:table-cell">Date</th>
            <th className="p-2 hidden md:table-cell">Status</th>
            <th className="p-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.customId}
              className={`border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-blue-500/10 even:bg-gray-50/50 dark:even:bg-gray-900/50 transition-all duration-200`}
            >
              <td className="p-2">
                {booking.type === 'flight' ? (
                  <Plane className="w-4 h-4 text-blue-400 animate-spin-slow" />
                ) : booking.type === 'hotel' ? (
                  <Hotel className="w-4 h-4 text-blue-400 animate-spin-slow" />
                ) : (
                  <Car className="w-4 h-4 text-blue-400 animate-spin-slow" />
                )}
              </td>
              <td className="p-2 truncate max-w-[120px]">{booking.customId}</td>
              <td className="p-2 truncate max-w-[200px]">
                {booking.type === 'flight'
                  ? `${booking.details.origin} → ${booking.details.destination}`
                  : booking.type === 'hotel'
                  ? booking.details.address
                  : booking.details.location}
              </td>
              <td className="p-2 hidden sm:table-cell truncate max-w-[120px]">
                {booking.type === 'flight'
                  ? booking.details.departure
                  : booking.type === 'hotel'
                  ? `${booking.details.checkIn}`
                  : booking.details.pickupDate}
              </td>
              <td className="p-2 hidden md:table-cell">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    booking.details.status === 'Accepted'
                      ? 'bg-green-500/20 text-green-500'
                      : booking.details.status === 'Refused'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}
                >
                  {booking.details.status}
                </span>
              </td>
              <td className="p-2 font-bold text-blue-500 dark:text-blue-400">
                ${booking.details.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">{message || 'No bookings to display, man!'}</p>
      </div>
    )}
  </div>
);

export { parseBookings, BookingTable };