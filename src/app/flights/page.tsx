// frontend/app/flights/page.tsx
import { Suspense } from "react";
import FlightBlog from "@/components/Blog/flightBlog";
import FlightSearchClient from "./FlightSearchClient";

const BlogSidebarPage = () => {
  return (
    <section className="overflow-hidden pb-[120px] pt-[180px]">
      <div className="container">
        <h1 className="mb-8 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight">
          The world is in your hands
        </h1>
        <Suspense fallback={<div className="text-center py-10 text-gray-500">Loading flight search...</div>}>
          <FlightSearchClient />
        </Suspense>
      </div>
    </section>
  );
};

export default BlogSidebarPage;