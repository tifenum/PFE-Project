"use client";
import dynamic from 'next/dynamic';
import { MapillaryViewerProps } from './MapillaryViewer';

// Disable SSR for MapillaryViewer
const MapillaryViewer = dynamic<MapillaryViewerProps>(
  () => import('./MapillaryViewer'),
  { ssr: false }
);

export default function MapPage() {
  console.log('MapPage: Rendered on', typeof window === 'undefined' ? 'server' : 'client');
  return (
    <MapillaryViewer
      mapillaryAccessToken="MLY|9776335315776862|eab7ce300d7a94bc52a0e3bd54a246f7"
      mapboxAccessToken="pk.eyJ1IjoiaGFubmliYWwtYmFyY2EiLCJhIjoiY21iNnN2bm8xMDJtMDJsczYxbTV2Ymd4cyJ9.owVA62od8tnPG22xWloCVQ"
    />
  );
}