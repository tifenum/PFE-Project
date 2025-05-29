
import React, { useEffect, useRef } from 'react';
import { Viewer, CameraControls } from 'mapillary-js';
import { makeContainers, makeMessage, makeLoadingIndicator, moveToWithRetry, coordinateCache } from './mapUtils';
import { fetchMapillaryImageDetails } from '@/services/userService';
import mapboxgl from 'mapbox-gl';

interface ViewerContainerProps {
  mapillaryAccessToken: string;
  headerHeight: number;
  container: HTMLDivElement;
  initialImageId?: string | null;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  viewerRef: React.MutableRefObject<any>;
}

export default function ViewerContainer({ mapillaryAccessToken, headerHeight, container, initialImageId, positionMarkerRef, mapRef, viewerRef }: ViewerContainerProps) {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (!container || !initialImageId) {
      console.warn('ViewerContainer: Missing container or initialImageId', { container, initialImageId });
      return;
    }

    const containers = makeContainers(container, headerHeight);
    const viewerOptions = {
      accessToken: mapillaryAccessToken,
      container: containers.viewer,
      imageId: initialImageId,
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

    try {
      viewerRef.current = new Viewer(viewerOptions);
      viewerRef.current.isInitialized = false;
      viewerRef.current.isLoading = false;
      viewerRef.current.pendingImageId = null;
    } catch (error) {
      console.error('ViewerContainer: Failed to create Viewer', error);
      message.innerHTML = 'Failed to initialize viewer. Please refresh.';
      return;
    }

    const onImage = async (image: any) => {
      if (!isMounted.current || !viewerRef.current) return;
      let lngLat: [number, number] | undefined;

      if (coordinateCache.has(image.id)) {
        lngLat = coordinateCache.get(image.id);
      } else if (image?.computed_geometry?.coordinates && Array.isArray(image.computed_geometry.coordinates) && image.computed_geometry.coordinates.length === 2) {
        lngLat = image.computed_geometry.coordinates as [number, number];
        coordinateCache.set(image.id, lngLat);
      } else {
        try {
          const imageDetails = await fetchMapillaryImageDetails(image.id);
          if (imageDetails?.coordinates && Array.isArray(imageDetails.coordinates) && imageDetails.coordinates.length === 2) {
            lngLat = imageDetails.coordinates as [number, number];
            coordinateCache.set(image.id, lngLat);
          }
        } catch (error) {
          console.error('ViewerContainer: Failed to fetch image details', error);
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
        if (!position || typeof position.lng !== 'number' || typeof position.lat !== 'number') {
          return;
        }
        const pos: [number, number] = [position.lng, position.lat];
        if (mapRef.current && positionMarkerRef.current && !positionMarkerRef.current._map) {
          positionMarkerRef.current.addTo(mapRef.current);
          positionMarkerRef.current.setLngLat(pos);
        }
      } catch (error) {
        console.error('ViewerContainer: Error in onPosition:', error);
      }
    };

    let loadTimeout = setTimeout(() => {
      if (!viewerRef.current?.isInitialized) {
        console.warn('ViewerContainer: Viewer load timed out after 10s');
        message.innerHTML = 'Failed to load viewer. Please refresh.';
      }
    }, 10000);

    viewerRef.current.on('load', async () => {
      if (!isMounted.current) return;
      console.log('ViewerContainer: Viewer loaded, initializing image');
      clearTimeout(loadTimeout);
      try {
        viewerRef.current.isInitialized = true;
        const success = await moveToWithRetry(viewerRef.current, initialImageId, 1, 500, true);
        if (!success) {
          console.warn('ViewerContainer: Failed to load initial image:', initialImageId);
          message.innerHTML = 'Failed to load initial image. Please try again.';
          setTimeout(() => {
            if (container.contains(message)) {
              container.removeChild(message);
            }
          }, 3000);
          return;
        }
        const image = await viewerRef.current.getImage();
        if (image) {
          await onImage(image);
          await onPosition();
          console.log('ViewerContainer: Initial image loaded successfully');
        } else {
          console.warn('ViewerContainer: No image returned after load');
          message.innerHTML = 'Failed to load initial image.';
          setTimeout(() => {
            if (container.contains(message)) {
              container.removeChild(message);
            }
          }, 3000);
          return;
        }
        if (container.contains(message)) {
          container.removeChild(message);
        }
      } catch (error) {
        console.error('ViewerContainer: Error in load handler:', error);
        message.innerHTML = 'Error loading viewer. Please refresh.';
        setTimeout(() => {
          if (container.contains(message)) {
            container.removeChild(message);
          }
        }, 2000);
      }
    });

    viewerRef.current.on('image', async (event: any) => {
      if (!isMounted.current || !viewerRef.current) return;
      console.log('ViewerContainer: Image changed:', event.image.id);
      try {
        await onImage(event.image);
        const indicator = container.querySelector('.loading-indicator');
        if (indicator) {
          container.removeChild(indicator);
        }
      } catch (error) {
        console.error('ViewerContainer: Error handling image event:', error);
      }
    });

    viewerRef.current.on('position', onPosition);

    viewerRef.current.on('error', (error: any) => {
      console.error('ViewerContainer: Viewer error:', error);
    });

    return () => {
      isMounted.current = false;
      if (viewerRef.current) {
        setTimeout(() => {
          try {
            viewerRef.current.remove();
            viewerRef.current = null;
          } catch (error) {
            console.error('ViewerContainer: Error during cleanup:', error);
          }
        }, 500);
      }
      if (container.contains(message)) {
        container.removeChild(message);
      }
      clearTimeout(loadTimeout);
    };
  }, [mapillaryAccessToken, headerHeight, container, initialImageId, positionMarkerRef, mapRef, viewerRef]);

  return null;
}
