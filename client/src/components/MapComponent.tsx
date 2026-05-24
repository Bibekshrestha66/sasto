import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet + React
// @ts-ignore
import icon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  location: string;
  district?: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export function MapComponent({ location, district }: MapComponentProps) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function geocode() {
      try {
        const query = `${location}${district ? `, ${district}` : ""}, Nepal`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          // Fallback to district only if location fails
          if (district) {
             const distResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(district + ", Nepal")}`
            );
            const distData = await distResponse.json();
            if (distData && distData.length > 0) {
              setCoords([parseFloat(distData[0].lat), parseFloat(distData[0].lon)]);
            }
          }
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
      } finally {
        setLoading(false);
      }
    }

    geocode();
  }, [location, district]);

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading map...</div>;
  if (!coords) return <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">Location not found on map</div>;

  return (
    <div className="h-64 rounded-xl overflow-hidden shadow-inner border border-gray-100 z-10">
      <MapContainer
        center={coords}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords}>
          <Popup>
            {location}, {district}
          </Popup>
        </Marker>
        <ChangeView center={coords} />
      </MapContainer>
    </div>
  );
}
