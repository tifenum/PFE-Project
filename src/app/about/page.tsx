import type { Metadata } from 'next'
import BlogPage from './about' // Make sure this import is correct

export const metadata: Metadata = {
  title: "Blog Page | Free Next.js Template for Startup and SaaS",
  description: "This is Blog Page for Startup Nextjs Template",
}

export default function Page() {
  return <BlogPage />
}