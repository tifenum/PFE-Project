"use client"; // Add this at the top
import { useRef } from 'react';
import React from "react";
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import number from "numeral";
import chroma from "chroma-js";
// import landTopology from 'globe/land_10m.json';
import pointsData from './random-locations.json';
// import texture from 'globe/land4.png';
// import globeJson from 'globe/countries_110m.json';
import * as turf from '@turf/turf';
const texture = "/globe/land4.png";


const min = 1000;
const max = 4000;
const sliceData = pointsData.sort(() => (Math.random() > 0.5 ? 1 : -1)).slice(20, 90);

const arcsData = sliceData.map(() => {
  const randStart = Math.floor(Math.random() * sliceData.length);
  const randEnd = Math.floor(Math.random() * sliceData.length);
  const randTime = Math.floor(Math.random() * (max - min + 1) + min);
  return {
    startLat: sliceData[randStart].lat,
    startLng: sliceData[randStart].lng,
    endLat: sliceData[randEnd].lat,
    endLng: sliceData[randEnd].lng,
    time: randTime,
    color: ['#ffffff00', '#faf7e6', '#ffffff00'],
  };
});

const Global = () => {
  const [hoveredCountry, setHoveredCountry] = React.useState(null);
  const [selectedCountry, setSelectedCountry] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredCountries, setFilteredCountries] = React.useState([]);

  const handleCountryClick = (d) => {
    if (!d || !globeRef.current) return;
  
    // Get centroid from geometry
    const centroid = getCountryCenter(d);
    
    setSelectedCountry(d);
    console.log('Country center:', d.properties.ADMIN);
    setHoveredCountry(d);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = !d;
    }
    globeRef.current.pointOfView({
      lat: centroid[1], // GeoJSON uses [lng, lat] format
      lng: centroid[0],
      altitude: 1.8
    }, 1000);
  };
  const getCountryCenter = (feature) => {
    const centroid = turf.centroid(feature);
    return centroid.geometry.coordinates; // [lng, lat]
  };
  // Memoized materials for better performance
  const defaultMaterial = React.useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#49ac8f',
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);
    const handleSearch = (e) => {
      const term = e.target.value;
      setSearchTerm(term);
      
      if (term.length > 0) {
        const filtered = globeData.countries.features.filter(country => 
          country.properties.ADMIN.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredCountries(filtered);
      } else {
        setFilteredCountries([]);
      }
    };
  const hoverMaterial = React.useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#ffd700', // Gold hover color
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(texture),
    }), []);
    const globeEl = React.useRef(null);
    const [globeData, setGlobeData] = React.useState({
      countries: { features: [] },
      points: { features: [] }
    });
    const [data, setData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const colorScale = chroma.scale(["red", "yellow"]);
    React.useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch the corrected data
          fetch("./correctedData.json")
            .then((response) => response.json())
            .then((data) => {
              const sortedData = data.sort((a, b) =>
                a.countryName.localeCompare(b.countryName)
              );
              console.log(sortedData);
              setData(sortedData);
            });
  
          // Fetch the GeoJSON for the globe
          fetch(
            "https://raw.githubusercontent.com/iamanas20/geojson/main/map11.geojson"
          )
            .then((res) => res.json())
            .then(function (res) {
              console.log(res);
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
    const lookup = React.useMemo(() => {
      const mapping = {};
      data.forEach(item => {
        mapping[item.countryName] = item;
      });
      return mapping;
    }, [data]);
  const globeRef = useRef(null);
  const handleSearchSelect = (country) => {
    setSearchTerm('');
    setFilteredCountries([]);
    handleCountryClick(country);
  };
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
    <div         className="relative z-10 overflow-hidden bg-white pb-16 pt-[120px] dark:bg-gray-dark md:pb-[120px] md:pt-[150px] xl:pb-[160px] xl:pt-[180px] 2xl:pb-[200px] 2xl:pt-[210px]"
>
<div className="absolute top-4 left-4 z-20 w-64">
      <input
        type="text"
        placeholder="Search country..."
        value={searchTerm}
        onChange={handleSearch}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && filteredCountries.length > 0) {
            handleSearchSelect(filteredCountries[0]);
          }
        }}
        className="w-full p-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {filteredCountries.length > 0 && (
        <div className="mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {filteredCountries.map((country, idx) => (
            <div
              key={idx}
              onClick={() => handleSearchSelect(country)}
              className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
            >
              {country.properties.ADMIN}
            </div>
          ))}
        </div>
      )}
    </div>
    <div className='cursor-pointer'>
      <Globe
        ref={globeRef}
        onGlobeReady={globeReady}
        backgroundColor='#1e232e'
        // backgroundColor='#FFFFFF'
        rendererConfig={{ antialias: true, alpha: true }}
        globeMaterial={
          new THREE.MeshPhongMaterial({
            color: '#1a2033',
            opacity: 0.95,
          })
        }
        atmosphereColor='#5784a7'
        atmosphereAltitude={0.23}
        pointsMerge={true}
        pointsData={pointsData}
        pointAltitude={0.01}
        pointRadius={0.2}
        pointResolution={5}
        pointColor={() => '#eed31f'}
 
        polygonsData={globeData.countries.features}
        polygonSideColor={() => '#00000000'}
        polygonStrokeColor={() => "rgba(0, 100, 0, 0.15)"} // Add stroke color
        onPolygonClick={(d) => {
          setSelectedCountry(d);
          setHoveredCountry(d);
          handleCountryClick(d);
        }}
        onPolygonHover={(d) => {
          setHoveredCountry(d);
          if (globeRef.current) {
            globeRef.current.controls().autoRotate = !d;
          }
          }}
        polygonCapMaterial={(d) => 
          d === hoveredCountry || d === selectedCountry ? hoverMaterial : defaultMaterial
        }

        polygonAltitude={(d) =>
          d === selectedCountry ? 0.04 : 0.01
        }
        customLayerData={[...Array(500).keys()].map(() => ({
          lat: (Math.random() - 1) * 360,
          lng: (Math.random() - 1) * 360,
          altitude: Math.random() * 2,
          size: Math.random() * 0.4,
          color: '#faadfd',
        }))}
        customThreeObject={(sliceData: { lat: number, lng: number, altitude: number, size: number, color: string }) => {
          const { size, color } = sliceData;
          return new THREE.Mesh(new THREE.SphereGeometry(size), new THREE.MeshBasicMaterial({ color }));
        }}
        customThreeObjectUpdate={(obj, sliceData: { lat: number, lng: number, altitude: number }) => {
          const { lat, lng, altitude } = sliceData;
          return Object.assign(obj.position, globeRef.current?.getCoords(lat, lng, altitude));
        }}
      />
      {selectedCountry && (
        <div
          className="info-panel"
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            background: "#fff",
            padding: "10px",
            border: "1px solid #E5E5E5",
            boxShadow: "0px 2px 20px rgba(32, 32, 35, 0.13)",
            borderRadius: "4px"
          }}
        >
          <div
            style={{
              fontFamily: "'Open sans', sans-serif",
              marginBottom: "10px",
              fontWeight: 600,
              fontSize: "13px",
              lineHeight: "16px",
              textTransform: "capitalize",
              color: "#2D3032"
            }}
          >
            {selectedCountry.properties.ADMIN}
          </div>
          <div
            style={{
              fontFamily: "'Open sans', sans-serif",
              fontSize: "13px",
              lineHeight: "16px",
              color: "#3E4850"
            }}
          >
            Visitors: {number(selectedCountry.properties.POP_EST).format("0a")}
          </div>

        </div>
      )}
    </div>
    </div>
  );
};

export default Global;
