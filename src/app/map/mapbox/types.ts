import mapboxgl from 'mapbox-gl';

export interface MapContainerProps {
  mapboxAccessToken: string;
  mapStyle: string;
  container: HTMLDivElement | null;
  viewerRef: React.MutableRefObject<any>;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  setImageId: (imageId: string) => void;
}

export interface MapStyle {
  name: string;
  url: string;
}