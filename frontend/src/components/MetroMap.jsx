
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Approximate map positions. These are display coordinates,
// not surveyed station entrance locations.
const STATIONS = [
  // Red Line: Miyapur to LB Nagar
  { name: "Miyapur", position: [17.4968, 78.3730], corridor: "Red Line" },
  { name: "KPHB Colony", position: [17.4933, 78.3997], corridor: "Red Line" },
  { name: "Kukatpally", position: [17.4849, 78.4138], corridor: "Red Line" },
  { name: "Ameerpet", position: [17.4375, 78.4483], corridor: "Interchange" },
  { name: "Punjagutta", position: [17.4287, 78.4520], corridor: "Red Line" },
  { name: "MGBS", position: [17.3783, 78.4804], corridor: "Interchange" },
  { name: "LB Nagar", position: [17.3514, 78.5480], corridor: "Red Line" },

  // Blue Line: Nagole to Raidurg
  { name: "Nagole", position: [17.4010, 78.5580], corridor: "Blue Line" },
  { name: "Uppal", position: [17.4018, 78.5591], corridor: "Blue Line" },
  { name: "Secunderabad East", position: [17.4344, 78.5021], corridor: "Blue Line" },
  { name: "Parade Grounds", position: [17.4435, 78.4983], corridor: "Interchange" },
  { name: "HITEC City", position: [17.4474, 78.3772], corridor: "Blue Line" },
  { name: "Raidurg", position: [17.4347, 78.3865], corridor: "Blue Line" },
];

const LEVELS = {
  low: { label: "LOW", color: "#059669" },
  normal: { label: "NORMAL", color: "#2563eb" },
  high: { label: "HIGH", color: "#ea580c" },
  critical: { label: "CRITICAL", color: "#dc2626" },
};

const CORRIDOR_COLORS = {
  "Red Line": "#dc2626",
  "Green Line": "#059669",
  "Blue Line": "#2563eb",
  Interchange: "#7c3aed",
};

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

export default function MetroMap({
  updates = [],
  onStationSelect,
}) {
  const [selectedName, setSelectedName] = useState("");

  const updatesByName = useMemo(
    () =>
      new Map(
        updates.map((item) => [
          String(item.station || item.name || "")
            .trim()
            .toLowerCase(),
          item,
        ])
      ),
    [updates]
  );

  const mapStations = STATIONS.map((station) => ({
    ...station,
    update: updatesByName.get(station.name.toLowerCase()) || null,
  }));

  function selectStation(station, update) {
    setSelectedName(station.name);

    onStationSelect?.({
      ...station,
      ...(update || {}),
      name: station.name,
      station: update?.station || station.name,
    });
  }

  return (
    <div>
      <div
        style={{
          height: 430,
          width: "100%",
          overflow: "hidden",
          borderRadius: 14,
          border: "1px solid #dbeafe",
          position: "relative",
          zIndex: 0,
        }}
      >
        <MapContainer
          center={[17.425, 78.46]}
          zoom={12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapResizeHandler />

          {mapStations.map(({ name, position, corridor, update }) => {
            const level = String(
              update?.crowd_level || "normal"
            ).toLowerCase();

            const levelInfo = LEVELS[level] || LEVELS.normal;
            const delay = Number(update?.delay_minutes) || 0;
            const isSelected = selectedName === name;

            return (
              <CircleMarker
                key={name}
                center={position}
                radius={isSelected ? 11 : 8}
                pathOptions={{
                  color: isSelected ? "#0f172a" : "#ffffff",
                  weight: isSelected ? 3 : 2,
                  fillColor: levelInfo.color,
                  fillOpacity: 0.95,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 175, color: "#123b70" }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 15,
                        marginBottom: 7,
                      }}
                    >
                      {name}
                    </strong>

                    <p style={{ margin: "5px 0" }}>
                      Corridor: <strong>{corridor}</strong>
                    </p>

                    <p style={{ margin: "5px 0" }}>
                      Crowd level: <strong>{levelInfo.label}</strong>
                    </p>

                    <p style={{ margin: "5px 0 12px" }}>
                      Simulated delay: <strong>{delay} min</strong>
                    </p>

                    {!update && (
                      <p style={{ fontSize: 12 }}>
                        No simulation update received for this station yet.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => selectStation({ name, position, corridor }, update)}
                      style={{
                        border: 0,
                        borderRadius: 7,
                        padding: "9px 12px",
                        background: "#1d4ed8",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      View station
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong style={{ color: "#123b70", fontSize: 13 }}>
          Crowd level
        </strong>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 18px",
            marginTop: 9,
            color: "#526b8b",
            fontSize: 12,
          }}
        >
          {Object.entries(LEVELS).map(([key, item]) => (
            <span
              key={key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: "50%",
                  background: item.color,
                }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong style={{ color: "#123b70", fontSize: 13 }}>
          Hyderabad Metro corridors
        </strong>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 18px",
            marginTop: 9,
            color: "#526b8b",
            fontSize: 12,
          }}
        >
          {Object.entries(CORRIDOR_COLORS).map(([name, color]) => (
            <span
              key={name}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              {name}
            </span>
          ))}
        </div>
      </div>

      <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 12 }}>
        Station coordinates are approximate. Crowd levels and delays are simulated,
        not an official live Hyderabad Metro feed. This map displays a subset
        of stations, not the full network.
      </p>
    </div>
  );
}
