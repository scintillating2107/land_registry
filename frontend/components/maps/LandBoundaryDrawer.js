import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";

// Default to Lucknow, Uttar Pradesh for demo hackathon
const DEFAULT_CENTER = { lat: 26.8467, lng: 80.9462 };

function LocationSearch() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q || !map) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=in&limit=1`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        if (!Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
          map.setView([latNum, lonNum], 16);
        }
      } else {
        setError("Location not found");
      }
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="leaflet-top leaflet-right">
      <form
        onSubmit={handleSearch}
        className="m-2 flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 shadow-sm border border-gray-200"
      >
        <input
          type="text"
          placeholder="Search place (e.g. Gomti Nagar, Lucknow)"
          className="text-[11px] px-1 py-0.5 border-none focus:outline-none bg-transparent placeholder-gray-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="text-[11px] px-2 py-0.5 rounded bg-primary text-white disabled:opacity-60"
        >
          Go
        </button>
      </form>
      {error && (
        <div className="m-2 px-2 py-1 rounded bg-red-50 border border-red-200 text-[10px] text-red-700 shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function DrawControl({ onChange }) {
  const map = useMap();
  const drawnRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    drawnRef.current = drawnItems;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        edit: true,
        remove: true,
      },
      draw: {
        // Allow both polygon and rectangle, but rectangle is simpler for demo
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        polyline: false,
        rectangle: {
          showArea: true,
        },
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });

    map.addControl(drawControl);

    function handleCreated(e) {
      const { layer } = e;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      const latlngs = layer.getLatLngs()[0] || [];
      if (!latlngs.length) return;

      const boundary = latlngs.map((p) => ({ lat: p.lat, lng: p.lng }));
      const area =
        typeof L.GeometryUtil?.geodesicArea === "function"
          ? L.GeometryUtil.geodesicArea(latlngs)
          : 0;

      const centroid = latlngs.reduce(
        (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
        { lat: 0, lng: 0 }
      );
      centroid.lat /= latlngs.length;
      centroid.lng /= latlngs.length;

      onChange?.({
        latitude: centroid.lat,
        longitude: centroid.lng,
        boundary,
        area,
      });
    }

    function handleEdited(e) {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        handleCreated({ layer });
      });
    }

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, () => {
      drawnItems.clearLayers();
      onChange?.(null);
    });

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onChange]);

  return null;
}

export default function LandBoundaryDrawer({ initialCenter, onChange }) {
  const center = initialCenter && !Number.isNaN(initialCenter.lat) && !Number.isNaN(initialCenter.lng)
    ? [initialCenter.lat, initialCenter.lng]
    : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />
      <LocationSearch />
      <DrawControl onChange={onChange} />
    </MapContainer>
  );
}

