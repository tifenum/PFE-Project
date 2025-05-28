"use client";
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Viewer, CameraControls } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import './mapillary-custom.css';
import { fetchMapillaryImages, fetchMapillaryImageDetails } from "@/services/userService";

// Sample coordinates for countries (lng, lat) - limited for faster loading
const countryCoordinates = [
  { name: 'USA', coords: [-122.340955, 47.612389], bbox: '-122.36,47.61,-122.34,47.63' },
  { name: 'Brazil', coords: [-46.633309, -23.550520], bbox: '-46.65,-23.57,-46.61,-23.53' },
  { name: 'Japan', coords: [139.691706, 35.689487], bbox: '139.67,35.67,139.71,35.71' },
  { name: 'Australia', coords: [151.209295, -33.868820], bbox: '151.19,-33.88,151.23,-33.85' },
  { name: 'South Africa', coords: [28.047305, -26.204103], bbox: '28.02,-26.22,28.07,-26.18' },
];

// Coordinate cache to reduce API calls
const coordinateCache = new Map();

// Fetch images using the service endpoint
async function fetchImages(bbox, limit = 2) {
  try {
    const data = await fetchMapillaryImages(bbox, limit);
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.map(item => {
      const coordinates = (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length === 2)
        ? item.coordinates
        : bbox.split(',').slice(0, 2).map(Number); // Fallback to bbox center
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

// Create dynamic GeoJSON source with global or searched coverage
async function getSource(searchBbox = undefined) {
  let allFeatures = [];
  const useBbox = searchBbox || countryCoordinates.map(c => c.bbox);

  if (searchBbox) {
    const features = await fetchImages(searchBbox, 10);
    allFeatures = features.length ? features : [{
      type: 'Feature',
      properties: { imageId: `fallback-search`, thumbUrl: '' },
      geometry: {
        type: 'Point',
        coordinates: searchBbox.split(',').slice(0, 2).map(Number),
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
            coordinates: country.coords,
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
function makeMapboxMarker(options, thumbUrl) {
  const size = `${2 * options.radius}px`;
  const markerElement = document.createElement('div');
  markerElement.style.width = size;
  markerElement.style.height = size;
  markerElement.style.borderRadius = '50%';
  markerElement.style.backgroundImage = thumbUrl ? `url(${thumbUrl})` : 'none';
  markerElement.style.backgroundColor = thumbUrl ? 'transparent' : 'rgba(255, 255, 255, 0.6)';
  markerElement.style.backgroundSize = 'cover';
  markerElement.style.border = `2px solid ${options.color}`;
  markerElement.style.cursor = 'pointer';
  return new mapboxgl.Marker({ element: markerElement, rotationAlignment: 'map' });
}

function makeMessage(content) {
  const message = document.createElement('div');
  message.style.position = 'absolute';
  message.style.top = '50%';
  message.style.left = '50%';
  message.style.transform = 'translate(-50%, -50%)';
  message.style.backgroundColor = '#fff';
  message.style.padding = '10px 20px';
  message.style.borderRadius = '5px';
  message.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  message.style.zIndex = '1000';
  message.innerHTML = content;
  return message;
}

function makeLoadingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'loading-indicator';
  indicator.style.position = 'absolute';
  indicator.style.bottom = '10px';
  indicator.style.left = '50%';
  indicator.style.transform = 'translateX(-50%)';
  indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  indicator.style.color = '#fff';
  indicator.style.padding = '5px 10px';
  indicator.style.borderRadius = '4px';
  indicator.style.zIndex = '1000';
  indicator.innerText = 'Loading image...';
  return indicator;
}

function makeContainers(container, headerHeight) {
  const height = `calc(100vh - ${headerHeight}px)`;
  const viewerContainer = document.createElement('div');
  viewerContainer.className = 'viewer';
  viewerContainer.style.position = 'absolute';
  viewerContainer.style.bottom = '20px';
  viewerContainer.style.left = '20px';
  viewerContainer.style.width = '350px'; // Bigger viewer box, man
  viewerContainer.style.height = '250px'; // Little bit taller
  viewerContainer.style.border = '2px solid #fff';
  viewerContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  viewerContainer.style.zIndex = '100';
  viewerContainer.style.backgroundColor = '#000';

  const mapContainer = document.createElement('div');
  mapContainer.className = 'map';
  mapContainer.style.position = 'absolute';
  mapContainer.style.top = `${headerHeight}px`;
  mapContainer.style.left = '0';
  mapContainer.style.width = '100vw';
  mapContainer.style.height = height; // Respects header, ready for footer
  mapContainer.style.zIndex = '10';

  container.appendChild(mapContainer);
  container.appendChild(viewerContainer);
  return { viewer: viewerContainer, map: mapContainer };
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

async function moveToWithRetry(viewer, imageId, retries = 3, delay = 1000) {
  if (viewer.isLoading) {
    viewer.pendingImageId = imageId;
    return false;
  }
  viewer.isLoading = true;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const imageDetails = await fetchMapillaryImageDetails(imageId);
      if (!imageDetails || !imageDetails.id) {
        viewer.isLoading = false;
        return false;
      }
      await viewer.moveTo(imageId);
      viewer.isLoading = false;
      if (viewer.pendingImageId) {
        const nextImageId = viewer.pendingImageId;
        viewer.pendingImageId = null;
        setTimeout(() => moveToWithRetry(viewer, nextImageId, retries, delay), 0);
      }
      return true;
    } catch (error) {
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
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1))); // Exponential backoff
    }
  }
}

function GlobalMapillaryViewer({ mapillaryAccessToken, mapboxAccessToken, headerHeight = 60 }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const mapRef = useRef(null);
  const positionMarkerRef = useRef(null);
  const [viewMode, setViewMode] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const containers = makeContainers(containerRef.current, headerHeight);

    async function initialize() {
      const initialSource = await getSource();
      setSource(initialSource);
      const validFeature = initialSource.data.features.find(f => !f.properties.imageId.startsWith('fallback-'));
      const initialImageId = validFeature ? validFeature.properties.imageId : null;
      if (!initialImageId) {
        const message = makeMessage('No images available. Please try again later.');
        containerRef.current.appendChild(message);
        return;
      }

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

      mapboxgl.accessToken = mapboxAccessToken;
      containers.map.innerHTML = '';
      mapRef.current = new mapboxgl.Map({
        container: containers.map,
        style: 'mapbox://styles/mapbox/streets-v11',
        zoom: 0,
        center: [0, 20],
        // Prevent world repetition by setting renderWorldCopies to false
        renderWorldCopies: false,
      });

      const message = makeMessage('Loading Mapillary Viewer...');
      containerRef.current.appendChild(message);

      // Initialize position marker
      positionMarkerRef.current = makeMapboxMarker(
        { radius: 8, color: '#f0f' },
        validFeature ? validFeature.properties.thumbUrl : ''
      );

      const onImage = async (image) => {
        let lngLat;

        // Primary source: lngLat
        if (image?.lngLat && typeof image.lngLat.lng === 'number' && typeof image.lngLat.lat === 'number') {
          lngLat = [image.lngLat.lng, image.lngLat.lat];
          coordinateCache.set(image.id, lngLat);
        }
        // Fallback 1: computed_geometry.coordinates
        else if (
          image?.computed_geometry?.coordinates &&
          Array.isArray(image.computed_geometry.coordinates) &&
          image.computed_geometry.coordinates.length === 2 &&
          typeof image.computed_geometry.coordinates[0] === 'number' &&
          typeof image.computed_geometry.coordinates[1] === 'number'
        ) {
          lngLat = image.computed_geometry.coordinates; // [lng, lat]
          coordinateCache.set(image.id, lngLat);
        }
        // Fallback 2: Cached coordinates
        else if (coordinateCache.has(image.id)) {
          lngLat = coordinateCache.get(image.id);
        }
        // Fallback 3: Backend coordinates
        else {
          try {
            const imageDetails = await fetchMapillaryImageDetails(image.id);
            if (
              imageDetails?.coordinates &&
              Array.isArray(imageDetails.coordinates) &&
              imageDetails.coordinates.length === 2 &&
              typeof imageDetails.coordinates[0] === 'number' &&
              typeof imageDetails.coordinates[1] === 'number'
            ) {
              lngLat = imageDetails.coordinates; // [lng, lat]
              coordinateCache.set(image.id, lngLat);
            } else {
              return; // Skip marker update
            }
          } catch (error) {
            return; // Skip marker update
          }
        }

        // Validate lngLat
        if (!lngLat || !Array.isArray(lngLat) || lngLat.length !== 2 || isNaN(lngLat[0]) || isNaN(lngLat[1])) {
          return;
        }

        // Update map and marker
        try {
          if (!mapRef.current.getBounds().contains(lngLat)) {
            mapRef.current.setCenter(lngLat);
          }
          if (positionMarkerRef.current) {
            if (!positionMarkerRef.current._map) {
              positionMarkerRef.current.addTo(mapRef.current);
            }
            positionMarkerRef.current.setLngLat(lngLat);
          }
        } catch (error) {
        }
      };

      const onPosition = async () => {
        try {
          const position = await viewerRef.current.getPosition();
          if (!position || typeof position.lng !== 'number' || typeof position.lat !== 'number') {
            return;
          }
          const pos = [Number(position.lng), Number(position.lat)];
          if (positionMarkerRef.current) {
            if (!positionMarkerRef.current._map) {
              positionMarkerRef.current.addTo(mapRef.current);
            }
            positionMarkerRef.current.setLngLat(pos);
          }
        } catch (error) {
          console.log('Issue in onPosition:', error.message);
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
          await moveToWithRetry(viewerRef.current, initialImageId);
          const image = await viewerRef.current.getImage();
          if (image) {
            await onImage(image);
            await onPosition();
            if (positionMarkerRef.current && !positionMarkerRef.current._map) {
              positionMarkerRef.current.addTo(mapRef.current);
            }
          } else {
            message.innerHTML = 'Failed to load initial image. Please try again.';
            setTimeout(() => {
              if (containerRef.current.contains(message)) {
                containerRef.current.removeChild(message);
              }
            }, 3000);
            return;
          }
          if (containerRef.current.contains(message)) {
            containerRef.current.removeChild(message);
          }
        } catch (error) {
          message.innerHTML = 'Error loading viewer. Please refresh.';
          setTimeout(() => {
            if (containerRef.current.contains(message)) {
              containerRef.current.removeChild(message);
            }
          }, 2000);
        }
      });

      viewerRef.current.on('image', (event) => {
        onImage(event.image);
        const indicator = containerRef.current.querySelector('.loading-indicator');
        if (indicator) {
          containerRef.current.removeChild(indicator);
        }
      });

      viewerRef.current.on('position', onPosition);

      viewerRef.current.on('error', (error) => {
        console.log('Viewer issue:', error.message);
      });

      mapRef.current.on('load', () => {
        mapRef.current.addSource('images', initialSource);

        mapRef.current.addLayer({
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

        mapRef.current.addLayer({
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

        mapRef.current.addLayer({
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

        initialSource.data.features.forEach(feature => {
          const { imageId, thumbUrl } = feature.properties;
          const marker = makeMapboxMarker({ radius: 15, color: '#05CB63' }, thumbUrl);
          marker.setLngLat(feature.geometry.coordinates).addTo(mapRef.current);
          marker.getElement().addEventListener('click', () => {
            if (imageId.startsWith('fallback-')) {
              alert('This is a fallback marker. No images available for this location.');
              return;
            }
            const indicator = makeLoadingIndicator();
            containerRef.current.appendChild(indicator);
            moveToWithRetry(viewerRef.current, imageId);
          });
        });

        mapRef.current.on('click', debounce(async (event) => {
          try {
            const features = mapRef.current.queryRenderedFeatures(event.point, { layers: ['clusters', 'unclustered-point'] });
            if (!features.length) return;
            const closest = features[0];
            const { imageId } = closest.properties;
            if (imageId && imageId.startsWith('fallback-')) {
              alert('This is a fallback marker. No images available for this location.');
              return;
            }
            if (imageId) {
              const indicator = makeLoadingIndicator();
              containerRef.current.appendChild(indicator);
              await moveToWithRetry(viewerRef.current, imageId);
            }
          } catch (error) {
            const indicator = containerRef.current.querySelector('.loading-indicator');
            if (indicator) {
              containerRef.current.removeChild(indicator);
            }
          }
        }, 300));

        mapRef.current.on('click', 'clusters', (e) => {
          const features = mapRef.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0].properties.cluster_id;
          mapRef.current.getSource('images').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          });
        });

        mapRef.current.on('mouseenter', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current.on('mouseleave', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = '';
        });
      });
    }

    initialize();

    return () => {
      if (viewerRef.current) viewerRef.current.remove();
      if (mapRef.current) mapRef.current.remove();
    };
  }, [mapillaryAccessToken, mapboxAccessToken, headerHeight]);

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

  const handleSearch = async () => {
    if (!mapRef.current) return;

    let searchBbox = '';
    const country = countryCoordinates.find(c => c.name.toLowerCase() === searchQuery.toLowerCase());
    if (country) {
      searchBbox = country.bbox;
    } else {
      const coords = searchQuery.split(',').map(c => parseFloat(c.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const lng = coords[0];
        const lat = coords[1];
        searchBbox = `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`;
      } else {
        alert('Please enter a valid country name or coordinates (e.g., "12.34, 56.78")');
        return;
      }
    }

    const newSource = await getSource(searchBbox);
    setSource(newSource);
    mapRef.current.getSource('images').setData(newSource.data);
    mapRef.current.easeTo({
      center: searchBbox.split(',').slice(0, 2).map(Number),
      zoom: 12,
    });

    if (newSource.data.features.length && !newSource.data.features[0].properties.imageId.startsWith('fallback-')) {
      const indicator = makeLoadingIndicator();
      containerRef.current.appendChild(indicator);
      await moveToWithRetry(viewerRef.current, newSource.data.features[0].properties.imageId);
    }
  };

  useEffect(() => {
    const viewerContainer = containerRef.current?.querySelector('.viewer');
    const mapContainer = containerRef.current?.querySelector('.map');
    if (!viewerContainer || !mapContainer) return;

    switch (viewMode) {
      case 'default':
        viewerContainer.style.display = 'block';
        viewerContainer.style.width = '350px'; // Bigger default size
        viewerContainer.style.height = '250px';
        viewerContainer.style.bottom = '20px';
        viewerContainer.style.left = '20px';
        viewerContainer.style.zIndex = '100';
        mapContainer.style.display = 'block';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = `calc(100vh - ${headerHeight}px)`;
        mapContainer.style.zIndex = '10';
        break;
      case 'map':
        viewerContainer.style.display = 'none';
        mapContainer.style.display = 'block';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = `calc(100vh - ${headerHeight}px)`;
        mapContainer.style.zIndex = '10';
        break;
      case 'viewer':
        viewerContainer.style.display = 'block';
        viewerContainer.style.width = '100vw';
        viewerContainer.style.height = `calc(100vh - ${headerHeight}px)`;
        viewerContainer.style.bottom = '0';
        viewerContainer.style.left = '0';
        viewerContainer.style.zIndex = '100';
        mapContainer.style.display = 'none';
        break;
      case 'swapped':
        viewerContainer.style.display = 'block';
        viewerContainer.style.width = '100vw';
        viewerContainer.style.height = `calc(100vh - ${headerHeight}px)`;
        viewerContainer.style.bottom = '0';
        viewerContainer.style.left = '0';
        viewerContainer.style.zIndex = '10';
        mapContainer.style.display = 'block';
        mapContainer.style.width = '350px'; // Matches bigger viewer size
        mapContainer.style.height = '250px';
        mapContainer.style.bottom = '20px';
        mapContainer.style.left = '20px';
        mapContainer.style.zIndex = '100';
        break;
    }

    const handleResize = () => {
      if (window.innerWidth <= 600 && (viewMode === 'default' || viewMode === 'swapped')) {
        viewerContainer.style.width = viewMode === 'default' ? '200px' : '100vw';
        viewerContainer.style.height = viewMode === 'default' ? '150px' : `calc(100vh - ${headerHeight}px)`;
        mapContainer.style.width = viewMode === 'swapped' ? '200px' : '100vw';
        mapContainer.style.height = viewMode === 'swapped' ? '150px' : `calc(100vh - ${headerHeight}px)`;
      } else if (viewMode === 'default' || viewMode === 'swapped') {
        viewerContainer.style.width = viewMode === 'default' ? '350px' : '100vw';
        viewerContainer.style.height = viewMode === 'default' ? '250px' : `calc(100vh - ${headerHeight}px)`;
        mapContainer.style.width = viewMode === 'swapped' ? '350px' : '100vw';
        mapContainer.style.height = viewMode === 'swapped' ? '250px' : `calc(100vh - ${headerHeight}px)`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, headerHeight]);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: `calc(100vh - ${headerHeight}px)`, top: '0px' }}>
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: '1000', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search country or coords (e.g., USA or 12.34, 56.78)"
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '250px',
            zIndex: '1000',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '8px 16px',
            backgroundColor: '#05CB63',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: '1000',
          }}
        >
          Search
        </button>
      </div>
      <button
        onClick={toggleView}
        style={{
          position: 'absolute',
          top: '10px',
          left: '330px',
          zIndex: '1000',
          padding: '8px 16px',
          backgroundColor: '#05CB63',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ↔ {/* Only this little fucker handles toggling now */}
      </button>
    </div>
  );
}

export default GlobalMapillaryViewer;