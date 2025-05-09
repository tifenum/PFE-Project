"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";
import { ThemeProvider } from "next-themes";
import { LoadingProvider } from "./LoadingContext";
import ClientNavigationHandler from "./ClientNavigationHandler";
import ClientGlobalLoaderWrapper from "./ClientGlobalLoaderWrapper";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <LoadingProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Header />
            <Toaster richColors />
            <ClientNavigationHandler />
            <ClientGlobalLoaderWrapper />
            {children}
            <Footer />
            <ScrollToTop />
          </ThemeProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}