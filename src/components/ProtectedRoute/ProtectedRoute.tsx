"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean; // Optional flag to require admin role
}

interface DecodedToken {
  exp: number;
  realm_access?: { roles: string[] };
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");

    // If no token, redirect to signin with the current path as redirect param
    if (!token) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();

      // If token is expired, clear storage and redirect to signin
      if (isExpired) {
        localStorage.removeItem("jwt_token");
        sessionStorage.removeItem("jwt_token");
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // If admin role is required, check for admin role
      if (requireAdmin) {
        const roles = decoded?.realm_access?.roles || [];
        if (!roles.includes("admin")) {
          // Redirect to home if not admin
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("jwt_token");
      sessionStorage.removeItem("jwt_token");
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, requireAdmin]);

  return <>{children}</>;
};

export default ProtectedRoute;