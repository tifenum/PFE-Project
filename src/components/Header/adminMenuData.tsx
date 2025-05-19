import { Menu } from "@/types/menu";

const adminMenuData: Menu[] = [
  {
    id: 100,
    title: "List of Users",
    path: "/adminpage/users-list",
    newTab: false,
  },
  {
    id: 101,
    title: "Flight Bookings",
    path: "/adminpage/flight-bookings",
    newTab: false,
  },
  {
    id: 102,
    title: "Hotel Bookings",
    path: "/adminpage/hotel-reservations",
    newTab: false,
  },
  {
  id: 102,
  title: "Car rental",
  path: "/adminpage/car-rentals",
  newTab: false,
  },
];

export default adminMenuData;
