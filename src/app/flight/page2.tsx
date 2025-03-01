import GlobalComponent from "./global";
import { FiArrowRight, FiMapPin, FiPaperclip } from "react-icons/fi";
import Breadcrumb from "@/components/Common/Breadcrumb";

const Flight = () => {
  return (
    <>
      <Breadcrumb
        pageName="Contact Page"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. In varius eros eget sapien consectetur ultrices. Ut quis dapibus libero."
      />
            <div className="container">

        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-16"> {/* Added pt-16 */}
          <div className="items-start">
            {/* Flight Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-12 w-full">
              <form className="space-y-8">
                <div className="flex flex-wrap gap-6">
                  <div className="w-full md:w-[calc(50%-12px)]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      From Where
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="source"
                        type="text"
                        placeholder="Enter departure city"
                        className="w-full pl-10 pr-4 py-4 border-0 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="w-full md:w-[calc(50%-12px)]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Destination
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="destination"
                        type="text"
                        placeholder="Enter destination city"
                        className="w-full pl-10 pr-4 py-4 border-0 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <FiPaperclip className="w-5 h-5" />
                  <span>Search Flights</span>
                </button>
              </form>
            </div>
          </div>
        </section>

      </div>
        <GlobalComponent />

    </>
  );
};

export default Flight;