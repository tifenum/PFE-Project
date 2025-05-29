import mapboxgl from 'mapbox-gl';
import { fetchMapillaryImages, fetchMapillaryImageDetails } from "@/services/userService";

export const coordinateCache = new Map<string, [number, number]>();

const countryCoordinates = [
  { name: 'USA', coords: [-122.340955, 47.612389], bbox: '-122.36,47.61,-122.34,47.63' },
  { name: 'Brazil', coords: [-46.633309, -23.550520], bbox: '-46.65,-23.57,-46.61,-23.53' },
  { name: 'Japan', coords: [139.691706, 35.689487], bbox: '139.67,35.67,139.71,35.71' },
  { name: 'Australia', coords: [151.209295, -33.868820], bbox: '151.19,-33.88,151.23,-33.85' },
  { name: 'South Africa', coords: [28.047305, -26.204103], bbox: '28.02,-26.22,28.07,-26.18' },
];

export async function fetchImages(bbox: string, limit: number = 2): Promise<any[]> {
  if (!bbox) return [];
  try {
    const data = await fetchMapillaryImages(bbox, limit);
    if (!data || !Array.isArray(data)) {
      console.warn('fetchImages: Invalid API response', data);
      return [];
    }
    return data.map(item => {
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
  } catch (error) {
    console.error('fetchImages: Error fetching images', error);
    return [];
  }
}

export async function getSource(searchBbox?: string): Promise<any> {
  let allFeatures: any[] = [];
  const useBbox = searchBbox ? [searchBbox] : countryCoordinates.map(c => c.bbox);

  for (const bbox of useBbox) {
    const features = await fetchImages(bbox, searchBbox ? 10 : 1);
    if (features.length) {
      allFeatures = allFeatures.concat(features);
    } else {
      const coords = searchBbox
        ? searchBbox.split(',').slice(0, 2).map(Number) as [number, number]
        : countryCoordinates.find(c => c.bbox === bbox)?.coords as [number, number];
      allFeatures.push({
        type: 'Feature',
        properties: { imageId: `fallback-${searchBbox || bbox}`, thumbUrl: '' },
        geometry: {
          type: 'Point',
          coordinates: coords,
        },
      });
    }
  }

  const maxFeatures = searchBbox ? 10 : 100;
  if (allFeatures.length > maxFeatures) {
    allFeatures = allFeatures.slice(0, maxFeatures);
  }

  return {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: allFeatures,
    },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  };
}

export function makeContainers(container: HTMLDivElement, headerHeight: number) {
  let map = container.querySelector('.map-container') as HTMLDivElement | null;
  let viewer = container.querySelector('.viewer') as HTMLDivElement | null;

  if (!map) {
    map = document.createElement('div');
    map.className = 'map-container';
    map.style.position = 'absolute';
    map.style.top = '0';
    map.style.left = '0';
    map.style.width = '100%';
    map.style.height = `calc(100vh - ${headerHeight}px - 60px)`;
    map.style.zIndex = '10';
    container.appendChild(map);
  }

  if (!viewer) {
    const viewerWrapper = document.createElement('div');
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
    viewer = document.createElement('div');
    viewer.className = 'viewer mapillary-interactive';
    viewer.style.width = '100%';
    viewer.style.height = '100%';
    viewerWrapper.appendChild(viewer);
    container.appendChild(viewerWrapper);
  }

  return { map, viewer };
}

export function makeMapboxMarker(options: { radius: number; color: string }, thumbUrl: string): mapboxgl.Marker {
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
  return new mapboxgl.Marker({ element: markerElement, rotationAlignment: 'map' });
}

export function makeMessage(content: string): HTMLDivElement {
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
  return message;
}

export function makeLoadingIndicator(): HTMLDivElement {
  const indicator = document.createElement('div');
  indicator.className = 'loading-indicator';
  indicator.style.position = 'fixed';
  indicator.style.bottom = '20px';
  indicator.style.left = '50%';
  indicator.style.transform = 'translateX(-50%)';
  indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  indicator.style.color = 'white';
  indicator.style.padding = '8px 16px';
  indicator.style.borderRadius = '6px';
  indicator.style.zIndex = '1000';
  indicator.style.fontFamily = 'Arial, sans-serif';
  indicator.innerText = 'Loading image...';
  return indicator;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

export async function moveToWithRetry(viewer: any, imageId: string, retries: number = 3, delay: number = 500, isInitialLoad: boolean = false): Promise<boolean> {
  if (!viewer) {
    console.warn('moveToWithRetry: Viewer is null');
    return false;
  }
  if (viewer.isLoading) {
    viewer.pendingImageId = imageId;
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
        return false;
      }
      if (attempt === maxAttempts) {
        viewer.isLoading = false;
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  viewer.isLoading = false;
  return false;
}