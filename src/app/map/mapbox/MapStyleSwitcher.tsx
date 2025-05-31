import React, { useEffect, useRef } from 'react';
import { mapStyles } from './mapStyles';
import mapboxgl from 'mapbox-gl';
// import "mapbox-gl-style-switcher/styles.css";

interface MapStyleSwitcherProps {
  map: mapboxgl.Map | null;
  currentStyleIndex: number;
  setCurrentStyleIndex: (index: number) => void;
  container: HTMLDivElement | null;
}

export default function MapStyleSwitcher({
  map,
  currentStyleIndex,
  setCurrentStyleIndex,
  container,
}: MapStyleSwitcherProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map || !container) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'relative';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.zIndex = '1010';

    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
        <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      ${mapStyles[currentStyleIndex].name}
    `;
    toggleButton.style.display = 'flex';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.padding = '8px 12px';
    toggleButton.style.backgroundColor = '#FFFFFF';
    toggleButton.style.color = '#333333';
    toggleButton.style.border = '2px solid #E0E0E0';
    toggleButton.style.borderRadius = '8px';
    toggleButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = '14px';
    toggleButton.style.fontFamily = 'Arial, sans-serif';
    toggleButton.style.transition = 'all 0.2s ease';
    toggleButton.title = 'Select map style';
    buttonContainer.appendChild(toggleButton);

    const dropdown = document.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.right = '0';
    dropdown.style.backgroundColor = '#FFFFFF';
    dropdown.style.border = '1px solid #E0E0E0';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    dropdown.style.display = 'none';
    dropdown.style.zIndex = '1011';
    dropdown.style.marginTop = '4px';
    dropdownRef.current = dropdown;

    mapStyles.forEach((style, index) => {
      const option = document.createElement('div');
      option.innerHTML = style.name;
      option.style.padding = '8px 12px';
      option.style.cursor = 'pointer';
      option.style.fontSize = '14px';
      option.style.fontFamily = 'Arial, sans-serif';
      option.style.color = '#333333';
      option.style.transition = 'background-color 0.2s ease';
      option.addEventListener('mouseenter', () => {
        option.style.backgroundColor = '#F0F0F0';
      });
      option.addEventListener('mouseleave', () => {
        option.style.backgroundColor = '#FFFFFF';
      });
      option.addEventListener('click', () => {
        setCurrentStyleIndex(index);
        toggleButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          ${style.name}
        `;
        dropdown.style.display = 'none';
        applyMapStyle(index);
      });
      dropdown.appendChild(option);
    });

    buttonContainer.appendChild(dropdown);
    container.appendChild(buttonContainer);

    const applyMapStyle = (styleIndex: number) => {
      if (!map) return;
      map.setStyle(mapStyles[styleIndex].url);
      map.once('style.load', () => {
        if (map) {
          map.addSource('images', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });
          map.addLayer({
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
        }
      });
    };

    toggleButton.addEventListener('click', () => {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !buttonContainer.contains(event.target as Node)) {
        dropdown.style.display = 'none';
      }
    };
    document.addEventListener('click', handleClickOutside);

    // Hover effects
    toggleButton.addEventListener('mouseenter', () => {
      toggleButton.style.borderColor = '#05CB63';
      toggleButton.style.transform = 'scale(1.05)';
      toggleButton.style.boxShadow = '0 4px 12px rgba(5,203,99,0.3)';
    });
    toggleButton.addEventListener('mouseleave', () => {
      toggleButton.style.borderColor = '#E0E0E0';
      toggleButton.style.transform = 'scale(1)';
      toggleButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    return () => {
      buttonContainer.remove();
      document.removeEventListener('click', handleClickOutside);
    };
  }, [map, currentStyleIndex, setCurrentStyleIndex, container]);

  return null;
}