'use client';
import { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoading } from './LoadingContext';
import { usePathname } from 'next/navigation';

const NavigationHandler = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader, hideLoader } = useLoading();

  useLayoutEffect(() => {
    const deferUpdate = (fn: () => void) => {
      requestAnimationFrame(() => fn());
    };

    const handleRouteChangeStart = () => deferUpdate(showLoader);
    const handleRouteChangeComplete = () => deferUpdate(hideLoader);
    const handleRouteChangeError = () => deferUpdate(hideLoader);

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

    const handlePopState = () => deferUpdate(showLoader);
    window.addEventListener('popstate', handlePopState);

    // Set timeout based on route: 1000ms for /map, 500ms for others
    const timeoutDuration = pathname === '/map' ? 1500 : 500;
    const timeout = setTimeout(() => deferUpdate(hideLoader), timeoutDuration);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(timeout);
    };
  }, [router, showLoader, hideLoader, pathname]);

  return null;
};

export default NavigationHandler;