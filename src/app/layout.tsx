"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute"; // Import the new component
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";
import { ThemeProvider } from "next-themes";
import { LoadingProvider } from "./LoadingContext";
import ClientNavigationHandler from "./ClientNavigationHandler";
import ClientGlobalLoaderWrapper from "./ClientGlobalLoaderWrapper";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideFooter = pathname === "/chatbot" || pathname === "/map";
  const hideHeader = pathname === "/map";

  // Determine if the route requires protection
  const isAdminRoute = pathname.startsWith("/adminpage");
  const isBookingRoute = pathname === "/bookings";
  const isProtected = isAdminRoute || isBookingRoute;

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <LoadingProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {!hideHeader && <Header />}
            <Toaster richColors />
            <ClientNavigationHandler />
            <ClientGlobalLoaderWrapper />
            {isProtected ? (
              <ProtectedRoute requireAdmin={isAdminRoute}>
                {children}
              </ProtectedRoute>
            ) : (
              children
            )}
            {!hideFooter && <Footer />}
            <ScrollToTop />
          </ThemeProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}