import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
);
const Polygon = dynamic(
  async () => (await import("react-leaflet")).Polygon,
  { ssr: false }
);
const Popup = dynamic(
  async () => (await import("react-leaflet")).Popup,
  { ssr: false }
);
import "leaflet/dist/leaflet.css";

const PRIMARY = "#0B3C5D";
const PARCEL_FILL = "rgba(26,77,143,0.35)";

const PARCELS = [
  {
    id: 1,
    surveyNumber: "124/7A",
    ownerName: "Ravi Kumar",
    village: "Rampur",
    area: "1200 sq m",
    hash: "0x8f3ab92d81a47cfe238a",
    block: 10425,
    coords: [
      [26.8605, 80.9455],
      [26.8609, 80.9471],
      [26.8597, 80.9475],
      [26.8593, 80.9460],
    ],
  },
  {
    id: 2,
    surveyNumber: "125/2B",
    ownerName: "Anita Sharma",
    village: "Rampur",
    area: "950 sq m",
    hash: "0x7bd38ac9f21a",
    block: 10426,
    coords: [
      [26.8612, 80.9462],
      [26.8616, 80.9477],
      [26.8607, 80.9482],
      [26.8603, 80.9467],
    ],
  },
  {
    id: 3,
    surveyNumber: "130/1",
    ownerName: "Rajesh Singh",
    village: "Rampur",
    area: "1600 sq m",
    hash: "0x8df8219ac11f",
    block: 10427,
    coords: [
      [26.8588, 80.9448],
      [26.8593, 80.9463],
      [26.8583, 80.9468],
      [26.8579, 80.9453],
    ],
  },
  {
    id: 4,
    surveyNumber: "131/4",
    ownerName: "Meera Joshi",
    village: "Rampur",
    area: "1050 sq m",
    hash: "0x6cd01aa9b332",
    block: 10428,
    coords: [
      [26.8620, 80.9445],
      [26.8625, 80.9460],
      [26.8615, 80.9464],
      [26.8610, 80.9449],
    ],
  },
  {
    id: 5,
    surveyNumber: "135/3",
    ownerName: "Ajay Verma",
    village: "Rampur",
    area: "1400 sq m",
    hash: "0x9a18b7cde012",
    block: 10429,
    coords: [
      [26.8598, 80.9485],
      [26.8604, 80.9499],
      [26.8594, 80.9504],
      [26.8589, 80.9489],
    ],
  },
  {
    id: 6,
    surveyNumber: "140/6",
    ownerName: "Sanjay Patel",
    village: "Rampur",
    area: "1100 sq m",
    hash: "0x7aa9310fe88b",
    block: 10430,
    coords: [
      [26.8575, 80.9469],
      [26.8581, 80.9483],
      [26.8571, 80.9488],
      [26.8566, 80.9474],
    ],
  },
];

export function DemoParcelMap({ onSelectParcel }) {
  const [selectedSurvey, setSelectedSurvey] = useState("");
  const [activeId, setActiveId] = useState(null);

  const center = useMemo(() => [26.8467, 80.9462], []);

  useEffect(() => {
    if (!activeId && PARCELS[0]) setActiveId(PARCELS[0].id);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const query = selectedSurvey.trim().toLowerCase();
    if (!query) return;
    const match = PARCELS.find((p) => p.surveyNumber.toLowerCase() === query);
    if (match) {
      setActiveId(match.id);
      onSelectParcel?.(match);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: PRIMARY }}>
            Public Land Record Verification
          </h3>
          <p className="text-xs text-slate-600">
            Search and verify land ownership using the interactive map.
          </p>
        </div>
        <div className="hidden md:block text-[11px] text-slate-500">
          Blue boundary = Registered land parcel
        </div>
      </div>
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 text-sm">
        <input
          type="text"
          placeholder="Search by Survey Number (e.g. 124/7A)"
          className="input flex-1 text-sm"
          value={selectedSurvey}
          onChange={(e) => setSelectedSurvey(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary px-4 py-2 rounded-lg text-sm"
        >
          Search
        </button>
      </form>
      <div className="relative h-72 rounded-lg overflow-hidden border border-slate-200">
        <MapContainer
          center={center}
          zoom={13}
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
                weight: activeId === parcel.id ? 3 : 2,
                fillColor: PARCEL_FILL,
                fillOpacity: activeId === parcel.id ? 0.5 : 0.35,
              }}
              eventHandlers={{
                click: () => {
                  setActiveId(parcel.id);
                  onSelectParcel?.(parcel);
                },
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-900">
                    Survey: {parcel.surveyNumber}
                  </div>
                  <div>Owner: {parcel.ownerName}</div>
                  <div>Village: {parcel.village}</div>
                  <div>Area: {parcel.area}</div>
                  <div className="font-mono text-[11px]">
                    {parcel.hash}
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>
        <div className="absolute bottom-2 left-2 bg-white/90 rounded px-2 py-1 text-[11px] text-slate-600 border border-slate-200">
          <span className="inline-block w-3 h-2 align-middle mr-1" style={{ backgroundColor: PARCEL_FILL, border: "1px solid #1A4D8F" }} />
          Blue boundary = Registered land parcel
        </div>
      </div>
    </div>
  );
}

export function DemoParcelSidePanel({ parcel, txInfo }) {
  if (!parcel) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
        Click a parcel on the map or search by survey number to view details.
      </div>
    );
  }
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-xs text-slate-800 space-y-1.5">
      <div className="font-semibold text-slate-900 mb-1">Property Information</div>
      <div>Owner Name: {parcel.ownerName}</div>
      <div>Survey Number: {parcel.surveyNumber}</div>
      <div>Village: {parcel.village}</div>
      <div>Land Area: {parcel.area}</div>
      <div>
        Blockchain Hash:{" "}
        <span className="font-mono text-[11px]">{parcel.hash}</span>
      </div>
      <div>
        Block Number: {parcel.block}
      </div>
      <div>
        Status:{" "}
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
          ✓ Record Verified on BhoomiChain
        </span>
      </div>
    </div>
  );
}

