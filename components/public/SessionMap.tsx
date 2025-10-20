"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type SessionLocation = {
  id: string;
  title: string;
  startsAt: string;
  latitude: number | null;
  longitude: number | null;
  addressSummary: string | null;
  zipCode: string | null;
  games: string[];
};

const fallbackCenter: [number, number] = [46.2276, 2.2137]; // Roughly central France.

const markerIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type SessionMapProps = {
  sessions: SessionLocation[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date TBD";
  }

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionMap({ sessions }: SessionMapProps) {
  const markers = useMemo(
    () => sessions.filter((session) => session.latitude !== null && session.longitude !== null),
    [sessions],
  );

  const center: [number, number] = useMemo(() => {
    if (markers.length === 0) {
      return fallbackCenter;
    }

    const latSum = markers.reduce((total, session) => total + (session.latitude ?? 0), 0);
    const lngSum = markers.reduce((total, session) => total + (session.longitude ?? 0), 0);
    return [latSum / markers.length, lngSum / markers.length];
  }, [markers]);

  return (
    <section id="map" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Explore games on the map</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              We use the organiser&apos;s zip code and precise location when available to help you
              pick the right table faster. Share yours once you sign in for a tailored feed.
            </p>
          </div>
        </div>

        <div className="relative mt-8">
          <MapContainer
            center={center}
            zoom={markers.length > 0 ? 11 : 5}
            className="h-[420px] w-full rounded-2xl"
            scrollWheelZoom={false}
            style={{ height: "420px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((session) => (
              <Marker
                key={session.id}
                position={[session.latitude as number, session.longitude as number]}
                icon={markerIcon}
              >
                <Popup className="text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{session.title}</p>
                    <p className="text-xs text-gray-600">{formatDate(session.startsAt)}</p>
                    <p className="text-xs text-gray-600">
                      {session.addressSummary ?? "Exact spot shared after RSVP"}
                    </p>
                    {session.games.length > 0 && (
                      <p className="text-xs text-gray-700">Games: {session.games.join(", ")}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {markers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 text-center text-sm text-gray-600">
              No sessions have shared map coordinates yet. Be the first to host one!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
