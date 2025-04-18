import { Menu } from "@/types/menu";

const adminMenuData: Menu[] = [
  {
    id: 100,
    title: "List of Users",
    path: "/admin/users-list",
    newTab: false,
  },
  {
    id: 101,
    title: "Flight Bookings",
    path: "/admin/flight-bookings",
    newTab: false,
  },
  {
    id: 102,
    title: "Hotel Bookings",
    path: "/admin/hotel-reservations",
    newTab: false,
  },
];

export default adminMenuData;
