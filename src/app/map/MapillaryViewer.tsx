"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import MapContainer from './MapContainer';
import ViewerContainer from './ViewerContainer';
import mapboxgl from 'mapbox-gl';

export interface MapillaryViewerProps {
  mapillaryAccessToken: string;
  mapboxAccessToken: string;
  headerHeight?: number;
}

export default function MapillaryViewer({ mapillaryAccessToken, mapboxAccessToken, headerHeight = 0 }: MapillaryViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const positionMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [viewMode, setViewMode] = useState<string>('default');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');
  const [actualHeaderHeight, setActualHeaderHeight] = useState(headerHeight);
  const [initialImageId, setInitialImageId] = useState<string | null>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);

  useLayoutEffect(() => {
    console.log('MapillaryViewer: useLayoutEffect, containerRef.current=', containerRef.current);
    if (containerRef.current) {
      console.log('MapillaryViewer: Container ref set, marking ready');
      setIsContainerReady(true);
    } else {
      console.warn('MapillaryViewer: Container ref is null, retrying...');
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          console.log('MapillaryViewer: Container ref set on retry');
          setIsContainerReady(true);
        } else {
          console.error('MapillaryViewer: Container ref still null after retry');
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    console.log('MapillaryViewer: Mounted, containerRef.current=', containerRef.current);
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        const height = header.offsetHeight;
        setActualHeaderHeight(height);
        console.log('MapillaryViewer: Header height updated', height);
      } else {
        setActualHeaderHeight(0);
        console.log('MapillaryViewer: No header found, setting height to 0');
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
    };
  }, []);

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

  const handleSetImageId = (imageId: string) => {
    console.log('MapillaryViewer: Setting initialImageId', imageId);
    setInitialImageId(imageId);
  };

  useEffect(() => {
    console.log('MapillaryViewer: View mode changed', viewMode);
    if (!containerRef.current || !isContainerReady) {
      console.warn('MapillaryViewer: containerRef.current or isContainerReady false, skipping view mode setup');
      return;
    }

    const retryDOMSetup = (attempts = 3, delay = 100) => {
      const viewerWrapper = containerRef.current!.querySelector('.viewer-wrapper') as HTMLDivElement | null;
      const viewerContainer = containerRef.current!.querySelector('.viewer') as HTMLDivElement | null;
      const mapContainer = containerRef.current!.querySelector('.map-container') as HTMLDivElement | null;
      console.log('MapillaryViewer: DOM elements', { viewerWrapper, viewerContainer, mapContainer });

      if (!viewerWrapper || !viewerContainer || !mapContainer) {
        console.warn('MapillaryViewer: Missing DOM elements on attempt', { attempts, viewerWrapper, viewerContainer, mapContainer });
        if (attempts > 1) {
          setTimeout(() => retryDOMSetup(attempts - 1, delay * 2), delay);
        } else {
          console.error('MapillaryViewer: Failed to find DOM elements after retries');
        }
        return;
      }

      viewerWrapper.style.transition = 'transform 0.2s ease';
      viewerContainer.style.transition = 'none';
      mapContainer.style.transition = 'none';
      mapContainer.style.zIndex = '10';

      switch (viewMode) {
        case 'default':
          viewerWrapper.style.display = initialImageId && !initialImageId.startsWith('fallback-') ? 'block' : 'none';
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
          viewerWrapper.style.display = initialImageId && !initialImageId.startsWith('fallback-') ? 'block' : 'none';
          viewerWrapper.style.width = '100vw';
          viewerWrapper.style.height = '100vh';
          viewerWrapper.style.bottom = '0';
          viewerWrapper.style.left = '0';
          viewerWrapper.style.zIndex = '100';
          viewerWrapper.style.transform = 'scale(1)';
          mapContainer.style.display = 'none';
          break;
        case 'swapped':
          viewerWrapper.style.display = initialImageId && !initialImageId.startsWith('fallback-') ? 'block' : 'none';
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
    };

    retryDOMSetup();
  }, [viewMode, actualHeaderHeight, initialImageId, isContainerReady]);

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
            mapboxAccessToken={mapboxAccessToken}
            mapStyle={mapStyle}
            container={containerRef.current}
            viewerRef={viewerRef}
            positionMarkerRef={positionMarkerRef}
            setImageId={handleSetImageId}
          />
        )}
        {initialImageId && !initialImageId.startsWith('fallback-') && isContainerReady && containerRef.current && (
          <ViewerContainer
            mapillaryAccessToken={mapillaryAccessToken}
            headerHeight={actualHeaderHeight}
            container={containerRef.current}
            initialImageId={initialImageId}
            positionMarkerRef={positionMarkerRef}
            mapRef={mapRef}
            viewerRef={viewerRef}
          />
        )}
      </div>
    </div>
  );
}