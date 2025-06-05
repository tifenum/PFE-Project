'use client';
import { useLoading } from './LoadingContext';
import GlobalLoader from './GlobalLoader';
import MapLoader from './MapLoader';
import { usePathname } from 'next/navigation';

export default function ClientGlobalLoaderWrapper() {
  const { isLoading } = useLoading();
  const pathname = usePathname();

  if (!isLoading) return null;

  return pathname === '/map' ? <MapLoader /> : <GlobalLoader />;
}