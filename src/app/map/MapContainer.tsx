

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { makeContainers, makeMapboxMarker, makeMessage, makeLoadingIndicator, debounce, moveToWithRetry, getSource, fetchImages } from './mapUtils';
import countryCoordinates from './countryCoordinates';

interface MapContainerProps {
  mapboxAccessToken: string;
  mapStyle: string;
  container: HTMLDivElement;
  viewerRef: React.MutableRefObject<any>;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  setImageId: (imageId: string) => void;
}

const mapStyles = [
  { name: 'Streets', url: 'mapbox://styles/mapbox/streets-v11' },
  { name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { name: 'Dark', url: 'mapbox://styles/mapbox/dark-v10' },
];

export default function MapContainer({ mapboxAccessToken, mapStyle, container, viewerRef, positionMarkerRef, setImageId }: MapContainerProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const sourceCache = useRef<any>(null);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(() => {
    const index = mapStyles.findIndex(s => s.url === mapStyle);
    return index !== -1 ? index : 0;
  });
  const [projection, setProjection] = useState<'mercator' | 'globe'>('mercator');

  useEffect(() => {
    if (!container || initializedRef.current) return;

    const containers = makeContainers(container, 0);
    containers.map.style.position = 'absolute';
    containers.map.style.top = '0';
    containers.map.style.left = '0';
    containers.map.style.width = '100%';
    containers.map.style.height = '100%';
    initializedRef.current = true;

    async function initializeMap() {
      let initialSource = sourceCache.current;
      if (!initialSource) {
        initialSource = await getSource();
        sourceCache.current = initialSource;
        console.log(`Initial source features: ${initialSource.data.features.length}`);
      }
      if (!initialSource.data.features.length) {
        const message = makeMessage('No locations available. Please try again later.');
        container.appendChild(message);
        return;
      }

      mapboxgl.accessToken = mapboxAccessToken;
      containers.map.innerHTML = '';
      mapRef.current = new mapboxgl.Map({
        container: containers.map,
        style: mapStyles[currentStyleIndex].url,
        zoom: 3,
        center: [0, 20],
        minZoom: 1.25,
        projection: projection,
      });

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxAccessToken,
        mapboxgl: mapboxgl,
        placeholder: 'Search city, country, or coords',
        types: 'place,country',
        clearOnBlur: true,
      });

      mapRef.current.addControl(geocoder, 'top-left');

      setTimeout(() => {
        const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
        if (geocoderEl) {
          const geocoderHTMLElement = geocoderEl as HTMLElement;
          geocoderHTMLElement.className = 'custom-geocoder';
          geocoderHTMLElement.style.position = 'absolute';
          geocoderHTMLElement.style.top = '10px';
          geocoderHTMLElement.style.left = '20px';
          geocoderHTMLElement.style.width = '500px';
          geocoderHTMLElement.style.maxWidth = 'calc(100% - 40px)';
          geocoderHTMLElement.style.backgroundColor = '#FFFFFF';
          geocoderHTMLElement.style.border = '2px solid #E0E0E0';
          geocoderHTMLElement.style.borderRadius = '8px';
          geocoderHTMLElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          geocoderHTMLElement.style.display = 'flex';
          geocoderHTMLElement.style.alignItems = 'center';
          geocoderHTMLElement.style.padding = '0 12px';
          geocoderHTMLElement.style.zIndex = '1010';
          geocoderHTMLElement.style.transition = 'all 0.2s ease';

          const input = geocoderEl.querySelector('input');
          if (input) {
            input.style.border = 'none';
            input.style.outline = 'none';
            input.style.width = '100%';
            input.style.padding = '12px 45px 12px 45px';
            input.style.fontSize = '16px';
            input.style.fontFamily = 'Arial, sans-serif';
            input.style.color = '#333333';
            input.style.background = 'transparent';
            input.placeholder = 'Search city, country, or coords';
          }

          const searchIcon = document.createElement('div');
          searchIcon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          `;
          searchIcon.style.position = 'absolute';
          searchIcon.style.left = '12px';
          searchIcon.style.pointerEvents = 'none';
          geocoderEl.insertBefore(searchIcon, input);

          const clearButton = document.createElement('button');
          clearButton.innerHTML = '×';
          clearButton.style.display = 'none';
          clearButton.style.background = 'none';
          clearButton.style.border = 'none';
          clearButton.style.color = '#666666';
          clearButton.style.fontSize = '18px';
          clearButton.style.cursor = 'pointer';
          clearButton.style.padding = '0 12px';
          clearButton.style.marginLeft = 'auto';
          geocoderEl.appendChild(clearButton);

          input?.addEventListener('input', () => {
            clearButton.style.display = input.value ? 'block' : 'none';
          });
          input?.addEventListener('focus', () => {
            geocoderHTMLElement.style.borderColor = '#05CB63';
            geocoderHTMLElement.style.boxShadow = '0 2px 12px rgba(5,203,99,0.3)';
          });
          input?.addEventListener('blur', () => {
            geocoderHTMLElement.style.borderColor = '#E0E0E0';
            geocoderHTMLElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          });
          clearButton.addEventListener('click', () => {
            input.value = '';
            clearButton.style.display = 'none';
            input.focus();
            geocoder.clear();
          });

          const suggestions = geocoderEl.querySelector('.suggestions');
          if (suggestions) {
            (suggestions as HTMLElement).style.maxHeight = '400px';
            (suggestions as HTMLElement).style.overflowY = 'auto';
            (suggestions as HTMLElement).style.backgroundColor = '#FFFFFF';
            (suggestions as HTMLElement).style.border = '1px solid #E0E0E0';
            (suggestions as HTMLElement).style.borderRadius = '4px';
            (suggestions as HTMLElement).style.padding = '10px 0';
            (suggestions as HTMLElement).style.fontSize = '14px';
            (suggestions as HTMLElement).style.lineHeight = '1.5';
            (suggestions as HTMLElement).style.width = '100%';
          }

          const suggestionItems = geocoderEl.querySelectorAll('.suggestion');
          suggestionItems.forEach((item) => {
            (item as HTMLElement).style.padding = '8px 12px';
            (item as HTMLElement).style.cursor = 'pointer';
            (item as HTMLElement).style.transition = 'background-color 0.2s ease';
            item.addEventListener('mouseenter', () => {
              (item as HTMLElement).style.backgroundColor = '#f5f5f5';
            });
            item.addEventListener('mouseleave', () => {
              (item as HTMLElement).style.backgroundColor = '#FFFFFF';
            });
          });

          const handleResize = () => {
            if (window.innerWidth <= 600) {
              geocoderHTMLElement.style.width = '300px';
              geocoderHTMLElement.style.top = '10px';
              input.style.fontSize = '14px';
              input.style.padding = '10px 40px 10px 40px';
            } else {
              geocoderHTMLElement.style.width = '500px';
              geocoderHTMLElement.style.top = '10px';
              input.style.fontSize = '16px';
              input.style.padding = '12px 45px 12px 45px';
            }
          };
          handleResize();
          window.addEventListener('resize', handleResize);

          return () => {
            window.removeEventListener('resize', handleResize);
          };
        }
      }, 0);

      positionMarkerRef.current = makeMapboxMarker(
        { radius: 12, color: '#05CB63' },
        ''
      );

      const buttonContainer = document.createElement('div');
      buttonContainer.style.position = 'absolute';
      buttonContainer.style.top = '60px';
      buttonContainer.style.right = '20px';
      buttonContainer.style.zIndex = '1010';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.gap = '8px';
      containers.map.appendChild(buttonContainer);

      const viewButton = document.createElement('button');
      viewButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        ${mapStyles[currentStyleIndex].name}
      `;
      viewButton.style.display = 'flex';
      viewButton.style.alignItems = 'center';
      viewButton.style.padding = '8px 12px';
      viewButton.style.backgroundColor = '#FFFFFF';
      viewButton.style.color = '#333333';
      viewButton.style.border = '2px solid #E0E0E0';
      viewButton.style.borderRadius = '8px';
      viewButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      viewButton.style.cursor = 'pointer';
      viewButton.style.fontSize = '14px';
      viewButton.style.fontFamily = 'Arial, sans-serif';
      viewButton.style.transition = 'all 0.2s ease';
      viewButton.title = 'Toggle map view';
      buttonContainer.appendChild(viewButton);

      const projectionButton = document.createElement('button');
      projectionButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <path d="M12 2a10 10 0 0 0-9.95 9.95A10 10 0 0 0 12 22a10 10 0 0 0 9.95-9.95A10 10 0 0 0 12 2z"></path>
          <path d="M12 2v20"></path>
          <path d="M2 12h20"></path>
        </svg>
        ${projection === 'mercator' ? 'Globe' : 'Mercator'}
      `;
      projectionButton.style.display = 'flex';
      projectionButton.style.alignItems = 'center';
      projectionButton.style.padding = '8px 12px';
      projectionButton.style.backgroundColor = 'white';
      projectionButton.style.color = '#333333';
      projectionButton.style.border = '2px solid #E0E0E0';
      projectionButton.style.borderRadius = '8px';
      projectionButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      projectionButton.style.cursor = 'pointer';
      projectionButton.style.fontSize = '14px';
      projectionButton.style.fontFamily = 'Arial, sans-serif';
      projectionButton.style.transition = 'all 0.2s ease';
      projectionButton.title = 'Toggle projection';
      buttonContainer.appendChild(projectionButton);

      const locateButton = document.createElement('button');
      locateButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        Locate
      `;
      locateButton.style.display = 'flex';
      locateButton.style.alignItems = 'center';
      locateButton.style.padding = '8px 12px';
      locateButton.style.backgroundColor = '#FFFFFF';
      locateButton.style.color = '#333333';
      locateButton.style.border = '2px solid #E0E0E0';
      locateButton.style.borderRadius = '8px';
      locateButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      locateButton.style.cursor = 'pointer';
      locateButton.style.fontSize = '14px';
      locateButton.style.fontFamily = 'Arial, sans-serif';
      locateButton.style.transition = 'all 0.2s ease';
      locateButton.title = 'Find my location';
      buttonContainer.appendChild(locateButton);

      [viewButton, projectionButton, locateButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
          if (!button.disabled) {
            button.style.borderColor = '#05CB63';
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 4px 12px rgba(5,203,99,0.3)';
          }
        });
        button.addEventListener('mouseleave', () => {
          if (!button.disabled) {
            button.style.borderColor = '#E0E0E0';
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        });
      });

      const handleButtonResize = () => {
        if (window.innerWidth <= 600) {
          viewButton.style.padding = '6px 10px';
          viewButton.style.fontSize = '12px';
          projectionButton.style.padding = '6px 10px';
          projectionButton.style.fontSize = '12px';
          locateButton.style.padding = '6px 10px';
          locateButton.style.fontSize = '12px';
          buttonContainer.style.top = '60px';
        } else {
          viewButton.style.padding = '8px 12px';
          viewButton.style.fontSize = '14px';
          projectionButton.style.padding = '8px 12px';
          projectionButton.style.fontSize = '14px';
          locateButton.style.padding = '8px 12px';
          locateButton.style.fontSize = '14px';
          buttonContainer.style.top = '60px';
        }
      };
      handleButtonResize();
      window.addEventListener('resize', handleButtonResize);

      const applyMapStyle = (styleIndex: number) => {
        if (!mapRef.current) return;
        mapRef.current.setStyle(mapStyles[styleIndex].url);
        viewButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          ${mapStyles[styleIndex].name}
        `;
        mapRef.current.once('style.load', () => {
          if (mapRef.current && sourceCache.current) {
            mapRef.current.addSource('images', sourceCache.current);
            mapRef.current.addLayer({
              id: 'unclustered-point',
              type: 'circle',
              source: 'images',
              filter: ['!', ['has', 'point_count']],
              paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 10, 12],
                'circle-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.7, 10, 0.5],
                'circle-color': '#05CB63',
                'circle-stroke-color': '#05cb63',
                'circle-stroke-width': 2,
              },
            });
            mapRef.current.addSource('place-labels', {
              type: 'vector',
              url: 'mapbox://mapbox.mapbox-streets-v8',
            });
            mapRef.current.addLayer({
              id: 'place-labels',
              type: 'symbol',
              source: 'place-labels',
              'source-layer': 'place_label',
              layout: {
                'text-field': ['get', 'name'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 8, 16],
                'text-max-width': 8,
                'text-justify': 'center',
                'text-anchor': 'center',
                'text-transform': ['match', ['get', 'type'], ['country'], 'uppercase'],
                'text-writing-mode': ['horizontal'],
              },
              paint: {
                'text-color': [
                  'match',
                  ['get', 'type'],
                  'country',
                  '#333333',
                  'city',
                  '#444444',
                  '#555555',
                ],
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 1,
                'text-halo-blur': 1,
              },
              filter: ['in', ['get', 'type'], ['literal', ['country', 'state', 'city', 'town']]],
            });
          }
        });
      };

      viewButton.addEventListener('click', () => {
        const nextIndex = (currentStyleIndex + 1) % mapStyles.length;
        setCurrentStyleIndex(nextIndex);
        applyMapStyle(nextIndex);
      });

      projectionButton.addEventListener('click', () => {
        const newProjection = projection === 'mercator' ? 'globe' : 'mercator';
        setProjection(newProjection);
        if (mapRef.current) {
          mapRef.current.setProjection(newProjection);
        }
        projectionButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M12 2a10 10 0 0 0-9.95 9.95A10 0 0 0 12 22a10 0 0 0 9.95-9.95A10 0 0 0 12 2z"></path>
            <path d="M12 2v20"></path>
            <path d="M2 12h20"></path>
          </svg>
          ${newProjection === 'mercator' ? 'Globe' : 'Mercator'}
        `;
      });

      locateButton.addEventListener('click', () => {
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser.');
          return;
        }
        locateButton.disabled = true;
        locateButton.style.backgroundColor = '#F0F0F0';
        locateButton.style.borderColor = '#E0E0E0';
        locateButton.style.cursor = 'not-allowed';
        locateButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Locating...
        `;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords;
            if (mapRef.current) {
              mapRef.current.easeTo({
                center: [longitude, latitude],
                zoom: 12,
              });
              if (positionMarkerRef.current) {
                positionMarkerRef.current.setLngLat([longitude, latitude]).addTo(mapRef.current);
              }
            }
            locateButton.disabled = false;
            locateButton.style.backgroundColor = 'white';
            locateButton.style.borderColor = '#E0E0E0';
            locateButton.style.cursor = 'pointer';
            locateButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13 a9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Locate
            `;
          },
          (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to retrieve your location. Please allow location access.');
            locateButton.disabled = false;
            locateButton.style.backgroundColor = 'white';
            locateButton.style.borderColor = '#E0E0E0E0';
            locateButton.style.cursor = 'pointer';
            locateButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13 a9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Locate
            `;
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

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
        }

        const indicator = makeLoadingIndicator();
        container.appendChild(indicator);
        try {
          const features = await fetchImages(countryBbox, 1);
          let imageId: string | null = null;
          let coordinates: [number, number] = countryCenter || center;
          if (features.length && !features[0].properties.imageId.startsWith('fallback-')) {
            imageId = features[0].properties.imageId;
            coordinates = features[0].geometry.coordinates as [number, number];
          }

          const newSourceData: GeoJSON.FeatureCollection<GeoJSON.Geometry, { [name: string]: any }> = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: { imageId: imageId || `fallback-${countryBbox}`, thumbUrl: features[0]?.properties.thumbUrl || '' },
              geometry: {
                type: 'Point',
                coordinates,
              },
            }],
          };
          (mapRef.current!.getSource('images') as mapboxgl.GeoJSONSource).setData(newSourceData);
          mapRef.current!.easeTo({
            center: coordinates,
            zoom: 5,
          });
          setImageId(imageId || `fallback-${countryBbox}`);
          if (imageId && viewerRef.current && viewerRef.current.isInitialized) {
            await moveToWithRetry(viewerRef.current, imageId);
          } else {
            alert('No images found for this location. Showing fallback marker.');
          }
        } catch (error) {
          console.error('Geocoder error:', error);
          alert('Failed to load images for this location.');
        } finally {
          const indicator2 = container.querySelector('.loading-indicator');
          if (indicator2) container.removeChild(indicator2);
        }
      });

      geocoder.on('error', () => {
        alert('Search failed. Please try a valid city, country, or coordinates.');
      });

      mapRef.current.on('load', () => {
        mapRef.current!.addSource('images', initialSource);

        mapRef.current!.addSource('place-labels', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8',
        });

        mapRef.current!.addLayer({
          id: 'place-labels',
          type: 'symbol',
          source: 'place-labels',
          'source-layer': 'place_label',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 8, 16],
            'text-max-width': 8,
            'text-justify': 'center',
            'text-anchor': 'center',
            'text-transform': ['match', ['get', 'type'], ['country'], 'uppercase', 'none'],
            'text-writing-mode': ['horizontal'],
          },
          paint: {
            'text-color': [
              'match',
              ['get', 'type'],
              'country',
              '#333333',
              'city',
              '#444444',
              '#555555',
            ],
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1,
            'text-halo-blur': 1,
          },
          filter: ['in', ['get', 'type'], ['literal', ['country', 'state', 'city', 'town']]],
        });

        mapRef.current!.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'images',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 10, 12],
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.7, 10, 0.5],
            'circle-color': '#05CB63',
            'circle-stroke-color': '#05cb63',
            'circle-stroke-width': 2,
          },
        });

        mapRef.current!.on('click', debounce(async (event: mapboxgl.MapMouseEvent) => {
          try {
            const features = mapRef.current!.queryRenderedFeatures(event.point, { layers: ['unclustered-point'] });
            if (!features.length) return;
            const closest = features[0];
            const { imageId } = closest.properties;

            let indicator: HTMLElement | null = null;

            if (imageId && imageId.startsWith('fallback-')) {
              indicator = makeLoadingIndicator();
              container.appendChild(indicator);
              const bbox = imageId.replace('fallback-', '');
              const imageFeatures = await fetchImages(bbox, 1);
              let newImageId: string | null = null;
              let coordinates: [number, number] = (closest.geometry as GeoJSON.Point).coordinates as [number, number];
              if (imageFeatures.length && !imageFeatures[0].properties.imageId.startsWith('fallback-')) {
                newImageId = imageFeatures[0].properties.imageId;
                coordinates = imageFeatures[0].geometry.coordinates as [number, number];
              }
              if (newImageId && viewerRef.current && viewerRef.current.isInitialized) {
                await moveToWithRetry(viewerRef.current, newImageId);
                if (mapRef.current) {
                  const newSource = {
                    type: 'geojson',
                    data: {
                      type: 'FeatureCollection',
                      features: [{
                        type: 'Feature',
                        properties: { imageId: newImageId, thumbUrl: imageFeatures[0]?.properties.thumbUrl || '' },
                        geometry: {
                          type: 'Point',
                          coordinates,
                        },
                      }],
                    },
                  };
                  (mapRef.current.getSource('images') as mapboxgl.GeoJSONSource).setData(newSource.data as GeoJSON.FeatureCollection<GeoJSON.Geometry, { [name: string]: any }>);
                  setImageId(newImageId);
                  mapRef.current.easeTo({
                    center: coordinates,
                    zoom: 12,
                  });
                }
              } else {
                alert('No images available for this location.');
                setImageId(`fallback-${bbox}`);
              }
            } else if (imageId && viewerRef.current && viewerRef.current.isInitialized) {
              indicator = makeLoadingIndicator();
              container.appendChild(indicator);
              await moveToWithRetry(viewerRef.current, imageId);
              setImageId(imageId);
            } else {
              console.warn('Viewer not initialized on map click');
            }

            if (indicator) {
              const existingIndicator = container.querySelector('.loading-indicator');
              if (existingIndicator) container.removeChild(existingIndicator);
            }
          } catch (error) {
            console.error('Error in map click handler:', error);
            const indicator = container.querySelector('.loading-indicator');
            if (indicator) container.removeChild(indicator);
          }
        }, 250));

        mapRef.current!.getCanvas().style.cursor = 'grab';
      });

      return () => {
        buttonContainer.remove();
        window.removeEventListener('resize', handleButtonResize);
      };
    }

    initializeMap().catch(error => {
      console.error('Error initializing map:', error);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [mapboxAccessToken, mapStyle, container, viewerRef, positionMarkerRef, setImageId]);

  return null;
}
