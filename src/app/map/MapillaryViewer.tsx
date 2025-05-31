"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import MapContainer from './MapContainer';
import ViewerContainer from './ViewerContainer';
import mapboxgl from 'mapbox-gl';
import countryCoordinates from './countryCoordinates';
import 'mapillary-js/dist/mapillary.css';

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
  const [initialImageId, setInitialImageId] = useState<string>("9914836918642212");
  const [initialSequenceKey, setInitialSequenceKey] = useState<string>("ws0E4KRpYoCr1WySn7xhJV");
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

  useEffect(() => {
    const handleUpdateImageId = (event: Event) => {
      const customEvent = event as CustomEvent<{ imageId: string }>;
      setInitialImageId(customEvent.detail.imageId);
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

    viewerWrapper.style.transition = 'all 0.2s ease';
    viewerContainer.style.transition = 'none';
    mapContainer.style.transition = 'all 0.2s ease';
    mapContainer.style.position = 'absolute';

    // Define SVG icons for toggle buttons
    const expandIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
      </svg>
    `;
    const restoreIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 8V5a2 2 0 0 1 2-2h3m13 0h3a2 2 0 0 1 2 2v3m0 13v3a2 2 0 0 1-2 2h-3m-13 0H5a2 2 0 0 1-2-2v-3"></path>
      </svg>
    `;

    switch (viewMode) {
      case 'default':
        viewerWrapper.style.display = 'block';
        viewerWrapper.style.width = '350px';
        viewerWrapper.style.height = '250px';
        viewerWrapper.style.bottom = '20px';
        viewerWrapper.style.left = '20px';
        viewerWrapper.style.zIndex = '100';
        viewerWrapper.style.transform = 'scale(1)';
        viewerWrapper.style.borderRadius = '8px';
        viewerWrapper.style.overflow = 'hidden';
        viewerWrapper.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        mapContainer.style.display = 'block';
        mapContainer.style.top = '0';
        mapContainer.style.left = '0';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = '100vh';
        mapContainer.style.zIndex = '10';
        mapContainer.style.borderRadius = '0';
        mapContainer.style.boxShadow = 'none';
        mapContainer.style.transform = 'scale(1)';
        break;
      case 'swapped':
        viewerWrapper.style.display = 'block';
        viewerWrapper.style.width = '100vw';
        viewerWrapper.style.height = '100vh';
        viewerWrapper.style.bottom = '0';
        viewerWrapper.style.left = '0';
        viewerWrapper.style.zIndex = '10';
        viewerWrapper.style.transform = 'scale(1)';
        viewerWrapper.style.borderRadius = '0';
        viewerWrapper.style.overflow = 'hidden';
        viewerWrapper.style.boxShadow = 'none';
        mapContainer.style.display = 'block';
        mapContainer.style.top = '';
        mapContainer.style.bottom = '20px';
        mapContainer.style.left = '20px';
        mapContainer.style.width = '350px';
        mapContainer.style.height = '250px';
        mapContainer.style.zIndex = '100';
        mapContainer.style.borderRadius = '8px';
        mapContainer.style.overflow = 'hidden';
        mapContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        mapContainer.style.transform = 'scale(1)';
        break;
    }

    // Remove existing toggle buttons
    const existingButtons = containerRef.current.querySelectorAll('.toggle-button');
    existingButtons.forEach(btn => btn.remove());

    // Add toggle button based on viewMode
    if (viewMode === 'default' && viewerWrapper) {
      const button = document.createElement('button');
      button.innerHTML = expandIcon;
      button.style.position = 'absolute';
      button.style.top = '10px';
      button.style.right = '10px';
      button.style.zIndex = '101';
      button.style.backgroundColor = 'white';
      button.style.border = '1px solid #ccc';
      button.style.borderRadius = '4px';
      button.style.padding = '5px';
      button.style.cursor = 'pointer';
      button.className = 'toggle-button';
      button.addEventListener('click', () => setViewMode('swapped'));
      viewerWrapper.appendChild(button);
    } else if (viewMode === 'swapped' && mapContainer) {
      const button = document.createElement('button');
      button.innerHTML = restoreIcon;
      button.style.position = 'absolute';
      button.style.top = '10px';
      button.style.right = '10px';
      button.style.zIndex = '101';
      button.style.backgroundColor = 'white';
      button.style.border = '1px solid #ccc';
      button.style.borderRadius = '4px';
      button.style.padding = '5px';
      button.style.cursor = 'pointer';
      button.className = 'toggle-button';
      button.addEventListener('click', () => setViewMode('default'));
      mapContainer.appendChild(button);
    }

    // Resize map and viewer after layout change
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
      if (viewerRef.current) {
        viewerRef.current.resize();
      }
    }, 200);

    const handleViewerHover = () => {
      if (viewMode === 'default') {
        viewerWrapper.style.transform = 'scale(1.1)';
      }
    };
    const handleViewerHoverOut = () => {
      if (viewMode === 'default') {
        viewerWrapper.style.transform = 'scale(1)';
      }
    };
    const handleMapHover = () => {
      if (viewMode === 'swapped') {
        mapContainer.style.transform = 'scale(1.1)';
      }
    };
    const handleMapHoverOut = () => {
      if (viewMode === 'swapped') {
        mapContainer.style.transform = 'scale(1)';
      }
    };

    // Remove existing event listeners to prevent duplicates
    viewerWrapper.removeEventListener('mouseenter', handleViewerHover);
    viewerWrapper.removeEventListener('mouseleave', handleViewerHoverOut);
    mapContainer.removeEventListener('mouseenter', handleMapHover);
    mapContainer.removeEventListener('mouseleave', handleMapHoverOut);

    // Add new event listeners
    viewerWrapper.addEventListener('mouseenter', handleViewerHover);
    viewerWrapper.addEventListener('mouseleave', handleViewerHoverOut);
    mapContainer.addEventListener('mouseenter', handleMapHover);
    mapContainer.addEventListener('mouseleave', handleMapHoverOut);

    const handleResize = () => {
      if (window.innerWidth <= 600) {
        if (viewMode === 'default') {
          viewerWrapper.style.width = '200px';
          viewerWrapper.style.height = '150px';
          mapContainer.style.width = '100vw';
          mapContainer.style.height = '100vh';
        } else if (viewMode === 'swapped') {
          viewerWrapper.style.width = '100vw';
          viewerWrapper.style.height = '100vh';
          mapContainer.style.width = '200px';
          mapContainer.style.height = '150px';
        }
      } else {
        if (viewMode === 'default') {
          viewerWrapper.style.width = '350px';
          viewerWrapper.style.height = '250px';
          mapContainer.style.width = '100vw';
          mapContainer.style.height = '100vh';
        } else if (viewMode === 'swapped') {
          viewerWrapper.style.width = '100vw';
          viewerWrapper.style.height = '100vh';
          mapContainer.style.width = '350px';
          mapContainer.style.height = '250px';
        }
      }
      // Ensure transform is reset after resize
      viewerWrapper.style.transform = viewMode === 'default' ? 'scale(1)' : 'scale(1)';
      mapContainer.style.transform = viewMode === 'swapped' ? 'scale(1)' : 'scale(1)';
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      viewerWrapper.removeEventListener('mouseenter', handleViewerHover);
      viewerWrapper.removeEventListener('mouseleave', handleViewerHoverOut);
      mapContainer.removeEventListener('mouseenter', handleMapHover);
      mapContainer.removeEventListener('mouseleave', handleMapHoverOut);
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, actualHeaderHeight, isContainerReady]);

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