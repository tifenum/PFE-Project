"use client";
import React, { useEffect } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { makeSpinnerLoader, makeErrorMessage, fetchImages, moveToWithRetry } from '../mapUtils';
import countryCoordinates from '../countryCoordinates';
import { MapContainerProps } from './types';

interface GeocoderProps extends Omit<MapContainerProps, 'mapStyle'> {
  map: mapboxgl.Map | null;
}

export default function Geocoder({ mapboxAccessToken, map, container, viewerRef, setImageId }: GeocoderProps) {
  useEffect(() => {
    if (!map || !container) {
      console.warn('Geocoder: map or container is null, skipping initialization');
      return;
    }

    // Create a container for the search bar
    const geocoderContainer = document.createElement('div');
    geocoderContainer.id = 'geocoder';
    geocoderContainer.style.position = 'absolute';
    geocoderContainer.style.top = '15px';
    geocoderContainer.style.left = '15px';
    geocoderContainer.style.width = '600px';
    geocoderContainer.style.maxWidth = 'calc(100% - 30px)';
    geocoderContainer.style.zIndex = '1010';
    container.appendChild(geocoderContainer);

    // Initialize Mapbox geocoder
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxAccessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search city, country, or coordinates...',
      types: 'place,country',
      clearOnBlur: true,
      render: (item) => {
        const el = document.createElement('div');
        el.className = 'mapboxgl-ctrl-geocoder--suggestion';
        el.innerHTML = `<span>${item.place_name}</span>`;
        return el;
      },
    });

    // Add geocoder to container
    geocoderContainer.appendChild(geocoder.onAdd(map));

    // Debounce to avoid spamming searches
    function debounce(fn, wait) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
      };
    }

    // Style the search bar
    const geocoderEl = document.querySelector('#geocoder');
    let input = null;
    let handleResize = () => {};
    if (geocoderEl) {
      const box = geocoderEl as HTMLElement;
      box.className = 'custom-geocoder';
      box.style.background = 'linear-gradient(145deg, #FFFFFF, #F5F5F5)';
      box.style.border = '1px solid transparent';
      box.style.borderRadius = '12px';
      box.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.padding = '8px 16px';
      box.style.transition = 'all 0.3s ease';

      input = geocoderEl.querySelector('input');
      if (input) {
        input.className = 'mapboxgl-ctrl-geocoder--input';
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.width = '100%';
        input.style.padding = '14px 50px';
        input.style.fontSize = '18px';
        input.style.fontFamily = '"Inter", Arial, sans-serif';
        input.style.color = '#222222';
        input.style.background = 'transparent';
        input.style.borderRadius = '8px';
      }

      // Add green search icon
      const searchIcon = geocoderEl.querySelector('.mapboxgl-ctrl-geocoder--icon-search');
      if (searchIcon) {
        searchIcon.outerHTML = `
          <svg class="custom-search-icon" viewBox="0 0 24 24" width="24" height="24" style="margin-right: 8px;">
            <path fill="#05CB63" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        `;
      }

      // Fix loading icon (use setAttribute for SVG)
      const loadingIcon = geocoderEl.querySelector('.mapboxgl-ctrl-geocoder--icon-loading');
      if (loadingIcon) {
        loadingIcon.setAttribute('class', 'custom-loading-icon');
        loadingIcon.setAttribute('style', 'display: none;');
      }

      // Hide clear button by default
      const clearButton = geocoderEl.querySelector('.mapboxgl-ctrl-geocoder--button');
      if (clearButton) {
        (clearButton as HTMLElement).style.display = 'none';
      }

      // Add CSS for effects and clear button visibility
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .custom-loading-icon {
          animation: spin 1s linear infinite;
        }
        .custom-geocoder:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        .custom-geocoder:focus-within {
          border-color: #05CB63;
          box-shadow: 0 4px 20px rgba(5,203,99,0.4);
        }
        .mapboxgl-ctrl-geocoder--input:not(:placeholder-shown) ~ .mapboxgl-ctrl-geocoder--pin-right .mapboxgl-ctrl-geocoder--button {
          display: block !important;
        }
      `;
      document.head.appendChild(style);

      if (input) {
        const slowSearch = debounce(() => {
          if (clearButton) {
            (clearButton as HTMLElement).style.display = input.value ? 'block' : 'none';
          }
          geocoder.query(input.value);
        }, 300);
        input.addEventListener('input', slowSearch);
        input.addEventListener('focus', () => {
          box.style.borderColor = '#05CB63';
          box.style.boxShadow = '0 4px 20px rgba(5,203,99,0.4)';
        });
        input.addEventListener('blur', () => {
          box.style.borderColor = 'transparent';
          box.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        });
        if (clearButton) {
          clearButton.addEventListener('click', () => {
            input.value = '';
            (clearButton as HTMLElement).style.display = 'none';
            geocoder.clear();
            input.focus();
          });
        }
      }

      // Style suggestions dropdown
      const suggestions = geocoderEl.querySelector('.suggestions');
      if (suggestions) {
        const suggestionsEl = suggestions as HTMLElement;
        suggestionsEl.style.position = 'absolute';
        suggestionsEl.style.top = '100%';
        suggestionsEl.style.left = '0';
        suggestionsEl.style.width = '100%';
        suggestionsEl.style.maxHeight = '500px';
        suggestionsEl.style.overflowY = 'auto';
        suggestionsEl.style.background = 'linear-gradient(#FFFFFF, #FAFAFA)';
        suggestionsEl.style.border = '1px solid #E0E0E0';
        suggestionsEl.style.borderRadius = '8px';
        suggestionsEl.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        suggestionsEl.style.padding = '12px 0';
        suggestionsEl.style.zIndex = '1011';
        suggestionsEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        suggestionsEl.style.transform = 'translateY(8px)';
        suggestionsEl.style.opacity = '0';
        suggestionsEl.style.pointerEvents = 'none';

        // Animate dropdown
        const observer = new MutationObserver(() => {
          if (suggestionsEl.style.display !== 'none') {
            suggestionsEl.style.opacity = '1';
            suggestionsEl.style.transform = 'translateY(4px)';
            suggestionsEl.style.pointerEvents = 'auto';
          } else {
            suggestionsEl.style.opacity = '0';
            suggestionsEl.style.transform = 'translateY(8px)';
            suggestionsEl.style.pointerEvents = 'none';
          }
        });
        observer.observe(suggestionsEl, { attributes: true, attributeFilter: ['style'] });
      }

      // Style suggestion items
      const suggestionItems = geocoderEl.querySelectorAll('.mapboxgl-ctrl-geocoder--suggestion');
      suggestionItems.forEach((item) => {
        const el = item as HTMLElement;
        el.style.padding = '12px 16px';
        el.style.cursor = 'pointer';
        el.style.transition = 'background-color 0.2s ease';
        el.addEventListener('mouseenter', () => {
          el.style.backgroundColor = '#E8F7EE';
        });
        el.addEventListener('mouseleave', () => {
          el.style.backgroundColor = 'transparent';
        });
      });

      // Responsive resizing
      handleResize = () => {
        if (window.innerWidth <= 600) {
          box.style.width = '90%';
          box.style.left = '5%';
          input && (input.style.fontSize = '16px');
          input && (input.style.padding = '12px 40px');
        } else {
          box.style.width = '600px';
          box.style.left = '15px';
          input && (input.style.fontSize = '18px');
          input && (input.style.padding = '14px 50px');
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      // Handle search results
      geocoder.on('result', async (e) => {
        const { bbox, center } = e.result;
        const coords = bbox ? `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}` : `${center[0] - 0.02},${center[1] - 0.02},${center[0] + 0.02},${center[1] + 0.02}`;
        const viewerWrapper = container.querySelector('.viewer-wrapper');
        if (viewerWrapper && !viewerWrapper.querySelector('.spinner-loader')) {
          viewerWrapper.appendChild(makeSpinnerLoader());
        }
        try {
          const features = await fetchImages(coords, 1);
          const imageId = features[0]?.properties.imageId || `fallback-${coords}`;
          const newCoords = features[0]?.geometry.coordinates || center;
          const newSourceData = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: { imageId, thumbUrl: features[0]?.properties.thumbUrl || '' },
              geometry: { type: 'Point', coordinates: newCoords },
            }],
          };
          (map.getSource('images') as mapboxgl.GeoJSONSource).setData(newSourceData);
          map.easeTo({ center: newCoords, zoom: 5 });
          setImageId({ imageId, sequenceKey: features[0]?.properties.sequenceKey || '' });
          if (viewerRef.current && imageId && !imageId.startsWith('fallback-')) {
            await moveToWithRetry(viewerRef.current, imageId);
          } else if (viewerWrapper) {
            viewerWrapper.querySelector('.spinner-loader')?.remove();
            const errorMsg = makeErrorMessage('No images found for this location.');
            viewerWrapper.appendChild(errorMsg);
            setTimeout(() => errorMsg.remove(), 3000);
          }
        } catch (error) {
          console.error('Geocoder: Error fetching images:', error);
          if (viewerWrapper) {
            viewerWrapper.querySelector('.spinner-loader')?.remove();
            const errorMsg = makeErrorMessage('Failed to load images.');
            viewerWrapper.appendChild(errorMsg);
            setTimeout(() => errorMsg.remove(), 3000);
          }
        }
      });

      // Handle search errors
      geocoder.on('error', () => {
        console.error('Geocoder: Search failed');
        const viewerWrapper = container.querySelector('.viewer-wrapper');
        if (viewerWrapper) {
          viewerWrapper.querySelector('.spinner-loader')?.remove();
          const errorMsg = makeErrorMessage('Search failed. Try again.');
          viewerWrapper.appendChild(errorMsg);
          setTimeout(() => errorMsg.remove(), 3000);
        }
      });

      // Show/hide loading icon during queries
      geocoder.on('loading', () => {
        if (loadingIcon) {
          loadingIcon.setAttribute('style', 'display: block;');
        }
      });
      geocoder.on('results', () => {
        if (loadingIcon) {
          loadingIcon.setAttribute('style', 'display: none;');
        }
      });
      geocoder.on('clear', () => {
        if (loadingIcon) {
          loadingIcon.setAttribute('style', 'display: none;');
        }
      });

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (container.contains(geocoderContainer)) {
          container.removeChild(geocoderContainer);
        }
      };
    }
  }, [map, mapboxAccessToken, container, viewerRef, setImageId]);

  return null;
}