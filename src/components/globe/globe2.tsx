"use client";
import { useRef, useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import * as turf from '@turf/turf';

const texture = "/globe/land4.png";

const Global = ({ 
  origin, 
  destination, 
  onCountrySelect 
}: {
  origin: string;
  destination: string;
  onCountrySelect: (type: 'origin' | 'destination', country: any) => void;
}) => {  
  const { theme } = useTheme();
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [fromCountry, setFromCountry] = useState(null);
  const [destinationCountry, setDestinationCountry] = useState(null);
  const [globeData, setGlobeData] = useState({ countries: { features: [] }, points: { features: [] } });
  const [loading, setLoading] = useState(true);
  const [arcData, setArcData] = useState([]);
  const globeRef = useRef(null);

  const defaultMaterial = useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#49ac8f',
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);

  const fromMaterial = useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#ffd700',
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);

  const destinationMaterial = useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#ff0000',
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);

  // Dynamic background color based on theme
  const backgroundColor = theme === 'dark' ? '#1e232e' : '#f3f4f6';

  const getCountryCenter = (feature: any) => {
    const centroid = turf.centroid(feature);
    if (feature.properties.ADMIN === 'France') {
      return [2.2137, 46.2276]; 
    }
    return centroid.geometry.coordinates;
  };

  const min = 1000;
  const max = 4000;

  useEffect(() => {
    const findCountry = (name: string) => {
      return globeData.countries.features.find(
        (country: any) => country.properties.ADMIN === name
      );
    };

    if (origin) {
      const country = findCountry(origin);
      if (country) setFromCountry(country);
    }
    
    if (destination) {
      const country = findCountry(destination);
      if (country) setDestinationCountry(country);
    }
  }, [origin, destination, globeData.countries.features]);

  const countriesRef = useRef({ from: fromCountry, destination: destinationCountry });

  useEffect(() => {
    countriesRef.current = { from: fromCountry, destination: destinationCountry };
  }, [fromCountry, destinationCountry]);

  useEffect(() => {
    const { from, destination } = countriesRef.current;
    
    if (!from && !destination) return;

    if (from && !destination) {
      const start = getCountryCenter(from);
      globeRef.current.pointOfView({
        lat: start[1],
        lng: start[0],
        altitude: 1.8
      }, 1000);
    } else if (from && destination) {
      const start = getCountryCenter(from);
      const end = getCountryCenter(destination);
      globeRef.current.pointOfView({
        lat: (start[1] + end[1]) / 2,
        lng: (start[0] + end[0]) / 2,
        altitude: 1.8
      }, 2000);
    }
  }, [fromCountry, destinationCountry]);

  const updateArc = () => {
    const { from, destination } = countriesRef.current;
    if (!from || !destination) return;

    const start = getCountryCenter(from);
    const end = getCountryCenter(destination);
    const randTime = Math.floor(Math.random() * (max - min + 1) + min);

    setArcData([{
      startLat: start[1], 
      startLng: start[0], 
      endLat: end[1],    
      endLng: end[0],    
      color: ['#ffffff00', '#faf7e6', '#ffffff00'],
      time: randTime,
      stroke: 5
    }]);
  };

  useEffect(() => {
    updateArc();
  }, [fromCountry, destinationCountry]);

  const handleCountrySelect = (country: any) => {
    if (!country || !globeRef.current) return;

    const type = !fromCountry ? 'origin' : 'destination';
    
    if (type === 'origin') {
      setFromCountry(country);
    } else {
      setDestinationCountry(country);
    }
    
    onCountrySelect(type, country);
  };

  useEffect(() => {
    if (fromCountry && destinationCountry) {
      updateArc();
    }
  }, [fromCountry, destinationCountry]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        fetch("https://raw.githubusercontent.com/iamanas20/geojson/main/map11.geojson")
          .then((res) => res.json())
          .then(function (res) {
            setGlobeData({
              countries: res[0],
              points: res[1]
            });
          });
      } catch (error) {
        console.error(error.message);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const globeReady = () => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().enableZoom = false;
      globeRef.current.pointOfView({
        lat: 19.054339351561637,
        lng: -50.421161072148465,
        altitude: 1.8,
      });
    }
  };

  return (
    <div className="relative z-10 overflow-hidden">
      <div className="cursor-pointer">
        <Globe
          width={900}
          height={700}
          globeOffset={[0, 0]}
          ref={globeRef}
          onGlobeReady={globeReady}
          backgroundColor={backgroundColor}
          rendererConfig={{ antialias: true, alpha: true }}
          globeMaterial={new THREE.MeshPhongMaterial({
            color: '#1a2033',
            opacity: 0.95,
          })}
          atmosphereColor='#5784a7'
          atmosphereAltitude={0.23}
          pointsMerge={true}
          pointAltitude={0.01}
          pointRadius={0.2}
          pointResolution={5}
          pointColor={() => '#eed31f'}
          polygonsData={globeData.countries.features}
          polygonSideColor={() => '#00000000'}
          polygonStrokeColor={() => "rgba(0, 100, 0, 0.15)"}
          onPolygonClick={handleCountrySelect}
          onPolygonHover={(d: any) => {
            setHoveredCountry(d);
            if (globeRef.current) {
              globeRef.current.controls().autoRotate = !d;
            }
          }}
          polygonCapMaterial={(d: any) => {
            if (d === fromCountry) return fromMaterial;
            if (d === destinationCountry) return destinationMaterial;
            return d === hoveredCountry ? fromMaterial : defaultMaterial;
          }}
          arcsData={arcData}
          arcColor={'color'}
          arcDashAnimateTime={() => Math.random() * 4000 + 500}
          arcDashLength={1}
          arcDashGap={0} 
          customLayerData={[...Array(500).keys()].map(() => ({
            lat: (Math.random() - 1) * 360,
            lng: (Math.random() - 1) * 360,
            altitude: Math.random() * 2,
            size: Math.random() * 0.4,
            color: '#faadfd',
          }))}
          customThreeObject={(sliceData: any) => {
            const { size, color } = sliceData;
            return new THREE.Mesh(new THREE.SphereGeometry(size), new THREE.MeshBasicMaterial({ color }));
          }}
        />
      </div>
    </div>
  );
};

export default Global;