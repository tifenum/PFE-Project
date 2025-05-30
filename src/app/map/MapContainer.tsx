import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { makeContainers, makeMapboxMarker, makeMessage, makeLoadingIndicator, debounce, moveToWithRetry, getSource, fetchImages } from './mapUtils';
import Geocoder from './mapbox/Geocoder';
import MapButtons from './mapbox/MapButtons';
import { MapContainerProps, MapStyle } from './mapbox/types';
import { mapStyles } from './mapbox/mapStyles';

export default function MapContainer({ mapboxAccessToken, mapStyle, container, viewerRef, positionMarkerRef, setImageId }: MapContainerProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const sourceCache = useRef<any>(null);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(() => {
    const index = mapStyles.findIndex(s => s.url === mapStyle);
    return index !== -1 ? index : 0;
  });
  const [projection, setProjection] = useState<'mercator' | 'globe'>('mercator');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!container || initializedRef.current) {
      console.warn('MapContainer: container is null or already initialized, skipping', { containerId: container, initialized: initializedRef.current });
      return;
    }

    const containers = makeContainers(container, 0);
    console.log('MapContainer: containers created:', containers);

    containers.map.style.position = 'absolute';
    containers.map.style.top = '0';
    containers.map.style.left = '0';
    containers.map.style.width = '100%';
    containers.map.style.height = '100vh';
    containers.map.style.zIndex = '10';
    console.log('MapContainer: map container size', {
      width: containers.map.offsetWidth,
      height: containers.map.offsetHeight
    });

    if (containers.map.offsetWidth === 0 || containers.map.offsetHeight === 0) {
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
          const message = makeMessage('No locations available.');
          container.appendChild(message);
          console.warn('MapContainer: no source features, showing message');
          return;
        }

        mapboxgl.accessToken = mapboxAccessToken;
        containers.map.innerHTML = '';
        if (mapRef.current) {
          mapRef.current.remove();
        }
        mapRef.current = new mapboxgl.Map({
          container: containers.map,
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
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 10, 12],
                'circle-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.7, 10, 0.5],
                'circle-color': '#05CB63',
                'circle-stroke-color': '#05cb63',
                'circle-stroke-width': 2,
              },
            });
          }

          mapRef.current!.on('click', debounce(async (event: mapboxgl.MapMouseEvent) => {
            console.time('MapClick');
            try {
              const features = mapRef.current!.queryRenderedFeatures(event.point, { layers: ['unclustered-point'] });
              if (!features.length) {
                console.log('MapContainer: No features clicked');
                return;
              }
              const closest = features[0];
              const { imageId } = closest.properties;
              const coordinates = (closest.geometry as GeoJSON.Point).coordinates as [number, number];

              if (!imageId || imageId.startsWith('fallback-')) {
                console.warn('MapContainer: Invalid or fallback imageId', closest.properties);
                alert('No valid image available for this point.');
                return;
              }

              const indicator = makeLoadingIndicator();
              container.appendChild(indicator);

              const updateMap = async () => {
                const newSourceData: GeoJSON.FeatureCollection = {
                  type: 'FeatureCollection',
                  features: [{
                    type: 'Feature',
                    properties: { imageId, thumbUrl: closest.properties.thumbUrl || '' },
                    geometry: { type: 'Point', coordinates },
                  }],
                };
                (mapRef.current!.getSource('images') as mapboxgl.GeoJSONSource).setData(newSourceData);
                mapRef.current!.easeTo({ center: coordinates, zoom: 12 });
              };

              await Promise.all([
                (async () => {
                  if (viewerRef.current?.isInitialized) {
                    const success = await moveToWithRetry(viewerRef.current, imageId, 1, 200);
                    if (success) {
                      setImageId(imageId);
                    } else {
                      alert('Failed to load image.');
                    }
                  } else {
                    console.warn('MapContainer: Viewer not initialized, setting imageId');
                    setImageId(imageId);
                  }
                })(),
                updateMap(),
              ]);

              container.querySelector('.loading-indicator')?.remove();
              console.timeEnd('MapClick');
            } catch (error) {
              console.error('MapContainer: Click handler error:', error);
              alert('Failed to load image.');
              container.querySelector('.loading-indicator')?.remove();
            }
          }, 50)); // Shorter debounce for responsiveness

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
  }, [mapboxAccessToken, container, viewerRef, positionMarkerRef, setImageId]);

  return (
    <>
      {isMapLoaded && (
        <>
          <Geocoder
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
