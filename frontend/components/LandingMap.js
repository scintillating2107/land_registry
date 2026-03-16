import { MapContainer, Polygon, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const CENTER = [12.9716, 77.5946]; // Bengaluru demo center

// Simple demo parcels with survey number and owner
const PARCELS = [
  {
    id: "BLOCK-123456",
    surveyNumber: "SN-24/1A",
    owner: "Ravi Kumar",
    area: "1200 sq m",
    txId: "BLOCK-123456",
    coords: [
      [12.9721, 77.5939],
      [12.9723, 77.5944],
      [12.9718, 77.5947],
      [12.9715, 77.5942],
    ],
  },
  {
    id: "BLOCK-987654",
    surveyNumber: "SN-24/1B",
    owner: "Charlie Fernandes",
    area: "950 sq m",
    txId: "BLOCK-987654",
    coords: [
      [12.9714, 77.5951],
      [12.9717, 77.5955],
      [12.9713, 77.5959],
      [12.9710, 77.5954],
    ],
  },
];

export default function LandingMap() {
  return (
    <MapContainer
      center={CENTER}
      zoom={16}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />
      {PARCELS.map((parcel) => (
        <Polygon
          key={parcel.id}
          positions={parcel.coords}
          pathOptions={{
            color: "#1A4D8F",
            weight: 2,
            fillColor: "#0B3C5D",
            fillOpacity: 0.25,
          }}
        >
          <Popup>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-slate-900">
                Survey: {parcel.surveyNumber}
              </div>
              <div>Owner: {parcel.owner}</div>
              <div>Area: {parcel.area}</div>
              <div className="font-mono text-[11px]">
                Tx: {parcel.txId}
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}
    </MapContainer>
  );
}

