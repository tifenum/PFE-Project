import React, { useEffect, useRef } from 'react';
import { Viewer, CameraControls } from 'mapillary-js';
import { makeContainers, makeMessage, makeLoadingIndicator, moveToWithRetry, coordinateCache } from './mapUtils';
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

  useEffect(() => {
    countryCoordinates.forEach(({ image_id, coords }) => {
      if (image_id && coords && !coordinateCache.has(image_id)) {
        coordinateCache.set(image_id, coords as [number, number]);
        console.log('ViewerContainer: Cached coordinates for image_id', image_id, coords);
      }
    });
  }, []);

  useEffect(() => {
    console.log('ViewerContainer: useEffect', { container, initialImageId });
    if (!container || viewerInitialized.current) {
      console.warn('ViewerContainer: Missing container or already initialized', { container, initialized: viewerInitialized.current });
      return;
    }

    isMounted.current = true;
    const containers = makeContainers(container, headerHeight);
    console.log('ViewerContainer: Containers created', containers.viewer);

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

    let viewer: Viewer;
    try {
      viewer = new Viewer(viewerOptions);
      viewerRef.current = viewer;
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

    viewerRef.current.on('load', async () => {
      if (!isMounted.current || !viewerRef.current) return;
      console.log('ViewerContainer: Viewer loaded', { initialImageId });
      try {
        viewerRef.current.isInitialized = true;
        if (initialImageId) {
          const success = await moveToWithRetry(viewerRef.current, initialImageId, 2, 300);
          if (!success) {
            console.warn('ViewerContainer: Failed to load initial image:', initialImageId);
            message.innerHTML = 'Failed to load initial image.';
            setTimeout(() => container.removeChild(message), 2000);
            return;
          }
          const image = await viewerRef.current.getImage();
          if (image) {
            await onImage(image);
            await onPosition();
            console.log('ViewerContainer: Initial image loaded', image.id);
          }
        }
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
        container.querySelector('.loading-indicator')?.remove();
      } catch (error) {
        console.error('ViewerContainer: Image event error:', error);
      }
    });

    viewerRef.current.on('position', onPosition);

    viewerRef.current.on('error', (error: any) => {
      console.error('ViewerContainer: Viewer error:', error);
    });

    return () => {
      isMounted.current = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.off('load');
          viewerRef.current.off('image');
          viewerRef.current.off('position');
          viewerRef.current.off('error');
          setTimeout(() => {
            try {
              viewerRef.current?.remove();
              viewerRef.current = null;
              viewerInitialized.current = false;
            } catch (error) {
              console.error('ViewerContainer: Cleanup error:', error);
            }
          }, 1000);
        } catch (error) {
          console.error('ViewerContainer: Cleanup error:', error);
        }
      }
      container.querySelector('.loading-indicator')?.remove();
      container.removeChild(message);
      console.log('ViewerContainer: Cleanup complete');
    };
  }, [mapillaryAccessToken, headerHeight, container, initialImageId, positionMarkerRef, mapRef, viewerRef]);

  return null;
}