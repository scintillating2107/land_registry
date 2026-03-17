import { MapContainer, Polygon, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Default center: Lucknow, Uttar Pradesh for hackathon demo
const CENTER = [26.8467, 80.9462];

// Simple demo parcels with survey number and owner
const PARCELS = [
  {
    id: "BLOCK-123456",
    surveyNumber: "SN-24/1A",
    owner: "Ravi Kumar",
    area: "1200 sq m",
    txId: "BLOCK-123456",
    // Sample parcel near Lucknow (approximate demo coordinates)
    coords: [
      [26.8472, 80.9458],
      [26.8474, 80.9463],
      [26.8469, 80.9466],
      [26.8467, 80.9461],
    ],
  },
  {
    id: "BLOCK-987654",
    surveyNumber: "SN-24/1B",
    owner: "Charlie Fernandes",
    area: "950 sq m",
    txId: "BLOCK-987654",
    coords: [
      [26.8463, 80.9470],
      [26.8466, 80.9474],
      [26.8462, 80.9478],
      [26.8459, 80.9473],
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

