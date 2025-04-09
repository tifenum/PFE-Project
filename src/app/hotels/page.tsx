// app/blog/page.tsx
import type { Metadata } from 'next'
import ClientBookingPage from './BookingClient'

export const metadata: Metadata = {
  title: "Blog Page | Free Next.js Template for Startup and SaaS",
  description: "This is Blog Page for Startup Nextjs Template",
}

export default function BlogPage() {
  return <ClientBookingPage />
}