"use client";
import { useRef } from 'react';
import React from "react";
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import number from "numeral";
import * as turf from '@turf/turf';
import chroma from 'chroma-js';
import { freemem } from 'os';

const texture = "/globe/land4.png";

// const min = 1000;
// const max = 4000;
// const sliceData = pointsData.sort(() => (Math.random() > 0.5 ? 1 : -1)).slice(20, 90);

// const arcsData = sliceData.map(() => {
//   const randStart = Math.floor(Math.random() * sliceData.length);
//   const randEnd = Math.floor(Math.random() * sliceData.length);
//   const randTime = Math.floor(Math.random() * (max - min + 1) + min);
//   return {
//     startLat: sliceData[randStart].lat,
//     startLng: sliceData[randStart].lng,
//     endLat: sliceData[randEnd].lat,
//     endLng: sliceData[randEnd].lng,
//     time: randTime,
//     color: ['#ffffff00', '#faf7e6', '#ffffff00'],
//   };
// });

const global = () => {
  const [hoveredCountry, setHoveredCountry] = React.useState(null);
  const [fromCountry, setFromCountry] = React.useState(null);
  const [destinationCountry, setDestinationCountry] = React.useState(null);
  const [activeInput, setActiveInput] = React.useState('from');
  const [fromSearchTerm, setFromSearchTerm] = React.useState('');
  const [fromFilteredCountries, setFromFilteredCountries] = React.useState([]);
  const [destinationSearchTerm, setDestinationSearchTerm] = React.useState('');
  const [destinationFilteredCountries, setDestinationFilteredCountries] = React.useState([]);
  const [globeData, setGlobeData] = React.useState({ countries: { features: [] }, points: { features: [] } });
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [arcData, setArcData] = React.useState([]);

  const globeRef = useRef(null);
  const colorScale = chroma.scale(["red", "yellow"]);

  // Materials
  const defaultMaterial = React.useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#49ac8f',
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);

  const fromMaterial = React.useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#ffd700',
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);

  const destinationMaterial = React.useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#ff0000',
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);

  const getCountryCenter = (feature) => {
    const centroid = turf.centroid(feature);
    if (feature.properties.ADMIN === 'France') {
      console.log('Using static coordinates for France');
      return [2.2137, 46.2276]; // [lng, lat]
    }
  
    return centroid.geometry.coordinates;
  };
  const min = 1000;
  const max = 4000;
  React.useEffect(() => {
    if (fromCountry && destinationCountry) {
      const startCoords = getCountryCenter(fromCountry);
      const endCoords = getCountryCenter(destinationCountry);
      const randTime = Math.floor(Math.random() * (max - min + 1) + min);
      // Turf returns [lng, lat], we need to swap for globe.gl
      console.log('startCoords:', startCoords);
      console.log('endCoords:', endCoords);
      setArcData([{
        startLat: startCoords[1], // lat
        startLng: startCoords[0], // lng
        endLat: endCoords[1],     // lat
        endLng: endCoords[0],     // lng
        color: ['#ffffff00', '#faf7e6', '#ffffff00'],
        time: randTime,
        stroke: 5
      }]);
    } else {
      setArcData([]);
    }
  }, [fromCountry, destinationCountry]);
  const handleCountrySelect = (country) => {
    if (!country || !globeRef.current) return;

    const centroid = getCountryCenter(country);
    if (activeInput === 'from') {
      setFromCountry(country);
      setFromSearchTerm('');
      setFromFilteredCountries([]);
    } else {
      setDestinationCountry(country);
      setDestinationSearchTerm('');
      setDestinationFilteredCountries([]);
    }

    globeRef.current.pointOfView({
      lat: centroid[1],
      lng: centroid[0],
      altitude: 1.8
    }, 1000);
  };

  const handleFromSearch = (e) => {
    const term = e.target.value;
    setFromSearchTerm(term);
    if (term.length > 0) {
      const filtered = globeData.countries.features.filter(country => 
        country.properties.ADMIN.toLowerCase().includes(term.toLowerCase())
      );
      setFromFilteredCountries(filtered);
    } else {
      setFromFilteredCountries([]);
    }
  };

  const handleDestinationSearch = (e) => {
    const term = e.target.value;
    setDestinationSearchTerm(term);
    if (term.length > 0) {
      const filtered = globeData.countries.features.filter(country => 
        country.properties.ADMIN.toLowerCase().includes(term.toLowerCase())
      );
      setDestinationFilteredCountries(filtered);
    } else {
      setDestinationFilteredCountries([]);
    }
  };

  React.useEffect(() => {
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
    <div className="relative z-10 overflow-hidden bg-white pb-16 pt-[120px] dark:bg-gray-dark md:pb-[120px] md:pt-[150px] xl:pb-[160px] xl:pt-[180px] 2xl:pb-[200px] 2xl:pt-[210px]">
      <div className="absolute left-4 z-20 w-64 space-y-4" style={{ transform: 'translateZ(100px)' }}>
        <div>
          <input
            type="text"
            placeholder="From country..."
            value={fromSearchTerm}
            onChange={handleFromSearch}
            onFocus={() => setActiveInput('from')}
            className="w-full p-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fromFilteredCountries.length > 0 && (
            <div className="mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
              {fromFilteredCountries.map((country, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCountrySelect(country)}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {country.properties.ADMIN}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="Destination country..."
            value={destinationSearchTerm}
            onChange={handleDestinationSearch}
            onFocus={() => setActiveInput('destination')}
            className="w-full p-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {destinationFilteredCountries.length > 0 && (
            <div className="mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
              {destinationFilteredCountries.map((country, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCountrySelect(country)}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {country.properties.ADMIN}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='cursor-pointer'>
        <Globe
          ref={globeRef}
          onGlobeReady={globeReady}
          backgroundColor='#1e232e'
          rendererConfig={{ antialias: true, alpha: true }}
          globeMaterial={new THREE.MeshPhongMaterial({
            color: '#1a2033',
            opacity: 0.95,
          })}
          atmosphereColor='#5784a7'
          atmosphereAltitude={0.23}
          pointsMerge={true}
          // pointsData={pointsData}
          pointAltitude={0.01}
          pointRadius={0.2}
          pointResolution={5}
          pointColor={() => '#eed31f'}
          polygonsData={globeData.countries.features}
          polygonSideColor={() => '#00000000'}
          polygonStrokeColor={() => "rgba(0, 100, 0, 0.15)"}
          onPolygonClick={handleCountrySelect}
          onPolygonHover={(d) => {
            setHoveredCountry(d);
            if (globeRef.current) {
              globeRef.current.controls().autoRotate = !d;
            }
          }}
          polygonCapMaterial={(d) => {
            if (d === fromCountry) return fromMaterial;
            if (d === destinationCountry) return destinationMaterial;
            return d === hoveredCountry ? fromMaterial : defaultMaterial;
          }}
          // polygonAltitude={(d) => 
          //   d === fromCountry || d === destinationCountry ? 0.04 : 0.01
          // }
          arcsData={arcData}
          arcColor={'color'}
          // arcDashLength={() => Math.random()}
          // arcDashGap={() => Math.random()}
          arcDashAnimateTime={() => Math.random() * 4000 + 500}
          arcDashLength={1}  // Continuous line (no dashes)
          arcDashGap={0}    // No gaps between dashes
          // arcDashAnimateTime={0}  // Disable dash animation
          customLayerData={[...Array(500).keys()].map(() => ({
            lat: (Math.random() - 1) * 360,
            lng: (Math.random() - 1) * 360,
            altitude: Math.random() * 2,
            size: Math.random() * 0.4,
            color: '#faadfd',
          }))}
          customThreeObject={(sliceData) => {
            const { size, color } = sliceData;
            return new THREE.Mesh(new THREE.SphereGeometry(size), new THREE.MeshBasicMaterial({ color }));
          }}
          // customThreeObjectUpdate={(obj, sliceData) => {
          //   const { lat, lng, altitude } = sliceData;
          //   return Object.assign(obj.position, globeRef.current?.getCoords(lat, lng, altitude));
          // }}
        />

        {(fromCountry || destinationCountry) && (
          <div className="info-panel" style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            background: "#fff",
            padding: "10px",
            border: "1px solid #E5E5E5",
            boxShadow: "0px 2px 20px rgba(32, 32, 35, 0.13)",
            borderRadius: "4px"
          }}>
            {fromCountry && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: '#ffd700' }}>
                  From: {fromCountry.properties.ADMIN}
                </div>
                <div>Visitors: {number(fromCountry.properties.POP_EST).format("0a")}</div>
              </div>
            )}
            {destinationCountry && (
              <div>
                <div style={{ fontWeight: 600, color: '#ff0000' }}>
                  Destination: {destinationCountry.properties.ADMIN}
                </div>
                <div>Visitors: {number(destinationCountry.properties.POP_EST).format("0a")}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default global;