'use client';
import { useLoading } from './LoadingContext';
import GlobalLoader from './GlobalLoader';

export default function ClientGlobalLoaderWrapper() {
  const { isLoading } = useLoading();
  return isLoading ? <GlobalLoader /> : null;
}