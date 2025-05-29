"use client";
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Viewer, CameraControls } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import './mapillary-custom.css';
import { fetchMapillaryImages, fetchMapillaryImageDetails } from "@/services/userService";

// Sample coordinates for countries (lng, lat)
const countryCoordinates = [
  { name: 'USA', coords: [-122.340955, 47.612389], bbox: '-122.36,47.61,-122.34,47.63' },
  { name: 'Brazil', coords: [-46.633309, -23.550520], bbox: '-46.65,-23.57,-46.61,-23.53' },
  { name: 'Japan', coords: [139.691706, 35.689487], bbox: '139.67,35.67,139.71,35.71' },
  { name: 'Australia', coords: [151.209295, -33.868820], bbox: '151.19,-33.88,151.23,-33.85' },
  { name: 'South Africa', coords: [28.047305, -26.204103], bbox: '28.02,-26.22,28.07,-26.18' },
];

// Coordinate cache
const coordinateCache = new Map<string, [number, number]>();

// Fetch images
async function fetchImages(bbox: string, limit: number = 2): Promise<any[]> {
  try {
    const data = await fetchMapillaryImages(bbox, limit);
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.map(item => {
      const coordinates = (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length === 2)
        ? item.coordinates as [number, number]
        : bbox.split(',').slice(0, 2).map(Number) as [number, number];
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
    return [];
  }
}

// Create GeoJSON source
async function getSource(searchBbox?: string): Promise<any> {
  let allFeatures: any[] = [];
  const useBbox = searchBbox || countryCoordinates.map(c => c.bbox);

  if (searchBbox) {
    const features = await fetchImages(searchBbox, 10);
    allFeatures = features.length ? features : [{
      type: 'Feature',
      properties: { imageId: `fallback-search`, thumbUrl: '' },
      geometry: {
        type: 'Point',
        coordinates: searchBbox.split(',').slice(0, 2).map(Number) as [number, number],
      },
    }];
  } else {
    for (const country of countryCoordinates) {
      const features = await fetchImages(country.bbox, 1);
      if (features.length) {
        allFeatures = allFeatures.concat(features);
      } else {
        allFeatures.push({
          type: 'Feature',
          properties: { imageId: `fallback-${country.name}`, thumbUrl: '' },
          geometry: {
            type: 'Point',
            coordinates: country.coords as [number, number],
          },
        });
      }
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

// Utility functions
function makeContainers(container: HTMLDivElement, headerHeight: number) {
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
    viewer.className = 'viewer';
    viewer.style.width = '100%';
    viewer.style.height = '100%';
    viewerWrapper.appendChild(viewer);
    container.appendChild(viewerWrapper);
  }

  return { map, viewer };
}

function makeMapboxMarker(options: { radius: number; color: string }, thumbUrl: string): mapboxgl.Marker {
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

function makeMessage(content: string): HTMLDivElement {
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

function makeLoadingIndicator(): HTMLDivElement {
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

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

async function moveToWithRetry(viewer: any, imageId: string, retries: number = 3, delay: number = 1000): Promise<boolean> {
  if (viewer.isLoading) {
    viewer.pendingImageId = imageId;
    return false;
  }
  viewer.isLoading = true;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const imageDetails = await fetchMapillaryImageDetails(imageId);
      if (!imageDetails?.id) {
        viewer.isLoading = false;
        return false;
      }
      await viewer.moveTo(imageId);
      viewer.isLoading = true;
      if (viewer.pendingImageId) {
        const nextImageId = viewer.pendingImageId;
        viewer.pendingImageId = null;
        setTimeout(() => moveToWithRetry(viewer, nextImageId, retries, delay), 0);
      }
      return true;
    } catch (error: any) {
      if (error.name === 'CancelMapillaryError' || error.message.includes('Request aborted by a subsequent request')) {
        viewer.isLoading = false;
        if (viewer.pendingImageId) {
          const nextImageId = viewer.pendingImageId;
          viewer.pendingImageId = null;
          setTimeout(() => moveToWithRetry(viewer, nextImageId, retries, delay), 0);
        }
        return false;
      }
      if (attempt === retries) {
        viewer.isLoading = false;
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  return false;
}

// MapContainer Component
interface MapContainerProps {
  mapboxAccessToken: string;
  mapStyle: string;
  headerHeight: number;
  container: HTMLDivElement;
  viewerRef: React.MutableRefObject<any>;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  setSource: (source: any) => void;
}

function MapContainer({ mapboxAccessToken, mapStyle, headerHeight, container, viewerRef, positionMarkerRef, setSource }: MapContainerProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!container || initializedRef.current) return;

    const containers = makeContainers(container, headerHeight);
    initializedRef.current = true;

    async function initializeMap() {
      const initialSource = await getSource();
      setSource(initialSource);
      const validFeature = initialSource.data.features.find((f: any) => !f.properties.imageId.startsWith('fallback-'));
      const initialImageId = validFeature ? validFeature.properties.imageId : null;
      if (!initialImageId) {
        const message = makeMessage('No images available. Please try again later.');
        container.appendChild(message);
        return;
      }

      mapboxgl.accessToken = mapboxAccessToken;
      containers.map.innerHTML = ''; // Clear any existing content
      mapRef.current = new mapboxgl.Map({
        container: containers.map,
        style: mapStyle,
        zoom: 0,
        center: [0, 20],
        renderWorldCopies: false,
      });

      // Add Geolocation control
      mapRef.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      }), 'top-left');

      // Add Geocoder control
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxAccessToken,
        mapboxgl: mapboxgl,
        placeholder: 'Search city, country, or coords (e.g., Tokyo, USA, 12.34,56.78)',
        types: 'place,country',
        clearOnBlur: true,
      });

      mapRef.current.addControl(geocoder, 'top-left');

      // Adjust geocoder position
      setTimeout(() => {
        const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
        if (geocoderEl) {
          (geocoderEl as HTMLElement).style.marginTop = '10px';
        }
      }, 0);

      // Initialize position marker
      positionMarkerRef.current = makeMapboxMarker(
        { radius: 8, color: '#f0f' },
        validFeature ? validFeature.properties.thumbUrl : ''
      );

      // Handle geocoder search
      geocoder.on('result', async (e: any) => {
        if (!mapRef.current) return;

        const { place_type, context, bbox, center } = e.result;
        let countryBbox: string | undefined;
        let countryCenter: [number, number] | undefined;

        if (place_type.includes('country')) {
          const country = countryCoordinates.find(c => c.name.toLowerCase() === e.result.text.toLowerCase());
          if (country) {
            countryBbox = country.bbox;
            countryCenter = country.coords as [number, number];
          }
        } else {
          const countryContext = context.find((ctx: any) => ctx.id.startsWith('country'));
          if (countryContext) {
            const country = countryCoordinates.find(c => c.name.toLowerCase() === countryContext.text.toLowerCase());
            if (country) {
              countryBbox = country.bbox;
              countryCenter = country.coords as [number, number];
            }
          }
        }

        if (!countryBbox) {
          if (bbox && bbox.length === 4) {
            countryBbox = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
          } else {
            const lng = center[0];
            const lat = center[1];
            countryBbox = `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`;
          }
          countryCenter = center as [number, number];
        } else {
          const [minLng, minLat, maxLng, maxLat] = countryBbox.split(',').map(Number);
          countryCenter = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
        }

        const newSource = await getSource(countryBbox);
        setSource(newSource);
        (mapRef.current.getSource('images') as mapboxgl.GeoJSONSource).setData(newSource.data);
        mapRef.current.easeTo({
          center: countryCenter,
          zoom: 5,
        });

        if (newSource.data.features.length && !newSource.data.features[0].properties.imageId.startsWith('fallback-')) {
          const indicator = makeLoadingIndicator();
          container.appendChild(indicator);
          await moveToWithRetry(viewerRef.current, newSource.data.features[0].properties.imageId);
        } else {
          alert('No images found for this country. Showing fallback marker.');
        }
      });

      geocoder.on('error', () => {
        alert('Search failed. Please try a valid city, country, or coordinates.');
      });

      mapRef.current.on('load', () => {
        mapRef.current!.addSource('images', initialSource);

        mapRef.current!.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'images',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              100,
              '#f1f075',
              750,
              '#f28cb1'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              100,
              30,
              750,
              40
            ]
          }
        });

        mapRef.current!.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'images',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        });

        mapRef.current!.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'images',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 12,
            'circle-opacity': 0.5,
            'circle-color': '#05CB63',
            'circle-stroke-color': '#05cb63',
            'circle-stroke-width': 2,
          }
        });

        initialSource.data.features.forEach((feature: any) => {
          const { imageId, thumbUrl } = feature.properties;
          const marker = makeMapboxMarker({ radius: 15, color: '#05CB63' }, thumbUrl);
          marker.setLngLat(feature.geometry.coordinates).addTo(mapRef.current!);
          marker.getElement().addEventListener('click', () => {
            if (imageId.startsWith('fallback-')) {
              alert('This is a fallback marker. No images available for this location.');
              return;
            }
            const indicator = makeLoadingIndicator();
            container.appendChild(indicator);
            moveToWithRetry(viewerRef.current, imageId);
          });
        });

        mapRef.current!.on('click', debounce(async (event: mapboxgl.MapMouseEvent) => {
          try {
            const features = mapRef.current!.queryRenderedFeatures(event.point, { layers: ['clusters', 'unclustered-point'] });
            if (!features.length) return;
            const closest = features[0];
            const { imageId } = closest.properties;
            if (imageId && imageId.startsWith('fallback-')) {
              alert('This is a fallback marker. No images available for this location.');
              return;
            }
            if (imageId) {
              const indicator = makeLoadingIndicator();
              container.appendChild(indicator);
              await moveToWithRetry(viewerRef.current, imageId);
            }
          } catch (error) {
            const indicator = container.querySelector('.loading-indicator');
            if (indicator) {
              container.removeChild(indicator);
            }
          }
        }, 300));

        mapRef.current!.on('click', 'clusters', (e: mapboxgl.MapMouseEvent) => {
          const features = mapRef.current!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0].properties.cluster_id;
          (mapRef.current!.getSource('images') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            mapRef.current!.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom
            });
          });
        });

        mapRef.current!.on('mouseenter', 'clusters', () => {
          mapRef.current!.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current!.on('mouseleave', 'clusters', () => {
          mapRef.current!.getCanvas().style.cursor = '';
        });
      });
    }

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [mapboxAccessToken, mapStyle, headerHeight, container, viewerRef, positionMarkerRef, setSource]);

  return null;
}

// ViewerContainer Component
interface ViewerContainerProps {
  mapillaryAccessToken: string;
  headerHeight: number;
  container: HTMLDivElement;
  initialImageId: string | null;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}

function ViewerContainer({ mapillaryAccessToken, headerHeight, container, initialImageId, positionMarkerRef, mapRef }: ViewerContainerProps) {
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!container || !initialImageId) return;

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

    viewerRef.current = new Viewer(viewerOptions);
    viewerRef.current.isInitialized = false;
    viewerRef.current.isLoading = false;
    viewerRef.current.pendingImageId = null;

    const message = makeMessage('Loading Mapillary Viewer...');
    container.appendChild(message);

    const onImage = async (image: any) => {
      let lngLat: [number, number] | undefined;

      if (image?.lngLat && typeof image.lngLat.lng === 'number' && typeof image.lngLat.lat === 'number') {
        lngLat = [image.lngLat.lng, image.lngLat.lat];
        coordinateCache.set(image.id, lngLat);
      } else if (
        image?.computed_geometry?.coordinates &&
        Array.isArray(image.computed_geometry.coordinates) &&
        image.computed_geometry.coordinates.length === 2 &&
        typeof image.computed_geometry.coordinates[0] === 'number' &&
        typeof image.computed_geometry.coordinates[1] === 'number'
      ) {
        lngLat = image.computed_geometry.coordinates as [number, number];
        coordinateCache.set(image.id, lngLat);
      } else if (coordinateCache.has(image.id)) {
        lngLat = coordinateCache.get(image.id);
      } else {
        try {
          const imageDetails = await fetchMapillaryImageDetails(image.id);
          if (
            imageDetails?.coordinates &&
            Array.isArray(imageDetails.coordinates) &&
            imageDetails.coordinates.length === 2 &&
            typeof imageDetails.coordinates[0] === 'number' &&
            typeof imageDetails.coordinates[1] === 'number'
          ) {
            lngLat = imageDetails.coordinates as [number, number];
            coordinateCache.set(image.id, lngLat);
          } else {
            return;
          }
        } catch (error) {
          return;
        }
      }

      if (!lngLat || !Array.isArray(lngLat) || lngLat.length !== 2 || isNaN(lngLat[0]) || isNaN(lngLat[1])) {
        return;
      }

      try {
        if (!mapRef.current!.getBounds().contains(lngLat)) {
          mapRef.current!.setCenter(lngLat);
        }
        if (positionMarkerRef.current) {
          if (!positionMarkerRef.current._map) {
            positionMarkerRef.current.addTo(mapRef.current!);
          }
          positionMarkerRef.current.setLngLat(lngLat);
        }
      } catch (error) {}
    };

    const onPosition = async () => {
      try {
        const position = await viewerRef.current.getPosition();
        if (!position || typeof position.lng !== 'number' || typeof position.lat !== 'number') {
          return;
        }
        const pos: [number, number] = [Number(position.lng), Number(position.lat)];
        if (positionMarkerRef.current) {
          if (!positionMarkerRef.current._map) {
            positionMarkerRef.current.addTo(mapRef.current!);
          }
          positionMarkerRef.current.setLngLat(pos);
        }
      } catch (error) {
        console.log('Issue in onPosition:', (error as Error).message);
      }
    };

    let loadTimeout = setTimeout(() => {
      if (!viewerRef.current.isInitialized) {
        message.innerHTML = 'Failed to load viewer. Please refresh.';
      }
    }, 15000);

    viewerRef.current.on('load', async () => {
      clearTimeout(loadTimeout);
      try {
        viewerRef.current.isInitialized = true;
        await moveToWithRetry(viewerRef.current, initialImageId!);
        const image = await viewerRef.current.getImage();
        if (image) {
          await onImage(image);
          await onPosition();
          if (positionMarkerRef.current && !positionMarkerRef.current._map) {
            positionMarkerRef.current.addTo(mapRef.current!);
          }
        } else {
          message.innerHTML = 'Failed to load initial image. Please try again.';
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
        message.innerHTML = 'Error loading viewer. Please refresh.';
        setTimeout(() => {
          if (container.contains(message)) {
            container.removeChild(message);
          }
        }, 2000);
      }
    });

    viewerRef.current.on('image', (event: any) => {
      onImage(event.image);
      const indicator = container.querySelector('.loading-indicator');
      if (indicator) {
        container.removeChild(indicator);
      }
    });

    viewerRef.current.on('position', onPosition);

    viewerRef.current.on('error', (error: any) => {
      console.log('Viewer issue:', error.message);
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
  }, [mapillaryAccessToken, headerHeight, container, initialImageId, positionMarkerRef, mapRef]);

  return null;
}

// Main MapillaryViewer Component
interface MapillaryViewerProps {
  mapillaryAccessToken: string;
  mapboxAccessToken: string;
  headerHeight?: number;
}

function MapillaryViewer({ mapillaryAccessToken, mapboxAccessToken, headerHeight = 80 }: MapillaryViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const positionMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [viewMode, setViewMode] = useState<string>('default');
  const [source, setSource] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');
  const [actualHeaderHeight, setActualHeaderHeight] = useState(headerHeight);
  const [initialImageId, setInitialImageId] = useState<string | null>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        const height = header.offsetHeight;
        setActualHeaderHeight(height);
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

  useEffect(() => {
    if (!containerRef.current) return;

    async function fetchInitialSource() {
      const initialSource = await getSource();
      setSource(initialSource);
      const validFeature = initialSource.data.features.find((f: any) => !f.properties.imageId.startsWith('fallback-'));
      setInitialImageId(validFeature ? validFeature.properties.imageId : null);
    }

    fetchInitialSource();
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

  useEffect(() => {
    const viewerWrapper = containerRef.current?.querySelector('.viewer-wrapper') as HTMLDivElement | null;
    const viewerContainer = containerRef.current?.querySelector('.viewer') as HTMLDivElement | null;
    const mapContainer = containerRef.current?.querySelector('.map-container') as HTMLDivElement | null;
    if (!viewerWrapper || !viewerContainer || !mapContainer) return;

    viewerWrapper.style.transition = 'transform 0.2s ease';
    viewerContainer.style.transition = 'none';
    mapContainer.style.transition = 'none';
    mapContainer.style.zIndex = '10'; // Ensure single map layer

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
        mapContainer.style.width = '100%';
        mapContainer.style.height = `calc(100vh - ${actualHeaderHeight}px - 60px)`;
        mapContainer.style.zIndex = '10';
        break;
      case 'map':
        viewerWrapper.style.display = 'none';
        mapContainer.style.display = 'block';
        mapContainer.style.width = '100%';
        mapContainer.style.height = `calc(100vh - ${actualHeaderHeight}px - 60px)`;
        mapContainer.style.zIndex = '10';
        break;
      case 'viewer':
        viewerWrapper.style.display = 'block';
        viewerWrapper.style.width = '100%';
        viewerWrapper.style.height = `calc(100vh - ${actualHeaderHeight}px - 60px)`;
        viewerWrapper.style.bottom = '60px';
        viewerWrapper.style.left = '0';
        viewerWrapper.style.zIndex = '100';
        viewerWrapper.style.transform = 'scale(1)';
        mapContainer.style.display = 'none';
        break;
      case 'swapped':
        viewerWrapper.style.display = 'block';
        viewerWrapper.style.width = '100%';
        viewerWrapper.style.height = `calc(100vh - ${actualHeaderHeight}px - 60px)`;
        viewerWrapper.style.bottom = '60px';
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
        viewerWrapper.style.width = viewMode === 'default' ? '200px' : '100%';
        viewerWrapper.style.height = viewMode === 'default' ? '150px' : `calc(100vh - ${actualHeaderHeight}px - 60px)`;
        mapContainer.style.width = viewMode === 'swapped' ? '200px' : '100%';
        mapContainer.style.height = viewMode === 'swapped' ? '150px' : `calc(100vh - ${actualHeaderHeight}px - 60px)`;
      } else if (viewMode === 'default' || viewMode === 'swapped') {
        viewerWrapper.style.width = viewMode === 'default' ? '350px' : '100%';
        viewerWrapper.style.height = viewMode === 'default' ? '200px' : `calc(100vh - ${actualHeaderHeight}px - 60px)`;
        mapContainer.style.width = viewMode === 'swapped' ? '350px' : '100%';
        mapContainer.style.height = viewMode === 'swapped' ? '200px' : `calc(100vh - ${actualHeaderHeight}px - 60px)`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      viewerWrapper.removeEventListener('mouseenter', handleHover);
      viewerWrapper.removeEventListener('mouseleave', handleHoverOut);
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, actualHeaderHeight]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: `calc(100vh - ${actualHeaderHeight}px)`,
        backgroundColor: '#f5f5f5',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        margin: '10px auto',
        maxWidth: 'calc(100% - 20px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <MapContainer
          mapboxAccessToken={mapboxAccessToken}
          mapStyle={mapStyle}
          headerHeight={actualHeaderHeight}
          container={containerRef.current!}
          viewerRef={viewerRef}
          positionMarkerRef={positionMarkerRef}
          setSource={setSource}
        />
        {initialImageId && (
          <ViewerContainer
            mapillaryAccessToken={mapillaryAccessToken}
            headerHeight={actualHeaderHeight}
            container={containerRef.current!}
            initialImageId={initialImageId}
            positionMarkerRef={positionMarkerRef}
            mapRef={mapRef}
          />
        )}
      </div>
      {(viewMode === 'default' || viewMode === 'swapped') && (
        <button
          onClick={toggleView}
          style={{
            position: 'absolute',
            top: '25px',
            right: '25px',
            zIndex: '1010',
            padding: '6px 12px',
            backgroundColor: '#05CB63',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ↔
        </button>
      )}
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: '1000',
          display: 'flex',
          gap: '10px',
          backgroundColor: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <button
          onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v11')}
          style={{
            padding: '8px 16px',
            backgroundColor: mapStyle === 'mapbox://styles/mapbox/streets-v11' ? '#05CB63' : '#e0e0e0',
            color: mapStyle === 'mapbox://styles/mapbox/streets-v11' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
          }}
        >
          Streets
        </button>
        <button
          onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-v9')}
          style={{
            padding: '8px 16px',
            backgroundColor: mapStyle === 'mapbox://styles/mapbox/satellite-v9' ? '#05CB63' : '#e0e0e0',
            color: mapStyle === 'mapbox://styles/mapbox/satellite-v9' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
          }}
        >
          Satellite
        </button>
      </div>
    </div>
  );
}

export default MapillaryViewer;