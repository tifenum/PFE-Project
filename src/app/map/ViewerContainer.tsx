import React, { useEffect, useRef } from 'react';
import { Viewer, CameraControls } from 'mapillary-js';
import { makeContainers, makeMessage, makeLoadingIndicator, makeErrorMessage, moveToWithRetry, coordinateCache } from './mapUtils';
import mapboxgl from 'mapbox-gl';
import countryCoordinates from './countryCoordinates';

interface ViewerContainerProps {
  mapillaryAccessToken: string;
  headerHeight: number;
  container: HTMLDivElement | null;
  initialImageId?: string | null;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  viewerRef: React.MutableRefObject<any>;
}

export default function ViewerContainer({ mapillaryAccessToken, headerHeight, container, initialImageId, positionMarkerRef, mapRef, viewerRef }: ViewerContainerProps) {
  const isMounted = useRef(true);
  const viewerInitialized = useRef(false);
  const viewerWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('ViewerContainer: Mounted');
    return () => {
      console.log('ViewerContainer: Unmounted');
    };
  }, []);

  useEffect(() => {
    countryCoordinates.forEach(({ image_id, coords }) => {
      if (image_id && coords && !coordinateCache.has(image_id)) {
        coordinateCache.set(image_id, coords as [number, number]);
        console.log('ViewerContainer: Cached coordinates for image_id', image_id, coords);
      }
    });
  }, []);

  // Initialize viewer
  useEffect(() => {
    console.log('ViewerContainer: useEffect for initialization', { container });
    if (!container || viewerInitialized.current) {
      console.warn('ViewerContainer: Missing container or already initialized', { container, initialized: viewerInitialized.current });
      return;
    }

    isMounted.current = true;
    const { viewer, viewerWrapper } = makeContainers(container, headerHeight);
    viewerWrapperRef.current = viewerWrapper;
    console.log('ViewerContainer: Containers created', viewer, viewerWrapper);

    const viewerOptions = {
      accessToken: mapillaryAccessToken,
      container: viewer,
      cameraControls: CameraControls.Street,
      component: {
        cover: false,
        navigation: true,
        direction: true,
        pointer: { scrollZoom: false },
        sequence: { visible: false, playing: false },
        zoom: true,
      },
      trackResize: true,
    };

    const message = makeMessage('Loading Mapillary Viewer...');
    container.appendChild(message);

    let viewerInstance: Viewer;
    try {
      viewerInstance = new Viewer(viewerOptions);
      viewerRef.current = viewerInstance;
      viewerInitialized.current = true;
      console.log('ViewerContainer: Viewer created');
    } catch (error) {
      console.error('ViewerContainer: Failed to create Viewer', error);
      message.innerHTML = 'Failed to initialize viewer. Please refresh.';
      container.removeChild(message);
      return;
    }

    const onImage = async (image: any) => {
      if (!isMounted.current || !viewerRef.current) return;
      let lngLat: [number, number] | undefined;

      if (coordinateCache.has(image.id)) {
        lngLat = coordinateCache.get(image.id);
      } else {
        lngLat = image?.computed_geometry?.coordinates as [number, number];
        if (lngLat && Array.isArray(lngLat) && lngLat.length === 2 && !isNaN(lngLat[0]) && !isNaN(lngLat[1])) {
          coordinateCache.set(image.id, lngLat);
        } else {
          console.warn('ViewerContainer: Invalid lngLat from image', lngLat);
          return;
        }
      }

      if (!lngLat || isNaN(lngLat[0]) || isNaN(lngLat[1])) {
        console.warn('ViewerContainer: Invalid lngLat', lngLat);
        return;
      }

      if (mapRef.current && positionMarkerRef.current) {
        try {
          if (!mapRef.current.getBounds().contains(lngLat)) {
            mapRef.current.setCenter(lngLat);
          }
          if (!positionMarkerRef.current._map) {
            positionMarkerRef.current.addTo(mapRef.current);
          }
          positionMarkerRef.current.setLngLat(lngLat);
        } catch (error) {
          console.error('ViewerContainer: Error updating map', error);
        }
      }
    };

    const onPosition = async () => {
      if (!isMounted.current || !viewerRef.current) return;
      try {
        const position = await viewerRef.current.getPosition();
        if (!position || typeof position.lng !== 'number' || typeof position.lat !== 'number') return;
        const pos: [number, number] = [position.lng, position.lat];
        if (mapRef.current && positionMarkerRef.current && !positionMarkerRef.current._map) {
          positionMarkerRef.current.addTo(mapRef.current);
          positionMarkerRef.current.setLngLat(pos);
        }
      } catch (error) {
        console.error('ViewerContainer: Error in onPosition:', error);
      }
    };

    const handleContextLoss = () => {
      console.warn('ViewerContainer: WebGL context lost, attempting to recover');
      if (viewerWrapperRef.current) {
        const errorMsg = makeErrorMessage('Graphics error. Recovering...');
        viewerWrapperRef.current.appendChild(errorMsg);
        try {
          viewerRef.current?.remove();
          viewerInstance = new Viewer(viewerOptions);
          viewerRef.current = viewerInstance;
          viewerRef.current.isInitialized = true;
          if (initialImageId) {
            moveToWithRetry(viewerRef.current, initialImageId, 2, 300).then(result => {
              if (!result.success) {
                errorMsg.innerHTML = `Recovery failed: ${result.error}`;
                setTimeout(() => errorMsg.remove(), 3000);
              } else {
                errorMsg.remove();
              }
            });
          } else {
            errorMsg.remove();
          }
        } catch (error) {
          console.error('ViewerContainer: Failed to recover context', error);
          errorMsg.innerHTML = 'Failed to recover viewer. Please refresh.';
          setTimeout(() => errorMsg.remove(), 5000);
        }
      }
    };

    viewerRef.current.on('load', async () => {
      if (!isMounted.current || !viewerRef.current) return;
      console.log('ViewerContainer: Viewer loaded', { initialImageId });
      try {
        viewerRef.current.isInitialized = true;
        container.removeChild(message);
      } catch (error) {
        console.error('ViewerContainer: Load handler error:', error);
        message.innerHTML = 'Error loading viewer. Please refresh.';
        setTimeout(() => container.removeChild(message), 2000);
      }
    });

    viewerRef.current.on('image', async (event: any) => {
      if (!isMounted.current || !viewerRef.current) return;
      console.log('ViewerContainer: Image changed:', event.image.id);
      try {
        await onImage(event.image);
      } catch (error) {
        console.error('ViewerContainer: Image event error:', error);
      }
    });

    viewerRef.current.on('position', onPosition);

    viewerRef.current.on('error', (error: any) => {
      console.error('ViewerContainer: Viewer error:', error);
      if (error.message.includes('Context Lost')) {
        handleContextLoss();
      } else {
        const errorMsg = viewerWrapperRef.current;
        if (errorMsg) {
          const errorElement = makeErrorMessage(`Error: ${error.message}`);
          errorMsg.appendChild(errorElement);
          setTimeout(() => errorElement.remove(), 3000);
        }
      }
    });

    viewerRef.current.on('dataloading', () => {
      if (isMounted.current && viewerWrapperRef.current) {
        const indicator = makeLoadingIndicator();
        viewerWrapperRef.current.appendChild(indicator);
      }
    });

    viewerRef.current.on('dataloaded', () => {
      if (isMounted.current && viewerWrapperRef.current) {
        viewerWrapperRef.current?.querySelector('.loading-indicator')?.remove();
      }
    });

    const canvas = viewer.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLoss);
    }

    return () => {
      isMounted.current = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.off('load');
          viewerRef.current.off('image');
          viewerRef.current.off('position');
          viewerRef.current.off('error');
          viewerRef.current.off('dataloading');
          viewerRef.current.off('data');
          if (canvas) {
            canvas.removeEventListener('webglcontextlost', handleContextLoss);
          }
          viewerRef.current?.remove();
          viewerRef.current = null;
          viewerInitialized.current = false;
        } catch (error) {
          console.error('ViewerContainer: Cleanup error:', error);
        }
      }
      viewerWrapperRef.current?.querySelector('.loading-indicator')?.remove();
      viewerWrapperRef.current?.querySelector('.error-message')?.remove();
      console.log('ViewerContainer: Cleanup complete');
    };
  }, [mapillaryAccessToken, headerHeight, container]);

  // Handle image updates
  useEffect(() => {
    if (viewerRef.current && initialImageId && viewerInitialized.current) {
      console.log('ViewerContainer: Updating image to', initialImageId);
      moveToWithRetry(viewerRef.current, initialImageId, 2, 300, false).then(result => {
        if (!result.success) {
          console.warn('ViewerContainer: Failed to update image', initialImageId, result.error);
          if (viewerWrapperRef.current) {
            const errorMsg = makeErrorMessage(`Failed to load image: ${result.error}`);
            viewerWrapperRef.current.appendChild(errorMsg);
            setTimeout(() => errorMsg.remove(), 3000);
          }
        }
      });
    }
  }, [initialImageId]);

  return null;
}