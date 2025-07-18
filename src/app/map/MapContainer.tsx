"use client";
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { makeContainers, makeSpinnerLoader, makeErrorMessage, debounce, moveToWithRetry, getSource } from './mapUtils';
import GeocoderContainer from './mapbox/Geocoder';
import MapButtons from './mapbox/MapButtons';
import { MapContainerProps, MapStyle } from './mapbox/types';
import { mapStyles } from './mapbox/mapStyles';
import 'mapillary-js/dist/mapillary.css';

export default function MapContainer({
  mapboxAccessToken,
  mapStyle,
  container,
  viewerRef,
  positionMarkerRef,
  setImageId,
}: MapContainerProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const sourceCache = useRef<any>(null);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(() => {
    const index = mapStyles.findIndex((s: MapStyle) => s.url === mapStyle);
    return index !== -1 ? index : 0;
  });
  const [projection, setProjection] = useState<'mercator' | 'globe'>('mercator');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    console.log('MapContainer: Mounted');
    return () => {
      console.log('MapContainer: Unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('MapContainer: useEffect called');
    if (!container || initializedRef.current) {
      console.warn('MapContainer: container is null or already initialized, skipping', {
        initialized: initializedRef.current,
      });
      return;
    }

    const { map } = makeContainers(container, 0);
    console.log('MapContainer: containers created:', map);

    map.style.position = 'absolute';
    map.style.top = '0';
    map.style.left = '0';
    map.style.width = '100%';
    map.style.height = '100vh';
    map.style.zIndex = '10';
    console.log('MapContainer: map container size', {
      width: map.offsetWidth,
      height: map.offsetHeight,
    });

    if (map.offsetWidth === 0 || map.offsetHeight === 0) {
      console.error('MapContainer: map container has zero size, map will not render');
      return;
    }

    initializedRef.current = true;

    async function initializeMap() {
      console.log('MapContainer: initializeMap starting');
      try {
        let initialSource = sourceCache.current;
        if (!initialSource) {
          initialSource = await getSource();
          sourceCache.current = initialSource;
          console.log(`MapContainer: Initial source features: ${initialSource.data.features.length}`);
        }
        if (!initialSource.data.features.length) {
          const message = makeErrorMessage('No locations available.');
          container.appendChild(message);
          console.warn('MapContainer: no source features, showing message');
          return;
        }

        mapboxgl.accessToken = mapboxAccessToken;
        map.innerHTML = '';
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        mapRef.current = new mapboxgl.Map({
          container: map,
          style: mapStyles[currentStyleIndex].url,
          zoom: 2,
          center: [0, 20],
          minZoom: 1,
          projection: projection,
        });

        // Disable right-click drag rotation
        mapRef.current.dragRotate.disable();

        console.log('MapContainer: map initialized');

        mapRef.current!.on('load', () => {
          console.log('MapContainer: Map loaded');
          if (!mapRef.current!.getSource('images')) {
            mapRef.current!.addSource('images', initialSource);
          } else {
            (mapRef.current!.getSource('images') as mapboxgl.GeoJSONSource).setData(initialSource.data);
          }

          if (!mapRef.current!.getSource('place-labels')) {
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

          // Layer for initial points (green)
          if (!mapRef.current!.getLayer('initial-points')) {
            mapRef.current!.addLayer({
              id: 'initial-points',
              type: 'circle',
              source: 'images',
              filter: ['==', ['get', 'sourceType'], 'initial'],
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
                'circle-color': '#05CB63', // Green for initial points
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

          // Layer for search points (red)
          if (!mapRef.current!.getLayer('search-points')) {
            mapRef.current!.addLayer({
              id: 'search-points',
              type: 'circle',
              source: 'images',
              filter: ['==', ['get', 'sourceType'], 'search'],
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
                'circle-color': '#FF0000', // Red for search points
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

          if (!mapRef.current!.getLayer('selected-point')) {
            mapRef.current!.addLayer({
              id: 'selected-point',
              type: 'circle',
              source: 'images',
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 4,
                  10, 8,
                  15, 12
                ],
                'circle-color': 'rgba(148, 0, 211, 0.5)',
                'circle-stroke-color': '#FFFFFF',
                'circle-stroke-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, 1.5,
                  15, 2
                ],
              },
              filter: ['==', 'imageId', ''],
            });
          }
          // Add hover effect for both initial and search points
          mapRef.current!.on('mouseenter', ['initial-points', 'search-points'], () => {
            mapRef.current!.getCanvas().style.cursor = 'pointer';
          });
          mapRef.current!.on('mouseleave', ['initial-points', 'search-points'], () => {
            mapRef.current!.getCanvas().style.cursor = 'grab';
          });

          mapRef.current!.on('click', debounce(async (event: mapboxgl.MapMouseEvent) => {
            console.time('MapClick');
            try {
              const features = mapRef.current!.queryRenderedFeatures(event.point, {
                layers: ['initial-points', 'search-points'],
              });
              if (!features.length) {
                console.log('MapContainer: No features clicked');
                return;
              }
              const closest = features[0];
              const { imageId, sequence } = closest.properties;
              const coordinates = (closest.geometry as GeoJSON.Point).coordinates as [number, number];

              if (!imageId || imageId.startsWith('fallback-')) {
                console.warn('MapContainer: Invalid or fallback imageId', closest.properties);
                const viewerWrapper = container.querySelector('.viewer-wrapper');
                if (viewerWrapper) {
                  const errorMsg = makeErrorMessage('No valid image available for this point.');
                  viewerWrapper.appendChild(errorMsg);
                  setTimeout(() => errorMsg.remove(), 3000);
                }
                return;
              }

              mapRef.current!.setFilter('selected-point', ['==', 'imageId', imageId]);
              mapRef.current!.easeTo({ center: coordinates });

              if (viewerRef.current?.isInitialized) {
                const viewerWrapper = container.querySelector('.viewer-wrapper') as HTMLDivElement | null;
                if (viewerWrapper && !viewerWrapper.querySelector('.spinner-loader')) {
                  const indicator = makeSpinnerLoader();
                  viewerWrapper.appendChild(indicator);
                }
                const result = await moveToWithRetry(viewerRef.current, imageId, 3, 500, false, viewerWrapper);
                if (!result.success) {
                  console.warn('MapContainer: Failed to load image', imageId, result.error);
                  if (viewerWrapper) {
                    viewerWrapper.querySelector('.spinner-loader')?.remove();
                    const errorMsg = makeErrorMessage(`Failed to load image: ${result.error}`);
                    viewerWrapper.appendChild(errorMsg);
                    setTimeout(() => errorMsg.remove(), 3000);
                  }
                  if (result.fallbackImageId) {
                    const fallbackResult = await moveToWithRetry(
                      viewerRef.current,
                      result.fallbackImageId,
                      3,
                      500,
                      false,
                      viewerWrapper
                    );
                    if (!fallbackResult.success) {
                      alert('Failed to load fallback image.');
                    }
                  } else {
                    alert('Failed to load image.');
                  }
                }
              }

              setImageId({ imageId, sequenceKey: sequence || '' });

              console.timeEnd('MapClick');
            } catch (error) {
              console.error('MapContainer: Click handler error:', error);
              const viewerWrapper = container.querySelector('.viewer-wrapper');
              if (viewerWrapper) {
                viewerWrapper.querySelector('.spinner-loader')?.remove();
                const errorMsg = makeErrorMessage('Failed to load image.');
                viewerWrapper.appendChild(errorMsg);
                setTimeout(() => errorMsg.remove(), 3000);
              }
            }
          }, 50));

          mapRef.current!.getCanvas().style.cursor = 'grab';
          setIsMapLoaded(true);
        });
      } catch (error) {
        console.error('MapContainer: initializeMap error:', error);
      }
    }

    initializeMap().catch(error => {
      console.error('MapContainer: Error initializing map:', error);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializedRef.current = false;
      sourceCache.current = null;
      console.log('MapContainer: Cleanup complete');
    };
  }, [mapboxAccessToken, mapStyle, container]);

  return (
    <>
      {isMapLoaded && (
        <>
          <GeocoderContainer
            mapboxAccessToken={mapboxAccessToken}
            map={mapRef.current}
            container={container}
            viewerRef={viewerRef}
            setImageId={setImageId}
            positionMarkerRef={positionMarkerRef}
            sourceCache={sourceCache} // Pass sourceCache to Geocoder
          />
          <MapButtons
            map={mapRef.current}
            currentStyleIndex={currentStyleIndex}
            setCurrentStyleIndex={setCurrentStyleIndex}
            projection={projection}
            setProjection={setProjection}
            positionMarkerRef={positionMarkerRef}
            container={container}
            sourceCache={sourceCache}
          />
        </>
      )}
    </>
  );
}