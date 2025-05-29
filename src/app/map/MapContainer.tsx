import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { makeContainers, makeMapboxMarker, makeMessage, makeLoadingIndicator, debounce, moveToWithRetry, getSource } from './mapUtils';

interface MapContainerProps {
  mapboxAccessToken: string;
  mapStyle: string;
  headerHeight: number;
  container: HTMLDivElement;
  viewerRef: React.MutableRefObject<any>;
  positionMarkerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  setSource: (source: any) => void;
}

const countryCoordinates = [
  { name: 'USA', coords: [-122.340955, 47.612389], bbox: '-122.36,47.61,-122.34,47.63' },
  { name: 'Brazil', coords: [-46.633309, -23.550520], bbox: '-46.65,-23.57,-46.61,-23.53' },
  { name: 'Japan', coords: [139.691706, 35.689487], bbox: '139.67,35.67,139.71,35.71' },
  { name: 'Australia', coords: [151.209295, -33.868820], bbox: '151.19,-33.88,151.23,-33.85' },
  { name: 'South Africa', coords: [28.047305, -26.204103], bbox: '28.02,-26.22,28.07,-26.18' },
];

const mapStyles = [
  { name: 'Streets', url: 'mapbox://styles/mapbox/streets-v11' },
  { name: 'Satellite with Labels', url: 'mapbox://styles/mapbox/satellite-streets-v11' },
];

export default function MapContainer({ mapboxAccessToken, mapStyle, headerHeight, container, viewerRef, positionMarkerRef, setSource }: MapContainerProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const sourceCache = useRef<any>(null);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(() => {
    const index = mapStyles.findIndex(s => s.url === mapStyle);
    return index !== -1 ? index : 0;
  });

  useEffect(() => {
    if (!container || initializedRef.current) return;

    const containers = makeContainers(container, headerHeight);
    containers.map.style.paddingTop = `${headerHeight}px`; // Respect header
    initializedRef.current = true;

    async function initializeMap() {
      let initialSource = sourceCache.current;
      if (!initialSource) {
        initialSource = await getSource();
        sourceCache.current = initialSource;
      }
      setSource(initialSource);
      const validFeature = initialSource.data.features.find((f: any) => !f.properties.imageId.startsWith('fallback-'));
      const initialImageId = validFeature ? validFeature.properties.imageId : null;
      if (!initialImageId) {
        const message = makeMessage('No images available. Please try again later.');
        container.appendChild(message);
        return;
      }

      mapboxgl.accessToken = mapboxAccessToken;
      containers.map.innerHTML = '';
      mapRef.current = new mapboxgl.Map({
        container: containers.map,
        style: mapStyle,
        zoom: 3,
        center: [0, 20],
      });

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxAccessToken,
        mapboxgl: mapboxgl,
        placeholder: 'Search city, country, or coords',
        types: 'place,country',
        clearOnBlur: true,
      });

      mapRef.current.addControl(geocoder, 'top-left');

      setTimeout(() => {
        const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
        if (geocoderEl) {
          const geocoderHTMLElement = geocoderEl as HTMLElement;
          geocoderHTMLElement.className = 'custom-geocoder';
          geocoderHTMLElement.style.position = 'absolute';
          geocoderHTMLElement.style.top = `${10 + headerHeight}px`;
          geocoderHTMLElement.style.left = '20px';
          geocoderHTMLElement.style.width = '500px';
          geocoderHTMLElement.style.maxWidth = 'calc(100% - 40px)';
          geocoderHTMLElement.style.backgroundColor = '#FFFFFF';
          geocoderHTMLElement.style.border = '2px solid #E0E0E0';
          geocoderHTMLElement.style.borderRadius = '8px';
          geocoderHTMLElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          geocoderHTMLElement.style.display = 'flex';
          geocoderHTMLElement.style.alignItems = 'center';
          geocoderHTMLElement.style.padding = '0 10px';
          geocoderHTMLElement.style.zIndex = '1010';
          geocoderHTMLElement.style.transition = 'all 0.2s ease';

          const input = geocoderEl.querySelector('input');
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

          const searchIcon = document.createElement('div');
          searchIcon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          `;
          searchIcon.style.position = 'absolute';
          searchIcon.style.left = '10px';
          searchIcon.style.pointerEvents = 'none';
          geocoderEl.insertBefore(searchIcon, input);

          const clearButton = document.createElement('button');
          clearButton.innerHTML = '×';
          clearButton.style.display = 'none';
          clearButton.style.background = 'none';
          clearButton.style.border = 'none';
          clearButton.style.color = '#666666';
          clearButton.style.fontSize = '18px';
          clearButton.style.cursor = 'pointer';
          clearButton.style.padding = '0 10px';
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

          const handleResize = () => {
            if (window.innerWidth <= 600) {
              geocoderHTMLElement.style.width = '300px';
              input.style.fontSize = '14px';
              input.style.padding = '10px 40px 10px 40px';
            } else {
              geocoderHTMLElement.style.width = '500px';
              input.style.fontSize = '16px';
              input.style.padding = '12px 45px 12px 45px';
            }
          };
          handleResize();
          window.addEventListener('resize', handleResize);

          return () => {
            window.removeEventListener('resize', handleResize);
          };
        }
      }, 0);

      positionMarkerRef.current = makeMapboxMarker(
        { radius: 8, color: '#f0f' },
        validFeature ? validFeature.properties.thumbUrl : ''
      );

      const buttonContainer = document.createElement('div');
      buttonContainer.style.position = 'absolute';
      buttonContainer.style.top = `${60 + headerHeight}px`;
      buttonContainer.style.right = '20px';
      buttonContainer.style.zIndex = '1010';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.gap = '8px';
      containers.map.appendChild(buttonContainer);
      console.log('buttonContainer appended:', buttonContainer, containers.map.contains(buttonContainer));

      try {
        const viewButton = document.createElement('button');
        viewButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          ${mapStyles[currentStyleIndex].name || 'Map View'}
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

        const locateButton = document.createElement('button');
        locateButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
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

        [viewButton, locateButton].forEach(button => {
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
            locateButton.style.padding = '6px 10px';
            locateButton.style.fontSize = '12px';
          } else {
            viewButton.style.padding = '8px 12px';
            viewButton.style.fontSize = '14px';
            locateButton.style.padding = '8px 12px';
            locateButton.style.fontSize = '14px';
          }
        };
        handleButtonResize();
        window.addEventListener('resize', handleButtonResize);

        viewButton.addEventListener('click', () => {
          const nextIndex = (currentStyleIndex + 1) % mapStyles.length;
          setCurrentStyleIndex(nextIndex);
          if (mapRef.current) {
            mapRef.current.setStyle(mapStyles[nextIndex].url);
            viewButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                <path d="M12 22C6.477 22 2 12 2 12s4.477-10 10-10 10 10 10 10-4.477 10-10 10z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              ${mapStyles[nextIndex].name}
            `;
          }
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
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Locating...
          `;
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { longitude, latitude } = position.coords;
              const bbox = `${longitude - 0.02},${latitude - 0.02},${longitude + 0.02},${latitude + 0.02}`;
              try {
                const newSource = await getSource(bbox);
                setSource(newSource);
                if (mapRef.current) {
                  (mapRef.current.getSource('images') as mapboxgl.GeoJSONSource).setData(newSource.data);
                  mapRef.current.easeTo({
                    center: [longitude, latitude],
                    zoom: 12,
                  });
                  if (newSource.data.features.length && !newSource.data.features[0].properties.imageId.startsWith('fallback-')) {
                    if (viewerRef.current && viewerRef.current.isInitialized) {
                      const indicator = makeLoadingIndicator();
                      container.appendChild(indicator);
                      await moveToWithRetry(viewerRef.current, newSource.data.features[0].properties.imageId);
                    }
                  } else {
                    alert('No images found near your location. Showing fallback marker.');
                  }
                }
              } catch (error) {
                console.error('Error fetching images for location:', error);
                alert('Failed to load images for your location.');
              } finally {
                locateButton.disabled = false;
                locateButton.style.backgroundColor = '#FFFFFF';
                locateButton.style.borderColor = '#E0E0E0';
                locateButton.style.cursor = 'pointer';
                locateButton.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Locate
                `;
              }
            },
            (error) => {
              console.error('Geolocation error:', error);
              alert('Unable to retrieve your location. Please allow location access.');
              locateButton.disabled = false;
              locateButton.style.backgroundColor = '#FFFFFF';
              locateButton.style.borderColor = '#E0E0E0';
              locateButton.style.cursor = 'pointer';
              locateButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Locate
              `;
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      } catch (error) {
        console.error('Error creating buttons:', error);
      }

      geocoder.on('result', async (e: any) => {
        if (!mapRef.current) return;

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
        } else {
          const [minLng, minLat, maxLng, maxLat] = countryBbox.split(',').map(Number);
          countryCenter = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
        }

        const newSource = await getSource(countryBbox);
        setSource(newSource);
        (mapRef.current.getSource('images') as mapboxgl.GeoJSONSource).setData(newSource.data);
        mapRef.current.easeTo({
          center: countryCenter,
          zoom: 5,
        });

        if (newSource.data.features.length && !newSource.data.features[0].properties.imageId.startsWith('fallback-')) {
          if (viewerRef.current && viewerRef.current.isInitialized) {
            const indicator = makeLoadingIndicator();
            container.appendChild(indicator);
            await moveToWithRetry(viewerRef.current, newSource.data.features[0].properties.imageId);
          } else {
            console.warn('Viewer not initialized during geocoder result');
          }
        } else {
          alert('No images found for this country. Showing fallback marker.');
        }
      });

      geocoder.on('error', () => {
        alert('Search failed. Please try a valid city, country, or coordinates.');
      });

      mapRef.current.on('load', () => {
        console.log('Map style loaded:', mapRef.current!.getStyle().name);
        mapRef.current!.addSource('images', initialSource);

        mapRef.current!.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'images',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
            'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
          }
        }, 'place_country');

        mapRef.current!.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'images',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        }, 'place_country');

        mapRef.current!.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'images',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 12,
            'circle-opacity': 0.5,
            'circle-color': '#05CB63',
            'circle-stroke-color': '#05cb63',
            'circle-stroke-width': 2,
          }
        }, 'place_city');

        initialSource.data.features.forEach((feature: any) => {
          const { imageId, thumbUrl } = feature.properties;
          const marker = makeMapboxMarker({ radius: 15, color: '#05CB63' }, thumbUrl);
          marker.setLngLat(feature.geometry.coordinates).addTo(mapRef.current!);
          marker.getElement().addEventListener('click', async () => {
            if (imageId.startsWith('fallback-')) {
              alert('This is a fallback marker. No images available for this location.');
              return;
            }
            if (viewerRef.current && viewerRef.current.isInitialized) {
              const indicator = makeLoadingIndicator();
              container.appendChild(indicator);
              await moveToWithRetry(viewerRef.current, imageId);
            } else {
              console.warn('Viewer not initialized on marker click');
            }
          });
        });

        mapRef.current!.on('click', debounce(async (event: mapboxgl.MapMouseEvent) => {
          try {
            const features = mapRef.current!.queryRenderedFeatures(event.point, { layers: ['clusters', 'unclustered-point'] });
            if (!features.length) return;
            const closest = features[0];
            const { imageId } = closest.properties;
            if (imageId && imageId.startsWith('fallback-')) {
              alert('This is a fallback marker. No images available for this location.');
              return;
            }
            if (imageId && viewerRef.current && viewerRef.current.isInitialized) {
              const indicator = makeLoadingIndicator();
              container.appendChild(indicator);
              await moveToWithRetry(viewerRef.current, imageId);
            } else {
              console.warn('Viewer not initialized on map click');
            }
          } catch (error) {
            console.error('Error in map click handler:', error);
            const indicator = container.querySelector('.loading-indicator');
            if (indicator) {
              container.removeChild(indicator);
            }
          }
        }, 300));

        mapRef.current!.on('click', 'clusters', (e: mapboxgl.MapMouseEvent) => {
          const features = mapRef.current!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0].properties.cluster_id;
          (mapRef.current!.getSource('images') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            mapRef.current!.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom
            });
          });
        });

        mapRef.current!.on('mouseenter', 'clusters', () => {
          mapRef.current!.getCanvas().style.cursor = 'pointer';
        });
        mapRef.current!.on('mouseleave', 'clusters', () => {
          mapRef.current!.getCanvas().style.cursor = 'grab';
        });

        mapRef.current!.getCanvas().style.cursor = 'grab';
      });

      return () => {
        buttonContainer.remove();
        window.removeEventListener('resize', handleButtonResize);
      };
    }

    initializeMap().catch(error => {
      console.error('Error initializing map:', error);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [mapboxAccessToken, mapStyle, headerHeight, container, viewerRef, positionMarkerRef, setSource]);

  return null;
}

function handleButtonResize(this: Window, ev: UIEvent) {
  throw new Error('Function not implemented.');
}
