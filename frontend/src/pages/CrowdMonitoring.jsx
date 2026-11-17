import { useEffect, useMemo, useState } from "react";
import { getRealtimeSimulation } from "../services/api";
import MetroMap from "../components/MetroMap";

const crowdStyles = {
  low: { label: "LOW", color: "#047857", background: "#d1fae5", border: "#6ee7b7" },
  normal: { label: "NORMAL", color: "#1d4ed8", background: "#dbeafe", border: "#93c5fd" },
  high: { label: "HIGH", color: "#c2410c", background: "#ffedd5", border: "#fdba74" },
  critical: { label: "CRITICAL", color: "#b91c1c", background: "#fee2e2", border: "#fca5a5" },
};

const styles = {
  page: { color: "#16345b", width: "100%", maxWidth: "100%" },
  panel: {
    background: "#fff", border: "1px solid #dbeafe", borderRadius: 16,
    padding: 20, marginBottom: 20, boxShadow: "0 5px 18px rgba(30,64,175,.055)",
    minWidth: 0,
  },
  panelTitle: { margin: "0 0 6px", color: "#123b70", fontSize: 18, fontWeight: 800 },
  muted: { margin: 0, color: "#526b8b", fontSize: 13, lineHeight: 1.6 },
  badge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "7px 11px", borderRadius: 30, fontSize: 11, fontWeight: 800,
    letterSpacing: ".35px", whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))",
    gap: 14,
  },
};

function getCrowdStyle(level) {
  return crowdStyles[String(level || "normal").toLowerCase()] || crowdStyles.normal;
}

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function MetricCard({ icon, title, value, subtitle, color, background }) {
  return (
    <article style={{
      display: "flex", flexDirection: "column", gap: 12, padding: 18,
      background: "#fff", border: "1px solid #dbeafe", borderRadius: 15,
      boxShadow: "0 4px 15px rgba(30,64,175,.05)", minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden="true" style={{
          display: "grid", placeItems: "center", width: 40, height: 40,
          borderRadius: 12, color, background, fontSize: 20, flexShrink: 0,
        }}>{icon}</span>
        <strong style={{ color: "#24476e", fontSize: 13 }}>{title}</strong>
      </div>
      <div style={{ color, fontSize: 30, fontWeight: 850, lineHeight: 1.1 }}>
        {Number(value || 0).toLocaleString()}
      </div>
      <small style={{ color: "#526b8b", fontSize: 12 }}>{subtitle}</small>
    </article>
  );
}

export default function CrowdMonitoring({ simulation: sharedSimulation } = {}) {
  const [localSimulation, setLocalSimulation] = useState(null);
  const [simulationError, setSimulationError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedStation, setSelectedStation] = useState("All");

  useEffect(() => {
    // When App supplies its shared snapshot, do not fetch a separate random one here.
    if (sharedSimulation !== undefined) return;

    let active = true;
    let inProgress = false;

    async function loadData() {
      if (inProgress) return;
      inProgress = true;

      try {
        const data = await getRealtimeSimulation();
        if (active) {
          setLocalSimulation(data);
          setSimulationError("");
          setLastRefresh(new Date());
        }
      } catch (err) {
        if (active) setSimulationError(err.message || "Unable to load simulated station updates.");
      } finally {
        inProgress = false;
      }
    }

    loadData();
    const intervalId = window.setInterval(loadData, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [sharedSimulation]);

  const simulation = sharedSimulation !== undefined ? sharedSimulation : localSimulation;
  useEffect(() => {
    if (simulation?.updates?.length) {
      setLastRefresh(new Date());
    }
  }, [simulation]);

  const stations = simulation?.updates ?? [];

  const alerts = useMemo(() => stations.flatMap((station) => {
    const items = [];
    const level = String(station.crowd_level || "").toLowerCase();
    const delay = Number(station.delay_minutes) || 0;

    if (level === "critical") {
      items.push({
        station: station.station, severity: "critical",
        title: "Critical crowd level",
        detail: "Simulated crowd conditions are at the highest alert level.",
      });
    } else if (level === "high") {
      items.push({
        station: station.station, severity: "warning",
        title: "High crowd level",
        detail: "Simulated crowding is elevated.",
      });
    }

    if (delay >= 10) {
      items.push({
        station: station.station, severity: "warning",
        title: "Significant simulated delay",
        detail: `Simulated delay of ${delay} minutes.`,
      });
    }

    return items;
  }), [stations]);

  const highCrowdCount = stations.filter((s) =>
    ["high", "critical"].includes(String(s.crowd_level || "").toLowerCase())
  ).length;

  const criticalCount = stations.filter((s) =>
    String(s.crowd_level || "").toLowerCase() === "critical"
  ).length;

  const delayedCount = stations.filter((s) =>
    (Number(s.delay_minutes) || 0) > 0
  ).length;

  const visibleStations = selectedStation === "All"
    ? stations
    : stations.filter((s) => s.station === selectedStation);

  return (
    <div className="page-content" style={styles.page}>
      <style>{`
        .cm-station-card { transition: transform 160ms ease, box-shadow 160ms ease; }
        .cm-station-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(30,64,175,.12) !important; }
        .cm-station-select:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
        @media (max-width: 600px) {
          .cm-panel { padding: 14px !important; }
          .cm-section-header { align-items: flex-start !important; flex-direction: column; }
        }
      `}</style>

      <header className="cm-section-header" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 16, marginBottom: 22,
      }}>
        <div>
          <p style={{ color: "#0969da", fontWeight: 850, letterSpacing: "1.1px" }}>
            HYDERABAD METRO NETWORK
          </p>
          <h2 style={{ color: "#123b70", fontWeight: 850, letterSpacing: "-.5px", margin: "5px 0" }}>
            Station Crowd Monitoring
          </h2>
          <p style={styles.muted}>
            Review station crowd levels, simulated delays, and stations that may need attention.
          </p>
        </div>
        <span style={{
          ...styles.badge, color: "#9a3412", background: "#ffedd5",
          border: "1px solid #fed7aa",
        }}>● SIMULATION MODE</span>
      </header>


      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
        gap: 15, marginBottom: 20,
      }}>
        <MetricCard icon="🚇" title="Stations Monitored" value={stations.length}
          subtitle="Stations returned by the simulation"
          color="#1d4ed8" background="#dbeafe" />
        <MetricCard icon="👥" title="High / Critical Crowd" value={highCrowdCount}
          subtitle="Stations flagged by simulated crowd levels"
          color="#c2410c" background="#ffedd5" />
        <MetricCard icon="🚨" title="Critical Crowd" value={criticalCount}
          subtitle="Stations at critical simulated level"
          color="#b91c1c" background="#fee2e2" />
        <MetricCard icon="◷" title="Stations With Delays" value={delayedCount}
          subtitle="Stations with a non-zero simulated delay"
          color="#7c3aed" background="#ede9fe" />
      </section>

      <section className="cm-panel" style={{ ...styles.panel, padding: 0, overflow: "hidden" }}>
        <div className="cm-section-header" style={{
          padding: 19, background: "#fff7f7", borderBottom: "1px solid #fee2e2",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14,
        }}>
          <div>
            <h3 style={styles.panelTitle}>🚨 Station Alerts</h3>
            <p style={styles.muted}>Generated from simulated crowd levels and delay thresholds.</p>
          </div>
          <span style={{
            ...styles.badge, background: alerts.length ? "#fee2e2" : "#d1fae5",
            color: alerts.length ? "#b91c1c" : "#047857",
          }}>
            {alerts.length} ALERT{alerts.length === 1 ? "" : "S"}
          </span>
        </div>

        <div style={{ padding: 16 }}>
          {simulationError && <div className="data-error" role="alert">⚠️ {simulationError}</div>}
          {!simulation && !simulationError && <p style={styles.muted}>Loading station simulation…</p>}
          {simulation && alerts.length === 0 && (
            <div role="status" style={{
              padding: 16, borderRadius: 12, background: "#ecfdf5",
              border: "1px solid #a7f3d0", color: "#065f46",
            }}>
              ✓ No high-crowd or significant-delay alerts in the current simulated results.
            </div>
          )}
          {alerts.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,245px),1fr))",
              gap: 11,
            }}>
              {alerts.map((alert, index) => {
                const critical = alert.severity === "critical";
                return (
                  <article key={`${alert.station}-${alert.title}-${index}`} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: 15,
                    borderRadius: 12, background: critical ? "#fff1f2" : "#fffaf0",
                    border: `1px solid ${critical ? "#fecdd3" : "#fed7aa"}`, minWidth: 0,
                  }}>
                    <span aria-hidden="true" style={{ fontSize: 23 }}>
                      {critical ? "🚨" : "⚠️"}
                    </span>
                    <div style={{ flex: 1, overflowWrap: "anywhere" }}>
                      <strong style={{ color: critical ? "#be123c" : "#c2410c", fontSize: 13 }}>
                        {alert.title}
                      </strong>
                      <div style={{ color: "#123b70", fontWeight: 850, fontSize: 15, margin: "6px 0" }}>
                        {alert.station}
                      </div>
                      <p style={styles.muted}>{alert.detail}</p>
                    </div>
                    <span style={{
                      ...styles.badge, padding: "5px 8px",
                      color: critical ? "#b91c1c" : "#9a3412",
                      background: critical ? "#fee2e2" : "#ffedd5", fontSize: 10,
                    }}>{critical ? "CRITICAL" : "WARNING"}</span>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="cm-panel" style={styles.panel}>
        <h3 style={styles.panelTitle}>🗺️ Metro Station Map</h3>
        <p style={{ ...styles.muted, marginBottom: 16 }}>
          Select a marker to view its simulated conditions and filter the station list.
        </p>
        <MetroMap
          updates={stations}
          onStationSelect={(station) => {
            const name = station.station || station.name;
            if (name) setSelectedStation(name);
          }}
        />
      </section>

      <section className="cm-panel" style={styles.panel}>
        <div className="cm-section-header" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 16, marginBottom: 18,
        }}>
          <div>
            <h3 style={styles.panelTitle}>Station Conditions</h3>
            <p style={styles.muted}>Automatic refresh every 10 seconds.</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#24476e", fontSize: 12, fontWeight: 750 }}>
              Updated {formatTime(lastRefresh)}
            </div>
            <small style={{ color: "#64748b" }}>{stations.length} stations</small>
          </div>
        </div>

        {simulationError && <div className="data-error" role="alert">⚠️ {simulationError}</div>}

        {stations.length > 0 && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 10, marginBottom: 16,
            }}>
              <label htmlFor="cm-station-filter" style={{
                color: "#24476e", fontSize: 13, fontWeight: 750,
              }}>View station</label>
              <select id="cm-station-filter" className="cm-station-select"
                value={selectedStation} onChange={(event) => setSelectedStation(event.target.value)}
                style={{
                  padding: "9px 12px", border: "1px solid #bfdbfe",
                  borderRadius: 9, color: "#123b70", background: "#fff", fontWeight: 700,
                }}>
                <option value="All">All stations</option>
                {stations.map((station) => (
                  <option key={station.station} value={station.station}>{station.station}</option>
                ))}
              </select>
            </div>

            <div style={styles.grid}>
              {visibleStations.map((station) => {
                const crowd = getCrowdStyle(station.crowd_level);
                const delay = Number(station.delay_minutes) || 0;
                const trainStatus = String(station.train_status || "unknown").replaceAll("_", " ");
                const level = String(station.crowd_level || "normal").toLowerCase();
                const cardBackground = level === "critical" ? "#fff7f7"
                  : level === "high" ? "#fffaf4"
                  : level === "low" ? "#f3fdf8" : "#f7faff";

                return (
                  <article key={station.station} className="cm-station-card" style={{
                    padding: 17, border: `1px solid ${crowd.border}`, borderRadius: 14,
                    background: cardBackground, borderTop: `4px solid ${crowd.color}`,
                    boxShadow: "0 3px 12px rgba(15,45,85,.045)", minWidth: 0,
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      gap: 9, marginBottom: 15,
                    }}>
                      <h4 style={{
                        margin: 0, color: "#123b70", fontSize: 16, fontWeight: 850,
                        lineHeight: 1.4, overflowWrap: "anywhere",
                      }}>{station.station}</h4>
                      <span style={{
                        ...styles.badge, padding: "5px 8px", color: crowd.color,
                        background: crowd.background, fontSize: 10,
                      }}>{crowd.label}</span>
                    </div>

                    <div style={{ display: "flex", gap: 9, marginBottom: 12, color: "#24476e", fontSize: 13 }}>
                      <span aria-hidden="true">🚆</span>
                      <span>Train status: <strong style={{ textTransform: "capitalize" }}>{trainStatus}</strong></span>
                    </div>

                    <div style={{
                      display: "flex", gap: 9, marginBottom: 16, fontSize: 13, fontWeight: 750,
                      color: delay >= 10 ? "#b91c1c" : delay > 0 ? "#c2410c" : "#047857",
                    }}>
                      <span aria-hidden="true">◷</span>
                      {delay > 0 ? `${delay} min simulated delay` : "No simulated delay"}
                    </div>

                    <div style={{
                      borderTop: "1px solid #dbeafe", paddingTop: 11,
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                    }}>
                      <small style={{ color: "#526b8b" }}>Last update</small>
                      <small style={{ color: "#24476e", fontWeight: 750 }}>
                        {formatTime(station.last_updated)}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {simulation && stations.length === 0 && (
          <p style={styles.muted}>No station updates are available.</p>
        )}
        {!simulation && !simulationError && <p style={styles.muted}>Waiting for station data…</p>}

        <p style={{ ...styles.muted, marginTop: 17 }}>
          ⓘ Simulation data only. No official live train status or passenger counts are connected.
        </p>
      </section>
    </div>
  );
}