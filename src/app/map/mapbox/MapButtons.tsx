import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { makeMapboxMarker, getSource } from '../mapUtils';
import { MapStyle } from './types';
import { mapStyles } from './mapStyles';

interface MapButtonsProps {
  map: mapboxgl.Map | null;
  currentStyleIndex: number;
  setCurrentStyleIndex: (index: number) => void;
  projection: 'mercator' | 'globe';
  setProjection: (projection: 'mercator' | 'globe') => void;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  container: HTMLDivElement | null;
  sourceCache: React.MutableRefObject<any>;
}

export default function MapButtons({
  map,
  currentStyleIndex,
  setCurrentStyleIndex,
  projection,
  setProjection,
  positionMarkerRef,
  container,
  sourceCache,
}: MapButtonsProps) {
  useEffect(() => {
    if (!map || !container) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.top = '60px';
    buttonContainer.style.right = '20px';
    buttonContainer.style.zIndex = '1010';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '8px';
    container.appendChild(buttonContainer);

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
        <path d="M12 2a10 10 0 0 0-9.95 9.95A10 0 0 0 12 22a10 0 0 0 9.95-9.95A10 0 0 0 12 2z"></path>
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
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13 a9 0 0 1 18 0z"></path>
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

    const applyMapStyle = async (styleIndex: number) => {
      if (!map) return;
      
      // Get the current source data from cache or fetch anew
      let sourceData = sourceCache.current;
      if (!sourceData) {
        sourceData = await getSource();
        sourceCache.current = sourceData;
      }

      // Get the current selected point filter (if any)
      const currentFilter = map.getLayer('selected-point')?.filter || ['==', 'imageId', ''];

      map.setStyle(mapStyles[styleIndex].url);
      viewButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        ${mapStyles[styleIndex].name}
      `;
      map.once('style.load', () => {
        if (map) {
          // Re-add the images source with actual data
          if (!map.getSource('images')) {
            map.addSource('images', sourceData);
          } else {
            (map.getSource('images') as mapboxgl.GeoJSONSource).setData(sourceData.data);
          }

          // Re-add unclustered-point layer
          if (!map.getLayer('unclustered-point')) {
            map.addLayer({
              id: 'unclustered-point',
              type: 'circle',
              source: 'images',
              filter: ['!', ['has', 'point_count']],
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 4,
                  10, 8,
                  15, 12
                ],
                'circle-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 0.3,
                  10, 0.6,
                  15, 0.8
                ],
                'circle-color': '#05CB63',
                'circle-stroke-color': '#FFFFFF',
                'circle-stroke-width': 1.5,
                'circle-stroke-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 0.5,
                  15, 1
                ]
              }
            });
          }

          // Re-add selected-point layer with the same filter
          if (!map.getLayer('selected-point')) {
            map.addLayer({
              id: 'selected-point',
              type: 'circle',
              source: 'images',
              paint: {
                'circle-radius': 10,
                'circle-color': 'rgba(148, 0, 211, 0.5)',
                'circle-stroke-color': '#FFFFFF',
                'circle-stroke-width': 2,
              },
              filter: currentFilter,
            });
          }

          // Re-add place-labels source and layer
          if (!map.getSource('place-labels')) {
            map.addSource('place-labels', {
              type: 'vector',
              url: 'mapbox://mapbox.mapbox-streets-v8',
            });
            map.addLayer({
              id: 'place-labels',
              type: 'symbol',
              source: 'place-labels',
              'source-layer': 'place_label',
              layout: {
                'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
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
          }
        }
      });
    };

    viewButton.addEventListener('click', () => {
      const nextIndex = (currentStyleIndex + 1) % mapStyles.length;
      setCurrentStyleIndex(nextIndex);
      applyMapStyle(nextIndex);
    });

    projectionButton.addEventListener('click', async () => {
      const newProjection = projection === 'mercator' ? 'globe' : 'mercator';
      setProjection(newProjection);
      if (map) {
        // Get the current source data
        let sourceData = sourceCache.current;
        if (!sourceData) {
          sourceData = await getSource();
          sourceCache.current = sourceData;
        }

        // Get the current selected point filter
        const currentFilter = map.getLayer('selected-point')?.filter || ['==', 'imageId', ''];

        map.setProjection(newProjection);

        // Ensure the images source and layers are present
        if (!map.getSource('images')) {
          map.addSource('images', sourceData);
        } else {
          (map.getSource('images') as mapboxgl.GeoJSONSource).setData(sourceData.data);
        }

        if (!map.getLayer('unclustered-point')) {
          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'images',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 4,
                10, 8,
                15, 12
              ],
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 0.3,
                10, 0.6,
                15, 0.8
              ],
              'circle-color': '#05CB63',
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 1.5,
              'circle-stroke-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 0.5,
                15, 1
              ]
            }
          });
        }

        if (!map.getLayer('selected-point')) {
          map.addLayer({
            id: 'selected-point',
            type: 'circle',
            source: 'images',
            paint: {
              'circle-radius': 10,
              'circle-color': 'rgba(148, 0, 211, 0.5)',
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2,
            },
            filter: currentFilter,
          });
        }
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
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13 a9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        Locating...
      `;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          if (map) {
            map.easeTo({
              center: [longitude, latitude],
              zoom: 12,
            });
            if (positionMarkerRef.current) {
              positionMarkerRef.current.setLngLat([longitude, latitude]).addTo(map);
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
          console.error('MapButtons: Geolocation error:', error);
          alert('Unable to retrieve your location. Please allow location access.');
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
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    return () => {
      buttonContainer.remove();
      window.removeEventListener('resize', handleButtonResize);
    };
  }, [map, currentStyleIndex, setCurrentStyleIndex, projection, setProjection, positionMarkerRef, container, sourceCache]);

  return null;
}