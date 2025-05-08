'use client';
import React from 'react';

const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 dark:bg-gray-900/20 backdrop-blur-sm z-50">
      <div className="w-16 h-16 border-4 border-t-[#4A6CF7] border-[#4A6CF7]/30 rounded-full animate-spin"></div>
    </div>
  );
};

export default GlobalLoader;