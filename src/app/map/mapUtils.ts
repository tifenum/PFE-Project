import mapboxgl from 'mapbox-gl';
import { fetchMapillaryImages, fetchMapillaryImageDetails } from "@/services/userService";
import countryCoordinates from './countryCoordinates';

export const coordinateCache = new Map<string, [number, number]>();
const fetchCache = new Map<string, any[]>();

export async function fetchImages(bbox: string, limit: number = 2): Promise<any[]> {
  const startTime = performance.now();
  console.log('fetchImages: Starting for bbox', bbox, 'limit', limit);
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
        properties: {
          imageId: item.id,
          thumbUrl: item.thumbUrl || '',
          sequenceKey: item.sequenceKey || '',
          sourceType: 'search',
        },
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
// Rest of the file remains unchanged
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

    const imageId = searchBbox ? `fallback-${bbox}` : countryData?.image_id;

    if (!imageId) {
      console.warn(`getSource: Missing image_id for index ${i}`, { country: countryData?.name });
      continue;
    }

    allFeatures.push({
      type: 'Feature',
      properties: {
        imageId: imageId,
        thumbUrl: '',
        sequence: countryData?.sequence_key || '',
        countryName: countryData?.name || 'Unknown',
        sourceType: 'initial', // Add sourceType property
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
    clusterMaxZoom: 12,
    clusterRadius: 30,
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
    viewer.className = 'viewer mapillary-interactive';
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

export function makeErrorMessage(content: string): HTMLDivElement {
  const startTime = performance.now();
  console.time('makeErrorMessage');

  const message = document.createElement('div');
  message.className = 'error-message';
  message.style.position = 'absolute';
  message.style.top = '50%';
  message.style.left = '50%';
  message.style.transform = 'translate(-50%, -50%)';
  message.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
  message.style.color = 'white';
  message.style.padding = '10px 20px';
  message.style.borderRadius = '8px';
  message.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  message.style.zIndex = '1000';
  message.style.fontFamily = 'Arial, sans-serif';
  message.style.fontSize = '14px';
  message.innerHTML = content;

  console.timeEnd('makeErrorMessage');
  console.log(`makeErrorMessage took ${(performance.now() - startTime).toFixed(2)} ms`);
  return message;
}

export function makeSpinnerLoader(): HTMLDivElement {
  const startTime = performance.now();
  console.time('makeSpinnerLoader');

  const loader = document.createElement('div');
  loader.className = 'spinner-loader';
  loader.style.position = 'absolute';
  loader.style.top = '50%';
  loader.style.left = '50%';
  loader.style.transform = 'translate(-50%, -50%)';
  loader.style.width = '40px';
  loader.style.height = '40px';
  loader.style.border = '4px solid rgba(255, 255, 255, 0.3)';
  loader.style.borderTop = '4px solid #05CB63';
  loader.style.borderRadius = '50%';
  loader.style.animation = 'spin 1s linear infinite';
  loader.style.zIndex = '1000';
  loader.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  loader.style.padding = '8px';
  loader.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';

  // Inject CSS keyframes for spinning animation
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  console.timeEnd('makeSpinnerLoader');
  console.log(`makeSpinnerLoader took ${(performance.now() - startTime).toFixed(2)} ms`);
  return loader;
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

export async function moveToWithRetry(
  viewer: any,
  imageId: string,
  retries: number = 3,
  delay: number = 500,
  isInitialLoad: boolean = false,
  viewerWrapper?: HTMLDivElement | null
): Promise<{ success: boolean; error?: string; fallbackImageId?: string }> {
  const startTime = performance.now();
  console.time(`moveToWithRetry-${imageId}`);

  if (!viewer) {
    console.warn('moveToWithRetry: Viewer is null');
    console.timeEnd(`moveToWithRetry-${imageId}`);
    console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (viewer null)`);
    viewerWrapper?.querySelector('.spinner-loader')?.remove();
    return { success: false, error: 'Viewer is null' };
  }
  if (viewer.isLoading) {
    viewer.pendingImageId = imageId;
    console.timeEnd(`moveToWithRetry-${imageId}`);
    console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (viewer loading)`);
    viewerWrapper?.querySelector('.spinner-loader')?.remove();
    return { success: false, error: 'Viewer is already loading' };
  }
  viewer.isLoading = true;
  viewer.pendingImageId = null;

  const maxAttempts = isInitialLoad ? 1 : retries;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (!viewer.isNavigable) {
      console.log('moveToWithRetry: Viewer not navigable, waiting...');
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    try {
      await viewer.moveTo(imageId);
      viewer.isLoading = false;
      console.timeEnd(`moveToWithRetry-${imageId}`);
      console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms`);
      return { success: true };
    } catch (error: any) {
      if (
        error.name === 'CancelMapillaryError' ||
        error.message.includes('Request aborted by a subsequent request')
      ) {
        viewer.isLoading = false;
        viewerWrapper?.querySelector('.spinner-loader')?.remove();
        if (viewer.pendingImageId) {
          const nextImageId = viewer.pendingImageId;
          viewer.pendingImageId = null;
          setTimeout(() => moveToWithRetry(viewer, nextImageId, retries, delay, false, viewerWrapper), 0);
        }
        console.timeEnd(`moveToWithRetry-${imageId}`);
        console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (cancelled)`);
        return { success: false, error: 'Request cancelled' };
      }
      if (
        error.message.includes('Failed to fetch data') ||
        error.message.includes('Context Lost') ||
        error.message.includes('Incorrect mesh URL')
      ) {
        viewer.isLoading = false;
        viewerWrapper?.querySelector('.spinner-loader')?.remove();
        console.timeEnd(`moveToWithRetry-${imageId}`);
        console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (fetch or context error)`);
        const fallback = countryCoordinates.find(
          c => c.image_id !== imageId && coordinateCache.has(c.image_id)
        )?.image_id;
        return { success: false, error: error.message, fallbackImageId: fallback };
      }
      if (attempt === maxAttempts) {
        viewer.isLoading = false;
        viewerWrapper?.querySelector('.spinner-loader')?.remove();
        console.timeEnd(`moveToWithRetry-${imageId}`);
        console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (max attempts reached)`);
        return { success: false, error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  viewer.isLoading = false;
  viewerWrapper?.querySelector('.spinner-loader')?.remove();
  console.timeEnd(`moveToWithRetry-${imageId}`);
  console.log(`moveToWithRetry for imageId ${imageId} took ${(performance.now() - startTime).toFixed(2)} ms (failed after retries)`);
  return { success: false, error: 'Unknown error after retries' };
}

// Add to mapUtils.ts
export function calculateBboxFromRadius(center: [number, number], radiusKm: number): string {
  const earthRadius = 6378.1; // Earth's radius in km
  const lat = center[1];
  const lon = center[0];

  // Convert radius to degrees
  const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);
  const lonDelta = (radiusKm / (earthRadius * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);

  const minLon = lon - lonDelta;
  const maxLon = lon + lonDelta;
  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;

  return `${minLon},${minLat},${maxLon},${maxLat}`;
}
