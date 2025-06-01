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
  const [isViewerMinimized, setIsViewerMinimized] = useState(false);
  const [isMapMinimized, setIsMapMinimized] = useState(false);

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
    if (!containerRef.current || !isContainerReady) {
      console.log('MapillaryViewer: containerRef or isContainerReady not ready');
      return;
    }

    const viewerWrapper = containerRef.current.querySelector('.viewer-wrapper') as HTMLDivElement | null;
    const viewerContainer = containerRef.current.querySelector('.viewer') as HTMLDivElement | null;
    const mapContainer = containerRef.current.querySelector('.map-container') as HTMLDivElement | null;

    console.log('MapillaryViewer: viewerWrapper', viewerWrapper, 'mapContainer', mapContainer, 'viewMode', viewMode);

    if (!viewerWrapper || !viewerContainer || !mapContainer) {
      console.log('MapillaryViewer: Missing DOM elements', { viewerWrapper, viewerContainer, mapContainer });
      return;
    }

    viewerWrapper.style.transition = 'all 0.2s ease';
    viewerContainer.style.transition = 'none';
    mapContainer.style.transition = 'all 0.2s ease';
    mapContainer.style.position = 'absolute';

    // Define SVG icons
    const expandIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 0 0 0 2 2h3"></path>
      </svg>
    `;
    const restoreIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 8V5a2 2 0 0 1 2-2h3m13 0h3a2 2 0 0 1 2 2v3m0 13v3a2 2 0 0 1-2 2h-3m-13 0H5a2 2 0 0 1-2-2v-3"></path>
      </svg>
    `;
    const minimizeIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;
    const minimizedIcon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3l18 18M3 21l18-18M9 3v18M15 3v18M3 9h18M3 15h18"></path>
      </svg>
    `;

    // Apply styles based on viewMode and minimization state
    switch (viewMode) {
      case 'default':
        viewerWrapper.style.display = isViewerMinimized ? 'none' : 'block';
        viewerWrapper.style.width = '350px';
        viewerWrapper.style.height = '250px';
        viewerWrapper.style.bottom = '20px';
        viewerWrapper.style.left = '20px';
        viewerWrapper.style.zIndex = '100';
        viewerWrapper.style.transform = 'scale(1)';
        viewerWrapper.style.borderRadius = '8px';
        viewerWrapper.style.overflow = 'hidden';
        viewerWrapper.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        mapContainer.style.display = isMapMinimized ? 'none' : 'block';
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
        viewerWrapper.style.display = isViewerMinimized ? 'none' : 'block';
        viewerWrapper.style.width = '100vw';
        viewerWrapper.style.height = '100vh';
        viewerWrapper.style.bottom = '0';
        viewerWrapper.style.left = '0';
        viewerWrapper.style.zIndex = '10';
        viewerWrapper.style.transform = 'scale(1)';
        viewerWrapper.style.borderRadius = '0';
        viewerWrapper.style.overflow = 'hidden';
        viewerWrapper.style.boxShadow = 'none';
        mapContainer.style.display = isMapMinimized ? 'none' : 'block';
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

    // Remove existing buttons and icons
    const existingButtons = containerRef.current.querySelectorAll('.toggle-button, .minimize-button');
    const existingIcons = containerRef.current.querySelectorAll('.minimized-icon');
    console.log('MapillaryViewer: Removing existing buttons', existingButtons.length, 'icons', existingIcons.length);
    existingButtons.forEach(btn => btn.remove());
    existingIcons.forEach(icon => icon.remove());

    // Add toggle and minimize buttons
    if (viewMode === 'default' && viewerWrapper && !isViewerMinimized) {
      // Toggle button
      const toggleButton = document.createElement('button');
      toggleButton.innerHTML = expandIcon;
      toggleButton.style.position = 'absolute';
      toggleButton.style.top = '10px';
      toggleButton.style.right = '10px';
      toggleButton.style.zIndex = '102';
      toggleButton.style.backgroundColor = 'white';
      toggleButton.style.border = '1px solid #ccc';
      toggleButton.style.borderRadius = '4px';
      toggleButton.style.padding = '5px';
      toggleButton.style.cursor = 'pointer';
      toggleButton.style.pointerEvents = 'auto';
      toggleButton.className = 'toggle-button';
      toggleButton.addEventListener('click', () => {
        console.log('MapillaryViewer: Toggle button clicked, setting viewMode to swapped');
        setViewMode('swapped');
        setIsViewerMinimized(false);
        setIsMapMinimized(false);
      });
      viewerWrapper.appendChild(toggleButton);

      // Minimize button
      const minimizeButton = document.createElement('button');
      minimizeButton.innerHTML = minimizeIcon;
      minimizeButton.style.position = 'absolute';
      minimizeButton.style.top = '10px';
      minimizeButton.style.right = '40px';
      minimizeButton.style.zIndex = '102';
      minimizeButton.style.backgroundColor = 'white';
      minimizeButton.style.border = '1px solid #ccc';
      minimizeButton.style.borderRadius = '4px';
      minimizeButton.style.padding = '5px';
      minimizeButton.style.cursor = 'pointer';
      minimizeButton.style.pointerEvents = 'auto';
      minimizeButton.className = 'minimize-button';
      minimizeButton.addEventListener('click', () => {
        console.log('MapillaryViewer: Minimize viewer button clicked');
        setIsViewerMinimized(true);
        console.log('MapillaryViewer: viewerWrapper styles after minimize', viewerWrapper.style.display);
      });
      viewerWrapper.appendChild(minimizeButton);
    } else if (viewMode === 'swapped' && mapContainer && !isMapMinimized) {
      // Toggle button
      const toggleButton = document.createElement('button');
      toggleButton.innerHTML = restoreIcon;
      toggleButton.style.position = 'absolute';
      toggleButton.style.top = '10px';
      toggleButton.style.right = '10px';
      toggleButton.style.zIndex = '102';
      toggleButton.style.backgroundColor = 'white';
      toggleButton.style.border = '1px solid #ccc';
      toggleButton.style.borderRadius = '4px';
      toggleButton.style.padding = '5px';
      toggleButton.style.cursor = 'pointer';
      toggleButton.style.pointerEvents = 'auto';
      toggleButton.className = 'toggle-button';
      toggleButton.addEventListener('click', () => {
        console.log('MapillaryViewer: Toggle button clicked, setting viewMode to default');
        setViewMode('default');
        setIsViewerMinimized(false);
        setIsMapMinimized(false);
      });
      mapContainer.appendChild(toggleButton);

      // Minimize button
      const minimizeButton = document.createElement('button');
      minimizeButton.innerHTML = minimizeIcon;
      minimizeButton.style.position = 'absolute';
      minimizeButton.style.top = '10px';
      minimizeButton.style.right = '40px';
      minimizeButton.style.zIndex = '102';
      minimizeButton.style.backgroundColor = 'white';
      minimizeButton.style.border = '1px solid #ccc';
      minimizeButton.style.borderRadius = '4px';
      minimizeButton.style.padding = '5px';
      minimizeButton.style.cursor = 'pointer';
      minimizeButton.style.pointerEvents = 'auto';
      minimizeButton.className = 'minimize-button';
      minimizeButton.addEventListener('click', () => {
        console.log('MapillaryViewer: Minimize map button clicked');
        setIsMapMinimized(true);
        console.log('MapillaryViewer: mapContainer styles after minimize', mapContainer.style.display);
      });
      mapContainer.appendChild(minimizeButton);
    }

    // Add minimized icons
    if (isViewerMinimized) {
      const viewerIcon = document.createElement('button');
      viewerIcon.innerHTML = minimizedIcon;
      viewerIcon.className = 'minimized-icon';
      viewerIcon.style.position = 'absolute';
      viewerIcon.style.bottom = '20px';
      viewerIcon.style.left = '20px';
      viewerIcon.style.width = '36px';
      viewerIcon.style.height = '36px';
      viewerIcon.style.backgroundColor = 'rgba(0,0,0,0.5)';
      viewerIcon.style.border = 'none';
      viewerIcon.style.borderRadius = '50%';
      viewerIcon.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      viewerIcon.style.cursor = 'pointer';
      viewerIcon.style.display = 'flex';
      viewerIcon.style.alignItems = 'center';
      viewerIcon.style.justifyContent = 'center';
      viewerIcon.style.zIndex = '103';
      viewerIcon.addEventListener('click', () => {
        console.log('MapillaryViewer: Viewer icon clicked, restoring viewer');
        setIsViewerMinimized(false);
      });
      containerRef.current.appendChild(viewerIcon);
    }

    if (isMapMinimized) {
      const mapIcon = document.createElement('button');
      mapIcon.innerHTML = minimizedIcon;
      mapIcon.className = 'minimized-icon';
      mapIcon.style.position = 'absolute';
      mapIcon.style.bottom = '60px'; // Changed to stack vertically above viewer icon
      mapIcon.style.left = '20px';   // Aligned with viewer icon
      mapIcon.style.width = '36px';
      mapIcon.style.height = '36px';
      mapIcon.style.backgroundColor = 'rgba(0,0,0,0.5)';
      mapIcon.style.border = 'none';
      mapIcon.style.borderRadius = '50%';
      mapIcon.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      mapIcon.style.cursor = 'pointer';
      mapIcon.style.display = 'flex';
      mapIcon.style.alignItems = 'center';
      mapIcon.style.justifyContent = 'center';
      mapIcon.style.zIndex = '103';
      mapIcon.addEventListener('click', () => {
        console.log('MapillaryViewer: Map icon clicked, restoring map');
        setIsMapMinimized(false);
      });
      containerRef.current.appendChild(mapIcon);
    }

    // Resize map and viewer after layout change
    setTimeout(() => {
      if (mapRef.current && !isMapMinimized) {
        console.log('MapillaryViewer: Resizing map');
        mapRef.current.resize();
      }
      if (viewerRef.current && !isViewerMinimized) {
        console.log('MapillaryViewer: Resizing viewer');
        viewerRef.current.resize();
      }
    }, 200);

    const handleViewerHover = () => {
      if (viewMode === 'default' && !isViewerMinimized) {
        viewerWrapper.style.transform = 'scale(1.1)';
      }
    };
    const handleViewerHoverOut = () => {
      if (viewMode === 'default' && !isViewerMinimized) {
        viewerWrapper.style.transform = 'scale(1)';
      }
    };
    const handleMapHover = () => {
      if (viewMode === 'swapped' && !isMapMinimized) {
        mapContainer.style.transform = 'scale(1.1)';
      }
    };
    const handleMapHoverOut = () => {
      if (viewMode === 'swapped' && !isMapMinimized) {
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
      const isMobile = window.innerWidth <= 600;
      if (isMobile) {
        if (viewMode === 'default') {
          viewerWrapper.style.width = isViewerMinimized ? '0' : '200px';
          viewerWrapper.style.height = isViewerMinimized ? '0' : '150px';
          mapContainer.style.width = isMapMinimized ? '0' : '100vw';
          mapContainer.style.height = isMapMinimized ? '0' : '100vh';
        } else if (viewMode === 'swapped') {
          viewerWrapper.style.width = isViewerMinimized ? '0' : '100vw';
          viewerWrapper.style.height = isViewerMinimized ? '0' : '100vh';
          mapContainer.style.width = isMapMinimized ? '0' : '200px';
          mapContainer.style.height = isMapMinimized ? '0' : '150px'; // Fixed typo from isViewerMinimized
        }
        // Adjust button/icon sizes for mobile
        const minimizeButtons = containerRef.current?.querySelectorAll('.minimize-button');
        minimizeButtons?.forEach(btn => {
          btn.querySelector('svg')?.setAttribute('width', '14');
          btn.querySelector('svg')?.setAttribute('height', '14');
        });
        const minimizedIcons = containerRef.current?.querySelectorAll('.minimized-icon');
        minimizedIcons?.forEach(icon => {
          (icon as HTMLElement).style.width = '32px';
          (icon as HTMLElement).style.height = '32px';
          icon.querySelector('svg')?.setAttribute('width', '18');
          icon.querySelector('svg')?.setAttribute('height', '18');
        });
      } else {
        if (viewMode === 'default') {
          viewerWrapper.style.width = isViewerMinimized ? '0' : '350px';
          viewerWrapper.style.height = isViewerMinimized ? '0' : '250px';
          mapContainer.style.width = isMapMinimized ? '0' : '100vw';
          mapContainer.style.height = isMapMinimized ? '0' : '100vh';
        } else if (viewMode === 'swapped') {
          viewerWrapper.style.width = isViewerMinimized ? '0' : '100vw';
          viewerWrapper.style.height = isViewerMinimized ? '0' : '100vh';
          mapContainer.style.width = isMapMinimized ? '0' : '350px';
          mapContainer.style.height = isMapMinimized ? '0' : '250px';
        }
        // Reset button/icon sizes for desktop
        const minimizeButtons = containerRef.current?.querySelectorAll('.minimize-button');
        minimizeButtons?.forEach(btn => {
          btn.querySelector('svg')?.setAttribute('width', '16');
          btn.querySelector('svg')?.setAttribute('height', '16');
        });
        const minimizedIcons = containerRef.current?.querySelectorAll('.minimized-icon');
        minimizedIcons?.forEach(icon => {
          (icon as HTMLElement).style.width = '36px';
          (icon as HTMLElement).style.height = '36px';
          icon.querySelector('svg')?.setAttribute('width', '20');
          icon.querySelector('svg')?.setAttribute('height', '20');
        });
      }
      // Ensure transform is reset after resize
      viewerWrapper.style.transform = viewMode === 'default' && !isViewerMinimized ? 'scale(1)' : 'scale(1)';
      mapContainer.style.transform = viewMode === 'swapped' && !isMapMinimized ? 'scale(1)' : 'scale(1)';
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
  }, [viewMode, actualHeaderHeight, isContainerReady, isViewerMinimized, isMapMinimized]);

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
          position: 'relative',
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