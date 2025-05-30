import mapboxgl from 'mapbox-gl';
import { fetchMapillaryImages, fetchMapillaryImageDetails } from "@/services/userService";
import countryCoordinates from './countryCoordinates';

export const coordinateCache = new Map<string, [number, number]>();
const fetchCache = new Map<string, any[]>();

export async function fetchImages(bbox: string, limit: number = 2): Promise<any[]> {
  const startTime = performance.now();
  console.log('fetchImages: Starting for bbox', bbox);
  if (fetchCache.has(bbox)) {
    console.log('fetchImages: Returning cached features for bbox', bbox);
    return fetchCache.get(bbox)!;
  }
  if (!bbox) {
    console.log('fetchImages: No bbox provided, returning empty');
    return [];
  }
  try {
    const data = await fetchMapillaryImages(bbox, limit);
    if (!data || !Array.isArray(data)) {
      console.log('fetchImages: No valid data returned');
      return [];
    }
    const features = data.map(item => {
      const coordinates = (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length === 2)
        ? item.coordinates as [number, number]
        : bbox.split(',').slice(0, 2).map(Number) as [number, number];
      coordinateCache.set(item.id, coordinates);
      return {
        type: 'Feature',
        properties: { imageId: item.id, thumbUrl: item.thumbUrl || '' },
        geometry: {
          type: 'Point',
          coordinates,
        },
      };
    });
    fetchCache.set(bbox, features);
    console.log(`fetchImages: Fetched ${features.length} features in ${(performance.now() - startTime).toFixed(2)} ms`);
    return features;
  } catch (error) {
    console.error('fetchImages: Error', error);
    return [];
  }
}

export async function getSource(searchBbox?: string): Promise<any> {
  const globalStartTime = performance.now();
  console.time('getSource');

  let allFeatures: any[] = [];
  const useBbox = searchBbox ? [searchBbox] : countryCoordinates.map(c => c.bbox);

  for (let i = 0; i < useBbox.length; i++) {
    const bbox = useBbox[i];
    const countryData = searchBbox ? null : countryCoordinates[i];
    
    if (!countryData && !searchBbox) {
      console.warn(`getSource: No country data for index ${i}, skipping`);
      continue;
    }

    const coords = searchBbox
      ? searchBbox.split(',').slice(0, 2).map(Number) as [number, number]
      : countryData?.coords as [number, number];

    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) {
      console.warn(`getSource: Invalid coordinates for index ${i}`, { coords, country: countryData?.name });
      continue;
    }

    const imageId = searchBbox
      ? `fallback-${bbox}`
      : countryData?.image_id;

    if (!imageId) {
      console.warn(`getSource: Missing image_id for index ${i}`, { country: countryData?.name });
      continue;
    }

    allFeatures.push({
      type: 'Feature',
      properties: {
        imageId: imageId,
        thumbUrl: '',
        countryName: countryData?.name || 'Unknown',
      },
      geometry: {
        type: 'Point',
        coordinates: coords,
      },
    });
  }

  console.log(`getSource: Generated ${allFeatures.length} features`);

  const result = {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: allFeatures,
    },
    cluster: false,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  };

  console.timeEnd('getSource');
  console.log(`getSource total time: ${(performance.now() - globalStartTime).toFixed(2)} ms`);
  return result;
}

export function makeContainers(container: HTMLDivElement, headerHeight: number) {
  const startTime = performance.now();
  console.time('makeContainers');

  let map = container.querySelector('.map-container') as HTMLDivElement | null;
  if (!map) {
    map = document.createElement('div');
    map.className = 'map-container';
    map.style.position = 'absolute';
    map.style.top = '0';
    map.style.left = '0';
    map.style.width = '100vw';
    map.style.height = `calc(100vh - ${headerHeight}px)`;
    map.style.zIndex = '10';
    container.appendChild(map);
    console.log('makeContainers: Created map container');
  }

  let viewerWrapper = container.querySelector('.viewer-wrapper') as HTMLDivElement | null;
  if (!viewerWrapper) {
    viewerWrapper = document.createElement('div');
    viewerWrapper.className = 'viewer-wrapper';
    viewerWrapper.style.position = 'absolute';
    viewerWrapper.style.bottom = '20px';
    viewerWrapper.style.left = '20px';
    viewerWrapper.style.width = '350px';
    viewerWrapper.style.height = '200px';
    viewerWrapper.style.zIndex = '100';
    viewerWrapper.style.borderRadius = '8px';
    viewerWrapper.style.overflow = 'hidden';
    viewerWrapper.style.background = '#fff';
    viewerWrapper.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    container.appendChild(viewerWrapper);
    console.log('makeContainers: Created viewer wrapper');
  }

  let viewer = viewerWrapper.querySelector('.viewer') as HTMLDivElement | null;
  if (!viewer) {
    viewer = document.createElement('div');
    viewer.className = 'viewer mapillary-interactive物の';
    viewer.style.width = '100%';
    viewer.style.height = '100%';
    viewerWrapper.appendChild(viewer);
    console.log('makeContainers: Created viewer container');
  }

  console.log('makeContainers: Final sizes', {
    map: { width: map.offsetWidth, height: map.offsetHeight },
    viewer: { width: viewer.offsetWidth, height: viewer.offsetHeight }
  });
  console.timeEnd('makeContainers');
  console.log(`makeContainers took ${(performance.now() - startTime).toFixed(2)} ms`);
  return { map, viewer, viewerWrapper };
}

export function makeMapboxMarker(options: { radius: number; color: string }, thumbUrl: string): mapboxgl.Marker {
  const startTime = performance.now();
  console.time('makeMapboxMarker');

  const size = `${2 * options.radius}px`;
  const markerElement = document.createElement('div');
  markerElement.style.width = size;
  markerElement.style.height = size;
  markerElement.style.borderRadius = '50%';
  markerElement.style.backgroundImage = thumbUrl ? `url(${thumbUrl})` : 'none';
  markerElement.style.backgroundColor = thumbUrl ? 'white' : 'rgba(255, 255, 255, 0.6)';
  markerElement.style.backgroundSize = 'cover';
  markerElement.style.border = `2px solid ${options.color}`;
  markerElement.style.cursor = 'pointer';
  const marker = new mapboxgl.Marker({ element: markerElement, rotationAlignment: 'map' });

  console.timeEnd('makeMapboxMarker');
  console.log(`makeMapboxMarker took ${(performance.now() - startTime).toFixed(2)} ms`);
  return marker;
}

export function makeMessage(content: string): HTMLDivElement {
  const startTime = performance.now();
  console.time('makeMessage');

  const message = document.createElement('div');
  message.style.position = 'absolute';
  message.style.top = '50%';
  message.style.left = '50%';
  message.style.transform = 'translate(-50%, -50%)';
  message.style.backgroundColor = 'white';
  message.style.padding = '10px';
  message.style.borderRadius = '8px';
  message.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  message.style.zIndex = '1000';
  message.style.fontFamily = 'Arial, sans-serif';
  message.innerHTML = content;

  console.timeEnd('makeMessage');
  console.log(`makeMessage took ${(performance.now() - startTime).toFixed(2)} ms`);
  return message;
}

export function makeLoadingIndicator(): HTMLDivElement {
  const startTime = performance.now();
  console.time('makeLoadingIndicator');

  const indicator = document.createElement('div');
  indicator.className = 'loading-indicator';
  indicator.style.position = 'absolute';
  indicator.style.top = '50%';
  indicator.style.left = '50%';
  indicator.style.transform = 'translate(-50%, -50%)';
  indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  indicator.style.color = 'white';
  indicator.style.padding = '8px 16px';
  indicator.style.borderRadius = '6px';
  indicator.style.zIndex = '1000';
  indicator.style.fontFamily = 'Arial, sans-serif';
  indicator.innerText = 'Loading image...';

  console.timeEnd('makeLoadingIndicator');
  console.log(`makeLoadingIndicator took ${(performance.now() - startTime).toFixed(2)} ms`);
  return indicator;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): (...args: Parameters<T>) => void {
  const startTime = performance.now();
  console.time('debounce');

  let timeoutId: NodeJS.Timeout | undefined;
  const debouncedFn = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };

  console.timeEnd('debounce');
  console.log(`debounce took ${(performance.now() - startTime).toFixed(2)} ms`);
  return debouncedFn;
}

export async function moveToWithRetry(viewer: any, imageId: string, retries: number = 3, delay: number = 500, isInitialLoad: boolean = false): Promise<boolean> {
  const startTime = performance.now();
  console.time(`moveToWithRetry-${imageId}`);

  if (!viewer) {
    console.warn('moveToWithRetry: Viewer is null');
    console.timeEnd(`moveToWithRetry-${imageId}`);
    console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (viewer null)`);
    return false;
  }
  if (viewer.isLoading) {
    viewer.pendingImageId = imageId;
    console.timeEnd(`moveToWithRetry-${imageId}`);
    console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (viewer loading)`);
    return false;
  }
  viewer.isLoading = true;

  const maxAttempts = isInitialLoad ? 1 : retries;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!coordinateCache.has(imageId)) {
        const imageDetails = await fetchMapillaryImageDetails(imageId);
        if (!imageDetails?.id) {
          viewer.isLoading = false;
          console.timeEnd(`moveToWithRetry-${imageId}`);
          console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (no image details)`);
          return false;
        }
        if (imageDetails.coordinates && Array.isArray(imageDetails.coordinates) && imageDetails.coordinates.length === 2) {
          coordinateCache.set(imageId, imageDetails.coordinates as [number, number]);
        }
      }
      await viewer.moveTo(imageId);
      viewer.isLoading = false;
      if (viewer.pendingImageId) {
        const nextImageId = viewer.pendingImageId;
        viewer.pendingImageId = null;
        setTimeout(() => moveToWithRetry(viewer, nextImageId, retries, delay), 0);
      }
      console.timeEnd(`moveToWithRetry-${imageId}`);
      console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms`);
      return true;
    } catch (error: any) {
      console.error('moveToWithRetry: Error on attempt', attempt, error);
      if (error.name === 'CancelMapillaryError' || error.message.includes('Request aborted by a subsequent request')) {
        viewer.isLoading = false;
        if (viewer.pendingImageId) {
          const nextImageId = viewer.pendingImageId;
          viewer.pendingImageId = null;
          setTimeout(() => moveToWithRetry(viewer, nextImageId, retries, delay), 0);
        }
        console.timeEnd(`moveToWithRetry-${imageId}`);
        console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (cancelled)`);
        return false;
      }
      if (attempt === maxAttempts) {
        viewer.isLoading = false;
        console.timeEnd(`moveToWithRetry-${imageId}`);
        console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (max attempts reached)`);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  viewer.isLoading = false;
  console.timeEnd(`moveToWithRetry-${imageId}`);
  console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (failed after retries)`);
  return false;
}