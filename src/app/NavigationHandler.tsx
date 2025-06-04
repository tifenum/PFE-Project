'use client';
import { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoading } from './LoadingContext';

const NavigationHandler = () => {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoading();

  useLayoutEffect(() => {
    const deferUpdate = (fn: () => void) => {
      requestAnimationFrame(() => fn());
    };

    const handleRouteChangeStart = () => deferUpdate(showLoader);
    const handleRouteChangeComplete = () => deferUpdate(hideLoader);
    const handleRouteChangeError = () => deferUpdate(hideLoader);

    // Next.js App Router doesn't have direct router.events like Pages Router,
    // but we can use window.history.pushState/replaceState as a proxy for navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      deferUpdate(showLoader);
      return originalPushState.apply(window.history, args);
    };

    window.history.replaceState = function (...args) {
      deferUpdate(showLoader);
      return originalReplaceState.apply(window.history, args);
    };

    // Fallback for client-side navigation
    const handlePopState = () => deferUpdate(showLoader);
    window.addEventListener('popstate', handlePopState);

    // Assume route change completes after a short delay (since no direct event)
    const timeout = setTimeout(() => deferUpdate(hideLoader), 1000); // Adjust as needed

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(timeout);
    };
  }, [router, showLoader, hideLoader]);

  return null;
};

export default NavigationHandler;