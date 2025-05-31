"use client";
import React, { useEffect } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { makeSpinnerLoader, makeErrorMessage, fetchImages, moveToWithRetry } from '../mapUtils';
import { MapContainerProps } from './types';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

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
    geocoderContainer.style.zIndex = '1010';
    geocoderContainer.style.width = '300px';
    geocoderContainer.style.maxWidth = 'calc(100% - 30px)';
    geocoderContainer.style.background = '#fff';
    geocoderContainer.style.border = '1px solid #ccc';
    geocoderContainer.style.borderRadius = '8px';
    geocoderContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    geocoderContainer.style.padding = '5px';
    container.appendChild(geocoderContainer);

    // Initialize Mapbox geocoder with minimal configuration
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxAccessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search city, country, or coordinates...',
      types: 'place,country',
      clearOnBlur: true,
    });

    // Add geocoder to container
    geocoderContainer.appendChild(geocoder.onAdd(map));

    // Add minimal CSS to fix suggestion text and style the form
    const style = document.createElement('style');
    style.innerHTML = `
      .mapboxgl-ctrl-geocoder {
        width: 100%;
        border: none;
        box-shadow: none;
        background: transparent;
      }
      .mapboxgl-ctrl-geocoder--input {
        width: 100%;
        padding-left: 30px;
        border: none;
        outline: none;
        font-size: 14px;
        font-family: 'Arial', sans-serif;
        background: transparent;
      }
      .mapboxgl-ctrl-geocoder--icon-search {
        position: absolute;
        top: 50%;
        left: 8px;
        transform: translateY(-50%);
        fill: #05CB63;
      }
      .mapboxgl-ctrl-geocoder--suggestion-title,
      .mapboxgl-ctrl-geocoder--suggestion-address {
        color: #000 !important;
        font-size: 14px !important;
      }
      .suggestions {
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1011;
      }
      .mapboxgl-ctrl-geocoder--suggestion {
        padding: 8px 12px;
      }
      .mapboxgl-ctrl-geocoder--suggestion:hover {
        background: #f0f0f0;
      }
    `;
    document.head.appendChild(style);

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
        const newSourceData: GeoJSON.FeatureCollection<GeoJSON.Geometry, { [name: string]: any }> = {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: { imageId, thumbUrl: features[0]?.properties.thumbUrl || "" },
            geometry: { type: "Point", coordinates: newCoords },
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

    // Cleanup
    return () => {
      if (container.contains(geocoderContainer)) {
        container.removeChild(geocoderContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [map, mapboxAccessToken, container, viewerRef, setImageId]);

  return null;
}