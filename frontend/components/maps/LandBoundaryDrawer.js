import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";

const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 }; // India centroid-ish

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
      <DrawControl onChange={onChange} />
    </MapContainer>
  );
}

