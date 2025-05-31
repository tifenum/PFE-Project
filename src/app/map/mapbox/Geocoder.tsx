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

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxAccessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search city, country, or coords',
      types: 'place,country',
      clearOnBlur: true,
    });

    let geocoderHTMLElement: HTMLElement | null = null;
    let input: HTMLInputElement | null = null;

    map.addControl(geocoder, 'top-left');
    console.log('Geocoder: geocoder added');

    const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
    let handleResize = () => {};
    if (geocoderEl) {
      geocoderHTMLElement = geocoderEl as HTMLElement;
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

      input = geocoderEl.querySelector('input');
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

      handleResize = () => {
        if (window.innerWidth <= 600) {
          geocoderHTMLElement.style.width = '300px';
          geocoderHTMLElement.style.top = '10px';
          input && (input.style.fontSize = '14px');
          input && (input.style.padding = '10px 40px 10px 40px');
        } else {
          geocoderHTMLElement.style.width = '500px';
          geocoderHTMLElement.style.top = '10px';
          input && (input.style.fontSize = '16px');
          input && (input.style.padding = '12px 45px 12px 45px');
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      geocoder.on('result', async (e: any) => {
        console.log('Geocoder: Geocoder result', e.result);
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

        const viewerWrapper = container.querySelector('.viewer-wrapper');
        if (viewerWrapper && !viewerWrapper.querySelector('.spinner-loader')) {
          const indicator = makeSpinnerLoader();
          viewerWrapper.appendChild(indicator);
        }
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
          (map!.getSource('images') as mapboxgl.GeoJSONSource).setData(newSourceData);
          map!.easeTo({
            center: coordinates,
            zoom: 5,
          });
          setImageId({
            imageId: imageId || `fallback-${countryBbox}`,
            sequenceKey: features[0]?.properties.sequenceKey || ''
          });
          if (imageId && viewerRef.current && viewerRef.current.isInitialized) {
            await moveToWithRetry(viewerRef.current, imageId);
          } else {
            if (viewerWrapper) {
              viewerWrapper.querySelector('.spinner-loader')?.remove();
              const errorMsg = makeErrorMessage('No images found for this location.');
              viewerWrapper.appendChild(errorMsg);
              setTimeout(() => errorMsg.remove(), 3000);
            }
          }
        } catch (error) {
          console.error('Geocoder: Geocoder error:', error);
          if (viewerWrapper) {
            viewerWrapper.querySelector('.spinner-loader')?.remove();
            const errorMsg = makeErrorMessage('Failed to load images for this location.');
            viewerWrapper.appendChild(errorMsg);
            setTimeout(() => errorMsg.remove(), 3000);
          }
        }
      });

      geocoder.on('error', () => {
        console.error('Geocoder: Geocoder search failed');
        const viewerWrapper = container.querySelector('.viewer-wrapper');
        if (viewerWrapper) {
          viewerWrapper.querySelector('.spinner-loader')?.remove();
          const errorMsg = makeErrorMessage('Search failed. Please try a valid city, country, or coordinates.');
          viewerWrapper.appendChild(errorMsg);
          setTimeout(() => errorMsg.remove(), 3000);
        }
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        map.removeControl(geocoder);
      };
    } else {
      console.warn('Geocoder: geocoder element not found');
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map, mapboxAccessToken, container, viewerRef, setImageId]);

  return null;
}