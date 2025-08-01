"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import menuData from "./menuData";
import adminMenuData from "./adminMenuData";
import { logout } from "@/services/userService";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [openSubmenuId, setOpenSubmenuId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const checkAuth = () => {
    const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
    if (token) {
      try {
        const payload: any = jwtDecode(token);
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          localStorage.removeItem("jwt_token");
          sessionStorage.removeItem("jwt_token");
          setIsLoggedIn(false);
          setIsAdmin(false);
          router.push("/signin");
          return;
        }
        setIsLoggedIn(true);
        const roles = payload?.realm_access?.roles || [];
        setIsAdmin(roles.includes("admin"));
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsLoggedIn(false);
        setIsAdmin(false);
        localStorage.removeItem("jwt_token");
        sessionStorage.removeItem("jwt_token");
        router.push("/signin");
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
      setIsAdmin(false);
      window.dispatchEvent(new Event("authChange"));
      toast.success("Logged out successfully!");
      router.push("/");
    } catch (err) {
      toast.error("Something went wrong while logging out.");
    }
  };

  const navbarToggleHandler = () => setNavbarOpen(!navbarOpen);
  const handleSubmenuId = (id: number) => setOpenSubmenuId(openSubmenuId === id ? null : id);

  const currentMenuData = isAdmin ? adminMenuData : menuData;

  return (
    <header
      className={`header left-0 top-0 z-40 flex w-full items-center ${
        sticky
          ? "dark:bg-gray-dark dark:shadow-sticky-dark fixed z-[9999] bg-white !bg-opacity-80 shadow-sticky backdrop-blur-sm transition"
          : "absolute bg-transparent"
      }`}
    >
      <div className="container">
        <div className="relative -mx-4 flex items-center justify-between">
          <div className="w-60 max-w-full px-4 xl:mr-12">
            <Link
              href="/"
              className={`header-logo block w-full ${sticky ? "py-5 lg:py-2" : "py-8"}`}
            >
              <Image
                src="/images/logo/logo-2.png"
                alt="logo"
                width={140}
                height={24}
                className="dark:hidden"
              />
              <Image
                src="/images/logo/logo.png"
                alt="logo"
                width={140}
                height={24}
                className="hidden dark:block"
              />
            </Link>
          </div>
          <div className="flex w-full items-center justify-between px-4">
            <div>
              <button
                onClick={navbarToggleHandler}
                id="navbarToggler"
                aria-label="Mobile Menu"
                className="absolute right-4 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-[6px] ring-primary focus:ring-2 lg:hidden"
              >
                <span
                  className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? " top-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? "top-[-8px] -rotate-45" : ""
                  }`}
                />
              </button>
              <nav
                id="navbarCollapse"
                className={`navbar absolute right-0 z-30 w-[250px] rounded border-[.5px] border-body-color/50 bg-white px-6 py-4 duration-300 dark:border-body-color/20 dark:bg-dark lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100 ${
                  navbarOpen ? "visibility top-full opacity-100" : "invisible top-[120%] opacity-0"
                }`}
              >
                <ul className="block lg:flex lg:space-x-12">
                  {currentMenuData.map((menuItem) => (
                    <li key={menuItem.id} className="group relative">
                      {menuItem.path ? (
                        <Link
                          href={
                            menuItem.path === "/bookings" && !isLoggedIn
                              ? `/signin?redirect=${encodeURIComponent("/bookings")}`
                              : menuItem.path
                          }
                          className={`flex py-2 text-base lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 ${
                            pathname === menuItem.path
                              ? "text-primary dark:text-white"
                              : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                          }`}
                        >
                          {menuItem.title}
                        </Link>
                      ) : (
                        <>
                          <p
                            onClick={() => handleSubmenuId(menuItem.id)}
                            className="flex cursor-pointer items-center justify-between py-2 text-base text-dark group-hover:text-primary dark:text-white/70 dark:group-hover:text-white lg:mr-0 lg:inline-flex lg:px-0 lg:py-6"
                          >
                            {menuItem.title}
                            <span className="pl-3">
                              <svg width="25" height="24" viewBox="0 0 25 24">
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M6.29289 8.8427C6.68342 8.45217 7.31658 8.45217 7.70711 8.8427L12 13.1356L16.2929 8.8427C16.6834 8.45217 17.3166 8.45217 17.7071 8.8427C18.0976 9.23322 18.0976 9.86639 17.7071 10.2569L12 15.964L6.29289 10.2569C5.90237 9.86639 5.90237 9.23322 6.29289 8.8427Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </span>
                          </p>
                          <div
                            className={`submenu relative left-0 top-full rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 dark:bg-dark lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[250px] lg:p-4 lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full ${
                              openSubmenuId === menuItem.id ? "block" : "hidden"
                            }`}
                          >
                            {menuItem.submenu.map((submenuItem) => (
                              <Link
                                href={submenuItem.path}
                                key={submenuItem.id}
                                className="block rounded py-2.5 text-sm text-dark hover:text-primary dark:text-white/70 dark:hover:text-white lg:px-3"
                              >
                                {submenuItem.title}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="flex items-center justify-end pr-16 lg:pr-0 gap-2">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="ease-in-up shadow-btn hover:shadow-btn-hover rounded-sm bg-primary px-8 py-3 text-base font-medium text-white transition duration-300 hover:bg-opacity-90 md:px-9 lg:px-6 xl:px-9"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="hidden px-7 py-3 text-base font-medium text-dark hover:opacity-70 dark:text-white md:block"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="ease-in-up shadow-btn hover:shadow-btn-hover hidden rounded-sm bg-primary px-8 py-3 text-base font-medium text-white transition duration-300 hover:bg-opacity-90 md:block md:px-9 lg:px-6 xl:px-9"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              <ThemeToggler />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;