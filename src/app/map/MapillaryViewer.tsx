"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import MapContainer from './MapContainer';
import ViewerContainer from './ViewerContainer';
import mapboxgl from 'mapbox-gl';
import countryCoordinates from './countryCoordinates';

export interface MapillaryViewerProps {
  mapillaryAccessToken: string;
  mapboxAccessToken: string;
  headerHeight?: number;
}

export default function MapillaryViewer({
  mapillaryAccessToken,
  mapboxAccessToken,
  headerHeight = 0,
}: MapillaryViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const positionMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [viewMode, setViewMode] = useState<string>('default');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');
  const [actualHeaderHeight, setActualHeaderHeight] = useState(headerHeight);
  const [initialImageId, setInitialImageId] = useState<string>(countryCoordinates[0]?.image_id);
  const [initialSequenceKey, setInitialSequenceKey] = useState<string>(countryCoordinates[0]?.sequence_key || '');
  const [isContainerReady, setIsContainerReady] = useState(false);

  useEffect(() => {
    console.log('MapillaryViewer: Mounted');
    return () => {
      console.log('MapillaryViewer: Unmounted');
    };
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setIsContainerReady(true);
    } else {
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          setIsContainerReady(true);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      setActualHeaderHeight(header ? header.offsetHeight : 0);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
    };
  }, []);

  // Listen for imageId updates from ViewerContainer
  useEffect(() => {
    const handleUpdateImageId = (event: Event) => {
      const customEvent = event as CustomEvent<{ imageId: string }>;
      setInitialImageId(customEvent.detail.imageId);
      // Look up sequence_key from countryCoordinates
      const countryData = countryCoordinates.find(c => c.image_id === customEvent.detail.imageId);
      setInitialSequenceKey(countryData?.sequence_key || '');
      console.log('MapillaryViewer: Updated initialImageId to', customEvent.detail.imageId, 'sequenceKey', countryData?.sequence_key || '');
    };

    containerRef.current?.addEventListener('updateImageId', handleUpdateImageId);

    return () => {
      containerRef.current?.removeEventListener('updateImageId', handleUpdateImageId);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isContainerReady) return;

    const viewerWrapper = containerRef.current.querySelector('.viewer-wrapper') as HTMLDivElement | null;
    const viewerContainer = containerRef.current.querySelector('.viewer') as HTMLDivElement | null;
    const mapContainer = containerRef.current.querySelector('.map-container') as HTMLDivElement | null;

    if (!viewerWrapper || !viewerContainer || !mapContainer) return;

    viewerWrapper.style.transition = 'transform 0.2s ease';
    viewerContainer.style.transition = 'none';
    mapContainer.style.transition = 'none';
    mapContainer.style.zIndex = '10';

    switch (viewMode) {
      case 'default':
        viewerWrapper.style.display = 'block';
        viewerWrapper.style.width = '350px';
        viewerWrapper.style.height = '200px';
        viewerWrapper.style.bottom = '20px';
        viewerWrapper.style.left = '20px';
        viewerWrapper.style.zIndex = '100';
        viewerWrapper.style.transform = 'scale(1)';
        mapContainer.style.display = 'block';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = '100vh';
        mapContainer.style.zIndex = '10';
        break;
      case 'map':
        viewerWrapper.style.display = 'none';
        mapContainer.style.display = 'block';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = '100vh';
        mapContainer.style.zIndex = '10';
        break;
      case 'viewer':
        viewerWrapper.style.display = 'block';
        viewerWrapper.style.width = '100vw';
        viewerWrapper.style.height = '100vh';
        viewerWrapper.style.bottom = '0';
        viewerWrapper.style.left = '0';
        viewerWrapper.style.zIndex = '100';
        viewerWrapper.style.transform = 'scale(1)';
        mapContainer.style.display = 'none';
        break;
      case 'swapped':
        viewerWrapper.style.display = 'block';
        viewerWrapper.style.width = '100vw';
        viewerWrapper.style.height = '100vh';
        viewerWrapper.style.bottom = '0';
        viewerWrapper.style.left = '0';
        viewerWrapper.style.zIndex = '10';
        viewerWrapper.style.transform = 'scale(1)';
        mapContainer.style.display = 'block';
        mapContainer.style.width = '350px';
        mapContainer.style.height = '200px';
        mapContainer.style.bottom = '80px';
        mapContainer.style.left = '20px';
        mapContainer.style.zIndex = '100';
        break;
    }

    const handleHover = () => {
      if (viewMode === 'default' || viewMode === 'swapped') {
        viewerWrapper.style.transform = 'scale(1.1)';
      }
    };
    const handleHoverOut = () => {
      if (viewMode === 'default' || viewMode === 'swapped') {
        viewerWrapper.style.transform = 'scale(1)';
      }
    };

    viewerWrapper.addEventListener('mouseenter', handleHover);
    viewerWrapper.addEventListener('mouseleave', handleHoverOut);

    const handleResize = () => {
      if (window.innerWidth <= 600 && (viewMode === 'default' || viewMode === 'swapped')) {
        viewerWrapper.style.width = viewMode === 'default' ? '200px' : '100vw';
        viewerWrapper.style.height = viewMode === 'default' ? '150px' : '100vh';
        mapContainer.style.width = viewMode === 'swapped' ? '200px' : '100vw';
        mapContainer.style.height = viewMode === 'swapped' ? '150px' : '100vh';
      } else if (viewMode === 'default' || viewMode === 'swapped') {
        viewerWrapper.style.width = viewMode === 'default' ? '350px' : '100vw';
        viewerWrapper.style.height = viewMode === 'default' ? '200px' : '100vh';
        mapContainer.style.width = viewMode === 'swapped' ? '350px' : '100vw';
        mapContainer.style.height = viewMode === 'swapped' ? '200px' : '100vh';
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      viewerWrapper.removeEventListener('mouseenter', handleHover);
      viewerWrapper.removeEventListener('mouseleave', handleHoverOut);
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, actualHeaderHeight, isContainerReady]);

  const toggleView = () => {
    setViewMode(prevMode => {
      switch (prevMode) {
        case 'default':
          return 'map';
        case 'map':
          return 'viewer';
        case 'viewer':
          return 'swapped';
        case 'swapped':
          return 'default';
        default:
          return 'default';
      }
    });
  };

  const handleSetImageId = ({ imageId, sequenceKey }: { imageId: string; sequenceKey: string }) => {
    setInitialImageId(imageId);
    setInitialSequenceKey(sequenceKey);
    console.log('MapillaryViewer: Set imageId', imageId, 'sequenceKey', sequenceKey);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
      >
        {isContainerReady && containerRef.current && (
          <MapContainer
            key="map-container"
            mapboxAccessToken={mapboxAccessToken}
            mapStyle={mapStyle}
            container={containerRef.current}
            viewerRef={viewerRef}
            positionMarkerRef={positionMarkerRef}
            setImageId={handleSetImageId}
          />
        )}
        {isContainerReady && containerRef.current && (
          <ViewerContainer
            key="viewer-container"
            mapillaryAccessToken={mapillaryAccessToken}
            headerHeight={actualHeaderHeight}
            container={containerRef.current}
            initialImageId={initialImageId}
            initialSequenceKey={initialSequenceKey}
            positionMarkerRef={positionMarkerRef}
            mapRef={mapRef}
            viewerRef={viewerRef}
          />
        )}
      </div>
    </div>
  );
}