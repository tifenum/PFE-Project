import MapillaryViewer from "./MapillaryViewer";

export default function MapPage() {
  const headerHeight = 64; // Adjust based on your header's height in pixels

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapillaryViewer
        mapillaryAccessToken="MLY|9776335315776862|eab7ce300d7a94bc52a0e3bd54a246f7"
        mapboxAccessToken="pk.eyJ1IjoiaGFubmliYWwtYmFyY2EiLCJhIjoiY21iNnN2bm8xMDJtMDJsczYxbTV2Ymd4cyJ9.owVA62od8tnPG22xWloCVQ"
        headerHeight={headerHeight}
      />
    </div>
  );
}