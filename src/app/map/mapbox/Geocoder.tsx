"use client";
import React, { useEffect } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { makeSpinnerLoader, makeErrorMessage, fetchImages, moveToWithRetry, calculateBboxFromRadius } from '../mapUtils';
import { MapContainerProps } from './types';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

interface GeocoderProps extends Omit<MapContainerProps, 'mapStyle'> {
  map: mapboxgl.Map | null;
  sourceCache: React.MutableRefObject<any>;
}

export default function Geocoder({ mapboxAccessToken, map, container, viewerRef, setImageId, positionMarkerRef, sourceCache }: GeocoderProps) {
  useEffect(() => {
    if (!map || !container) {
      console.warn('Geocoder: map or container is null, skipping initialization');
      return;
    }

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

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxAccessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search city, country, or coordinates...',
      types: 'place,country',
      clearOnBlur: true,
    });

    geocoderContainer.appendChild(geocoder.onAdd(map));

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

    geocoder.on('result', async (e) => {
      const { bbox, center } = e.result;
      const coords = bbox ? `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}` : calculateBboxFromRadius(center, 10);
      const viewerWrapper = container.querySelector('.viewer-wrapper');
      if (viewerWrapper && !viewerWrapper.querySelector('.spinner-loader')) {
        viewerWrapper.appendChild(makeSpinnerLoader());
      }
      try {
        const features = await fetchImages(coords, 50);
        const imageId = features[0]?.properties.imageId || `fallback-${coords}`;
        const newCoords = features[0]?.geometry.coordinates || center;
        const imagesSource = map.getSource('images') as mapboxgl.GeoJSONSource & { _data?: GeoJSON.FeatureCollection<GeoJSON.Geometry, any> };
        const currentData = imagesSource && imagesSource._data && Array.isArray(imagesSource._data.features)
          ? imagesSource._data.features
          : sourceCache.current?.data?.features || [];
        
        const newSourceData: GeoJSON.FeatureCollection<GeoJSON.Geometry, { [name: string]: any }> = {
          type: "FeatureCollection",
          features: [...currentData, ...features],
        };
        (map.getSource('images') as mapboxgl.GeoJSONSource).setData(newSourceData);
        sourceCache.current = { type: 'geojson', data: newSourceData, cluster: false, clusterMaxZoom: 12, clusterRadius: 30 };
        map.easeTo({ center: newCoords, zoom: 10 });
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

    return () => {
      if (container.contains(geocoderContainer)) {
        container.removeChild(geocoderContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [map, mapboxAccessToken, container, viewerRef, setImageId, positionMarkerRef, sourceCache]);

  return null;
}