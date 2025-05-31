"use client";
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { makeContainers, makeSpinnerLoader, makeErrorMessage, debounce, moveToWithRetry, getSource } from './mapUtils';
import GeocoderContainer from './mapbox/Geocoder';
import MapButtons from './mapbox/MapButtons';
import { MapContainerProps, MapStyle } from './mapbox/types';
import { mapStyles } from './mapbox/mapStyles';

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
        console.log('MapContainer: map initialized');

        mapRef.current.on('load', () => {
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

if (!mapRef.current!.getLayer('unclustered-point')) {
  mapRef.current!.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'images',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 4, // 4px at zoom 0
        10, 8, // 8px at zoom 10
        15, 12 // 12px at zoom 15
      ],
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 0.3, // 30% opacity at zoom 0
        10, 0.6, // 60% at zoom 10
        15, 0.8 // 80% at zoom 15
      ],
      'circle-color': '#05CB63', // Keep green
      'circle-stroke-color': '#FFFFFF', // White stroke for contrast
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
              'circle-radius': 10,
              'circle-color': 'rgba(148, 0, 211, 0.5)', // Lighter, more transparent purple
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2,
            },
            filter: ['==', 'imageId', ''],
          });
        }

          mapRef.current!.on('click', debounce(async (event: mapboxgl.MapMouseEvent) => {
            console.time('MapClick');
            try {
              const features = mapRef.current!.queryRenderedFeatures(event.point, {
                layers: ['unclustered-point'],
              });
              if (!features.length) {
                console.log('MapContainer: No features clicked');
                return;
              }
              const closest = features[0];
              const { imageId, sequence } = closest.properties; // Get sequence_key (named 'sequence' in getSource)
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

              // Update map: highlight selected point
              mapRef.current!.setFilter('selected-point', ['==', 'imageId', imageId]);
              mapRef.current!.easeTo({ center: coordinates });

              // Update viewer
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

              // Pass both imageId and sequenceKey to parent
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
          />
          <MapButtons
            map={mapRef.current}
            currentStyleIndex={currentStyleIndex}
            setCurrentStyleIndex={setCurrentStyleIndex}
            projection={projection}
            setProjection={setProjection}
            positionMarkerRef={positionMarkerRef}
            container={container}
          />
        </>
      )}
    </>
  );
}