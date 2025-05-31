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
    buttonContainer.style.bottom = '20px';
    buttonContainer.style.right = '20px';
    buttonContainer.style.zIndex = '1010';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '10px';
    container.appendChild(buttonContainer);

    const styleDropdownContainer = document.createElement('div');
    styleDropdownContainer.style.position = 'absolute';
    styleDropdownContainer.style.bottom = '50px';
    styleDropdownContainer.style.right = '0';
    styleDropdownContainer.style.zIndex = '1020';
    styleDropdownContainer.style.display = 'none';
    buttonContainer.appendChild(styleDropdownContainer);

    const styleDropdown = document.createElement('div');
    styleDropdown.style.backgroundColor = '#FFFFFF';
    styleDropdown.style.borderRadius = '8px';
    styleDropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    styleDropdown.style.width = '160px';
    styleDropdown.style.padding = '12px';
    styleDropdown.style.display = 'flex';
    styleDropdown.style.flexDirection = 'column';
    styleDropdown.style.gap = '8px';
    styleDropdownContainer.appendChild(styleDropdown);

    const dropdownTitle = document.createElement('div');
    dropdownTitle.style.fontSize = '14px';
    dropdownTitle.style.fontWeight = 'bold';
    dropdownTitle.style.color = '#333333';
    dropdownTitle.style.marginBottom = '8px';
    dropdownTitle.textContent = 'Basemap';
    styleDropdown.appendChild(dropdownTitle);

    mapStyles.forEach((style: MapStyle, index: number) => {
      const styleItem = document.createElement('div');
      styleItem.style.display = 'flex';
      styleItem.style.alignItems = 'center';
      styleItem.style.gap = '8px';
      styleItem.style.padding = '6px';
      styleItem.style.borderRadius = '6px';
      styleItem.style.cursor = 'pointer';
      styleItem.style.transition = 'background-color 0.2s ease';
      if (index === currentStyleIndex) {
        styleItem.style.border = '2px solid #05CB63';
      }
      styleItem.addEventListener('mouseenter', () => {
        styleItem.style.backgroundColor = '#F5F5F5';
      });
      styleItem.addEventListener('mouseleave', () => {
        styleItem.style.backgroundColor = 'transparent';
      });
      styleItem.addEventListener('click', () => {
        setCurrentStyleIndex(index);
        applyMapStyle(index);
        styleDropdownContainer.style.display = 'none';
      });

      const styleImage = document.createElement('div');
      styleImage.style.width = '64px';
      styleImage.style.height = '64px';
      styleImage.style.backgroundColor = '#E0E0E0';
      styleImage.style.borderRadius = '4px';
      styleImage.style.backgroundSize = 'cover';
      styleImage.style.backgroundPosition = 'center';
      styleImage.style.backgroundImage = `url('${style.thumbnail}')`;
      styleItem.appendChild(styleImage);

      const styleName = document.createElement('div');
      styleName.style.fontSize = '12px';
      styleName.style.color = '#333333';
      styleName.textContent = style.name;
      styleItem.appendChild(styleName);

      styleDropdown.appendChild(styleItem);
    });

    const viewButton = document.createElement('button');
    viewButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
    viewButton.style.display = 'flex';
    viewButton.style.alignItems = 'center';
    viewButton.style.justifyContent = 'center';
    viewButton.style.width = '40px';
    viewButton.style.height = '40px';
    viewButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
    viewButton.style.border = '2px solid #E0E0E0';
    viewButton.style.borderRadius = '12px';
    viewButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    viewButton.style.cursor = 'pointer';
    viewButton.style.transition = 'all 0.3s ease';
    viewButton.title = 'Select map style';
    buttonContainer.appendChild(viewButton);

    const zoomInButton = document.createElement('button');
    zoomInButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    `;
    zoomInButton.style.display = 'flex';
    zoomInButton.style.alignItems = 'center';
    zoomInButton.style.justifyContent = 'center';
    zoomInButton.style.width = '40px';
    zoomInButton.style.height = '40px';
    zoomInButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
    zoomInButton.style.border = '2px solid #E0E0E0';
    zoomInButton.style.borderRadius = '12px';
    zoomInButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    zoomInButton.style.cursor = 'pointer';
    zoomInButton.style.transition = 'all 0.3s ease';
    zoomInButton.title = 'Zoom in';
    buttonContainer.appendChild(zoomInButton);

    const zoomOutButton = document.createElement('button');
    zoomOutButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    `;
    zoomOutButton.style.display = 'flex';
    zoomOutButton.style.alignItems = 'center';
    zoomOutButton.style.justifyContent = 'center';
    zoomOutButton.style.width = '40px';
    zoomOutButton.style.height = '40px';
    zoomOutButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
    zoomOutButton.style.border = '2px solid #E0E0E0';
    zoomOutButton.style.borderRadius = '12px';
    zoomOutButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    zoomOutButton.style.cursor = 'pointer';
    zoomOutButton.style.transition = 'all 0.3s ease';
    zoomOutButton.title = 'Zoom out';
    buttonContainer.appendChild(zoomOutButton);

    const projectionButton = document.createElement('button');
    projectionButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 0 0-9.95 9.95A10 0 0 0 12 22a10 0 0 0 9.95-9.95A10 0 0 0 12 2z"></path>
        <path d="M12 2v20"></path>
        <path d="M2 12h20"></path>
      </svg>
    `;
    projectionButton.style.display = 'flex';
    projectionButton.style.alignItems = 'center';
    projectionButton.style.justifyContent = 'center';
    projectionButton.style.width = '40px';
    projectionButton.style.height = '40px';
    projectionButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
    projectionButton.style.border = '2px solid #E0E0E0';
    projectionButton.style.borderRadius = '12px';
    projectionButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    projectionButton.style.cursor = 'pointer';
    projectionButton.style.transition = 'all 0.3s ease';
    projectionButton.title = 'Toggle projection';
    buttonContainer.appendChild(projectionButton);

    const locateButton = document.createElement('button');
    locateButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13 a9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    `;
    locateButton.style.display = 'flex';
    locateButton.style.alignItems = 'center';
    locateButton.style.justifyContent = 'center';
    locateButton.style.width = '40px';
    locateButton.style.height = '40px';
    locateButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
    locateButton.style.border = '2px solid #E0E0E0';
    locateButton.style.borderRadius = '12px';
    locateButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    locateButton.style.cursor = 'pointer';
    locateButton.style.transition = 'all 0.3s ease';
    locateButton.title = 'Find my location';
    buttonContainer.appendChild(locateButton);

    const homeButton = document.createElement('button');
    homeButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    `;
    homeButton.style.display = 'flex';
    homeButton.style.alignItems = 'center';
    homeButton.style.justifyContent = 'center';
    homeButton.style.width = '40px';
    homeButton.style.height = '40px';
    homeButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
    homeButton.style.border = '2px solid #E0E0E0';
    homeButton.style.borderRadius = '12px';
    homeButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    homeButton.style.cursor = 'pointer';
    homeButton.style.transition = 'all 0.3s ease';
    homeButton.title = 'Return to home';
    buttonContainer.appendChild(homeButton);

    const buttons = [viewButton, zoomInButton, zoomOutButton, projectionButton, locateButton, homeButton];
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
          button.style.borderColor = '#05CB63';
          button.style.transform = 'scale(1.1)';
          button.style.boxShadow = '0 4px 12px rgba(5,203,99,0.4)';
          const svg = button.querySelector('svg');
          if (svg) svg.style.stroke = '#05CB63';
        }
      });
      button.addEventListener('mouseleave', () => {
        if (!button.disabled) {
          button.style.borderColor = '#E0E0E0';
          button.style.transform = 'scale(1)';
          button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
          const svg = button.querySelector('svg');
          if (svg) svg.style.stroke = '#333333';
        }
      });
      button.addEventListener('click', () => {
        if (!button.disabled) {
          button.style.transform = 'scale(0.95)';
          setTimeout(() => {
            button.style.transform = 'scale(1)';
          }, 100);
        }
      });
    });

    viewButton.addEventListener('click', () => {
      styleDropdownContainer.style.display = styleDropdownContainer.style.display === 'none' ? 'block' : 'none';
    });

    zoomInButton.addEventListener('click', () => {
      if (map) map.zoomIn({ duration: 300 });
    });

    zoomOutButton.addEventListener('click', () => {
      if (map) map.zoomOut({ duration: 300 });
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (!styleDropdownContainer.contains(event.target as Node) && !viewButton.contains(event.target as Node)) {
        styleDropdownContainer.style.display = 'none';
      }
    };
    document.addEventListener('click', handleClickOutside);

    const handleButtonResize = () => {
      if (window.innerWidth <= 600) {
        buttons.forEach(button => {
          button.style.width = '36px';
          button.style.height = '36px';
          button.style.borderRadius = '10px';
          const svg = button.querySelector('svg');
          if (svg) {
            svg.setAttribute('width', '20');
            svg.setAttribute('height', '20');
          }
        });
        styleDropdown.style.width = '140px';
        styleDropdown.style.padding = '8px';
        styleDropdown.querySelectorAll('div[style*="width: 64px"]').forEach((img: HTMLElement) => {
          img.style.width = '48px';
          img.style.height = '48px';
        });
        styleDropdownContainer.style.bottom = '46px';
        buttonContainer.style.gap = '8px';
      } else {
        buttons.forEach(button => {
          button.style.width = '40px';
          button.style.height = '40px';
          button.style.borderRadius = '12px';
          const svg = button.querySelector('svg');
          if (svg) {
            svg.setAttribute('width', '24');
            svg.setAttribute('height', '24');
          }
        });
        styleDropdown.style.width = '160px';
        styleDropdown.style.padding = '12px';
        styleDropdown.querySelectorAll('div[style*="width: 48px"]').forEach((img: HTMLElement) => {
          img.style.width = '64px';
          img.style.height = '64px';
        });
        styleDropdownContainer.style.bottom = '50px';
        buttonContainer.style.gap = '10px';
      }
    };
    handleButtonResize();
    window.addEventListener('resize', handleButtonResize);

    const applyMapStyle = async (styleIndex: number) => {
      if (!map) return;
      
      let sourceData = sourceCache.current;
      if (!sourceData) {
        sourceData = await getSource();
        sourceCache.current = sourceData;
      }

      const currentFilter = map.getLayer('selected-point')?.filter || ['==', 'imageId', ''];

      map.setStyle(mapStyles[styleIndex].url);
      map.once('style.load', () => {
        if (map) {
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
        // Update dropdown to highlight new style
        styleDropdown.querySelectorAll('div[style*="border"]').forEach((item: HTMLElement) => {
          item.style.border = 'none';
        });
        (styleDropdown.children[styleIndex + 1] as HTMLElement).style.border = '2px solid #05CB63';
      });
    };

    projectionButton.addEventListener('click', async () => {
      const newProjection = projection === 'mercator' ? 'globe' : 'mercator';
      setProjection(newProjection);
      if (map) {
        let sourceData = sourceCache.current;
        if (!sourceData) {
          sourceData = await getSource();
          sourceCache.current = sourceData;
        }

        const currentFilter = map.getLayer('selected-point')?.filter || ['==', 'imageId', ''];

        map.setProjection(newProjection);

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
      projectionButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 0 0-9.95 9.95A10 0 0 0 12 22a10 0 0 0 9.95-9.95A10 0 0 0 12 2z"></path>
          <path d="M12 2v20"></path>
          <path d="M2 12h20"></path>
        </svg>
      `;
    });

    locateButton.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      locateButton.disabled = true;
      locateButton.style.background = 'linear-gradient(135deg, #F0F0F0, #E0E0E0)';
      locateButton.style.borderColor = '#E0E0E0';
      locateButton.style.cursor = 'not-allowed';
      locateButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="4" fill="#333333"></circle>
        </svg>
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
          locateButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
          locateButton.style.borderColor = '#E0E0E0';
          locateButton.style.cursor = 'pointer';
          locateButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13 a9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          `;
        },
        (error) => {
          console.error('MapButtons: Geolocation error:', error);
          alert('Unable to retrieve your location. Please allow location access.');
          locateButton.disabled = false;
          locateButton.style.background = 'linear-gradient(135deg, #FFFFFF, #F5F5F5)';
          locateButton.style.borderColor = '#E0E0E0';
          locateButton.style.cursor = 'pointer';
          locateButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13 a9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          `;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    homeButton.addEventListener('click', () => {
      window.location.href = '/';
    });

    return () => {
      buttonContainer.remove();
      window.removeEventListener('resize', handleButtonResize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [map, currentStyleIndex, setCurrentStyleIndex, projection, setProjection, positionMarkerRef, container, sourceCache]);

  return null;
}