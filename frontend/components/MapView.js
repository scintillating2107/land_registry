import { MapContainer, Marker, Polygon, Popup, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon paths for Leaflet in Next.js
if (typeof window !== "undefined") {
  // eslint-disable-next-line global-require
  const iconUrl = require("leaflet/dist/images/marker-icon.png");
  // eslint-disable-next-line global-require
  const iconRetinaUrl = require("leaflet/dist/images/marker-icon-2x.png");
  // eslint-disable-next-line global-require
  const shadowUrl = require("leaflet/dist/images/marker-shadow.png");

  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  });
}

function parseCoordinates(coordinates) {
  if (!coordinates) return null;

  const [latStr, lngStr] = coordinates.split(",");
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

function hashSeed(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildPlotPolygon(lat, lng, seedValue = "") {
  const seed = hashSeed(seedValue);
  const latBase = 0.00035 + (seed % 7) * 0.00002;
  const lngBase = 0.00042 + (seed % 5) * 0.00003;
  const tilt = ((seed % 9) - 4) * 0.00003;
  const inset = 0.00009 + (seed % 3) * 0.00001;

  return [
    [lat + latBase, lng - lngBase + tilt],
    [lat + latBase * 0.45, lng + lngBase],
    [lat - inset, lng + lngBase * 1.1],
    [lat - latBase, lng + lngBase * 0.2 - tilt],
    [lat - latBase * 0.7, lng - lngBase],
    [lat + inset, lng - lngBase * 1.05],
  ];
}

const TILE_CONFIG = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
}

export default function MapView({
  coordinates,
  propertyId,
  ownerName,
  statusLabel,
  landArea,
  verified,
  boundaryGeojson,
  zoom = 17,
  markerLabel = "Property location",
  tileVariant = "streets",
}) {
  if (!coordinates) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
        No coordinates
      </div>
    );
  }

  const parsed = parseCoordinates(coordinates);
  if (!parsed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
        Invalid coords
      </div>
    );
  }

  const { lat, lng } = parsed;
  const tileConfig = TILE_CONFIG[tileVariant] || TILE_CONFIG.streets;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />
      {boundaryGeojson ? (
        <GeoJSON
          data={boundaryGeojson}
          style={{
            color: "#2563EB",
            weight: 2,
            fillOpacity: 0.3,
          }}
        />
      ) : (
        <Polygon
          positions={buildPlotPolygon(lat, lng, propertyId || coordinates)}
          pathOptions={{
            color: "#38bdf8",
            weight: 3,
            fillColor: "#0ea5e9",
            fillOpacity: tileVariant === "satellite" ? 0.28 : 0.35,
          }}
        />
      )}
      <Marker position={[lat, lng]}>
        <Popup>
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-slate-900">{propertyId || markerLabel}</div>
            {ownerName && <div>Owner: {ownerName}</div>}
            {landArea && <div>Area: {landArea}</div>}
            {statusLabel && <div>Status: {statusLabel}</div>}
            {verified && (
              <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
                ✓ Verified on BhoomiChain
              </div>
            )}
            <div className="font-mono text-[11px]">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

