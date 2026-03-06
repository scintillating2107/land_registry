import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function MapView({ coordinates }) {
  if (!coordinates) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
        No coordinates
      </div>
    );
  }
  const [latStr, lngStr] = coordinates.split(",");
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
        Invalid coords
      </div>
    );
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />
      <Marker position={[lat, lng]}>
        <Popup>Property location</Popup>
      </Marker>
    </MapContainer>
  );
}

