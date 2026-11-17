import { useEffect, useState } from "react";
import Login from "./pages/Login";
import CrowdMonitoring from "./pages/CrowdMonitoring";
import Congestion from "./pages/Congestion";
import M2Dashboard from "./pages/M2Dashboard";
import {
  getStoredUser,
  logout,
  getRealtimeSimulation,
} from "./services/api";
import "./App.css";

const navigation = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "crowd", icon: "◉", label: "Crowd Monitoring" },
  { id: "congestion", icon: "⌁", label: "Congestion" },
  { id: "m2", icon: "✳", label: "AI Analytics" },
];

// Published network information, separate from simulated readings.
const metroLines = [
  {
    name: "Red Line",
    route: "Miyapur → LB Nagar",
    color: "#f87171",
  },
  {
    name: "Blue Line",
    route: "Nagole → Raidurg",
    color: "#60a5fa",
  },
  {
    name: "Green Line",
    route: "JBS Parade Ground → MGBS",
    color: "#4ade80",
  },
];

const crowdLevels = [
  { label: "Critical", value: "critical", color: "danger" },
  { label: "High", value: "high", color: "warning" },
  { label: "Normal", value: "normal", color: "success" },
  { label: "Low", value: "low", color: "cyan" },
];

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [activePage, setActivePage] = useState("dashboard");
  const [crowdData, setCrowdData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  // Refresh simulated Hyderabad Metro station readings every 10 seconds.
  useEffect(() => {
    let cancelled = false;
    let inProgress = false;
    let intervalId;

    async function loadDashboardData() {
      if (cancelled || inProgress || !user) return;

      inProgress = true;

      try {
        setDataError("");

        const data = await getRealtimeSimulation();

        if (!cancelled) {
          setCrowdData(data);
        }
      } catch (error) {
        if (!cancelled) {
          setDataError(
            error.message ||
              "Unable to load simulated station data."
          );
        }
      } finally {
        inProgress = false;

        if (!cancelled) {
          setDataLoading(false);
        }
      }
    }

    if (!user) {
      setDataLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setDataLoading(true);
    loadDashboardData();

    intervalId = window.setInterval(
      loadDashboardData,
      10000
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user]);

  function handleLogin(loginData) {
    setUser({
      username: loginData.username,
      role: loginData.role,
    });
    setActivePage("dashboard");
  }

  function handleLogout() {
    logout();
    setUser(null);
    setCrowdData(null);
    setDataError("");
    setActivePage("dashboard");
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // The simulation endpoint returns:
  // { source: "simulation", count: 12, updates: [...] }
  const updates = Array.isArray(crowdData?.updates)
    ? crowdData.updates
    : [];

  const stationCount = updates.length;

  const countByLevel = (level) =>
    updates.filter(
      (station) =>
        String(station.crowd_level || "").toLowerCase() === level
    ).length;

  const criticalCount = countByLevel("critical");
  const highCount = countByLevel("high");
  const normalCount = countByLevel("normal");
  const lowCount = countByLevel("low");

  const updatedAt = updates.reduce((latest, station) => {
    const value = station.last_updated;
    if (!value) return latest;

    const time = new Date(value).getTime();
    return Number.isFinite(time) && time > latest
      ? time
      : latest;
  }, 0);

  function renderDashboard() {
    return (
      <>
        <header className="topbar">
          <div>
            <p className="eyebrow">
              HYDERABAD METRO · OPERATIONS CENTER
            </p>
            <h1>Network Dashboard</h1>
            <p className="topbar-subtitle">
              Published network information and simulated
              station monitoring.
            </p>
          </div>

          <div className="user-section">
            <span className="demo-pill">
              <span className="status-dot" />
              SIMULATION MODE
            </span>

            <div className="user-avatar">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="user-info">
              <strong>{user.username}</strong>
              <span>{user.role}</span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>

        <section className="hero-banner">
          <div className="hero-copy">
            <span className="hero-kicker">
              METRO INTELLIGENCE PLATFORM
            </span>

            <h2>Good to see you, {user.username}.</h2>

            <p>
              Explore Hyderabad Metro's published network
              information and monitor automatically refreshed
              simulated station conditions.
            </p>

            <button
              className="primary-button"
              onClick={() => setActivePage("m2")}
            >
              Explore AI Analytics <span>↗️</span>
            </button>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit-core">MF</div>
            <span className="orbit-node node-one">AI</span>
            <span className="orbit-node node-two">3</span>
            <span className="orbit-node node-three">↗️</span>
          </div>
        </section>

        <div className="section-heading">
          <div>
            <p className="eyebrow">NETWORK AND SIMULATION</p>
            <h2>Hyderabad Metro Overview</h2>
          </div>

          <span className="muted-label">
            Network facts and simulated conditions
          </span>
        </div>

        {dataError && (
          <div className="notice notice-error">
            <strong>Simulation update unavailable</strong>
            <span>{dataError}</span>
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon cyan">↔️</div>
            <div className="stat-content">
              <span className="stat-label">
                Phase I network length
              </span>
              <strong className="stat-value">69 km</strong>
              <small>Published network information</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon purple">≋</div>
            <div className="stat-content">
              <span className="stat-label">
                Operational corridors
              </span>
              <strong className="stat-value">3</strong>
              <small>Red, Blue and Green Lines</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">◉</div>
            <div className="stat-content">
              <span className="stat-label">
                Simulated stations
              </span>
              <strong className="stat-value">
                {dataLoading && !crowdData
                  ? "…"
                  : stationCount}
              </strong>
              <small>Generated station conditions</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon amber">⚠</div>
            <div className="stat-content">
              <span className="stat-label">
                High / critical stations
              </span>
              <strong className="stat-value">
                {dataLoading && !crowdData
                  ? "…"
                  : highCount + criticalCount}
              </strong>
              <small>Simulated classifications only</small>
            </div>
          </article>
        </section>

        <p className="data-disclaimer">
          <span>ⓘ</span>
          <strong>Simulation notice:</strong> Station conditions
          and train-delay values are randomly generated for
          demonstration and refresh every 10 seconds. They are
          not actual passenger counts, verified crowd levels,
          or live train operations.
        </p>

        <section className="dashboard-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">PHASE I ROUTES</p>
                <h3>Metro Corridors</h3>
                <p>Published route endpoints.</p>
              </div>
              <span className="panel-icon">⇄</span>
            </div>

            <div className="route-list">
              {metroLines.map((line) => (
                <div
                  className="distribution-item"
                  key={line.name}
                >
                  <div className="distribution-label">
                    <span>
                      <i
                        className="legend-dot"
                        style={{ backgroundColor: line.color }}
                      />
                      {line.name}
                    </span>
                  </div>
                  <strong>{line.route}</strong>
                </div>
              ))}
            </div>

            <p className="data-disclaimer">
              Refer to HMRL for the latest official route and
              service information.
            </p>

            <a
              href="https://hmrl.co.in/train-timings/"
              target="_blank"
              rel="noreferrer"
              className="shortcut-row"
            >
              <span className="shortcut-icon cyan">↗️</span>
              <span className="shortcut-copy">
                <strong>Official route and train information</strong>
                <small>Open the HMRL website</small>
              </span>
              <span className="shortcut-arrow">↗️</span>
            </a>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">DATA TRANSPARENCY</p>
                <h3>Monitoring Status</h3>
                <p>What this demonstration currently provides.</p>
              </div>
              <span className="panel-icon">◫</span>
            </div>

            <div className="overview-list">
              <div className="overview-item">
                <span>Official network profile</span>
                <strong className="online">● Published</strong>
              </div>

              <div className="overview-item">
                <span>Simulation endpoint</span>
                <strong>
                  {dataLoading
                    ? "Loading"
                    : crowdData
                      ? "● Connected"
                      : "Unavailable"}
                </strong>
              </div>

              <div className="overview-item">
                <span>Simulated station updates</span>
                <strong>
                  {stationCount
                    ? `${stationCount} stations`
                    : "Waiting for data"}
                </strong>
              </div>

              {updatedAt > 0 && (
                <div className="overview-item">
                  <span>Latest station timestamp</span>
                  <strong>
                    {new Date(updatedAt).toLocaleTimeString()}
                  </strong>
                </div>
              )}
            </div>

            <p className="data-disclaimer">
              A successful simulation response does not mean
              that a verified live operational feed is connected.
            </p>
          </article>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">SOURCE REFERENCES</p>
              <h3>Official Hyderabad Metro Information</h3>
              <p>
                Use these sources to verify published network
                information.
              </p>
            </div>
          </div>

          <a
            className="shortcut-row"
            href="https://hmrl.co.in/about-hmrl/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="shortcut-icon cyan">↗️</span>
            <span className="shortcut-copy">
              <strong>About Hyderabad Metro Rail</strong>
              <small>Network and corridor overview</small>
            </span>
            <span className="shortcut-arrow">↗️</span>
          </a>

          <a
            className="shortcut-row"
            href="https://hmrl.co.in/open-data/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="shortcut-icon purple">↗️</span>
            <span className="shortcut-copy">
              <strong>HMRL Open Data</strong>
              <small>Published transit data and terms</small>
            </span>
            <span className="shortcut-arrow">↗️</span>
          </a>

          <a
            className="shortcut-row"
            href="https://ltmetro.com/wp-content/uploads/2025/01/HMRRouteMap_new.pdf"
            target="_blank"
            rel="noreferrer"
          >
            <span className="shortcut-icon green">↗️</span>
            <span className="shortcut-copy">
              <strong>Official Metro Network Map</strong>
              <small>Published route map PDF</small>
            </span>
            <span className="shortcut-arrow">↗️</span>
          </a>
        </section>

        <section className="dashboard-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">SIMULATED STATION CONDITIONS</p>
                <h3>Crowd Classification Breakdown</h3>
                <p>
                  Counts reflect the current simulation response,
                  not measured passenger volumes.
                </p>
              </div>
              <span className="panel-icon">◫</span>
            </div>

            {crowdLevels.map((level) => {
              const value = countByLevel(level.value);
              const percent = stationCount
                ? (value / stationCount) * 100
                : 0;

              return (
                <div
                  className="distribution-item"
                  key={level.value}
                >
                  <div className="distribution-label">
                    <span>
                      <i className={`legend-dot ${level.color}`} />
                      {level.label}
                    </span>
                    <strong>
                      {dataLoading && !crowdData
                        ? "…"
                        : value}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${level.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <small>
                    {percent.toFixed(1)}% of simulated stations
                  </small>
                </div>
              );
            })}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">PLATFORM</p>
                <h3>Operations Shortcuts</h3>
                <p>Open your existing monitoring tools.</p>
              </div>
              <span className="panel-icon">⌘</span>
            </div>

            <button
              className="shortcut-row"
              onClick={() => setActivePage("crowd")}
            >
              <span className="shortcut-icon cyan">◉</span>
              <span className="shortcut-copy">
                <strong>Crowd Monitoring</strong>
                <small>
                  Inspect simulated station conditions and alerts
                </small>
              </span>
              <span className="shortcut-arrow">↗️</span>
            </button>

            <button
              className="shortcut-row"
              onClick={() => setActivePage("congestion")}
            >
              <span className="shortcut-icon amber">⌁</span>
              <span className="shortcut-copy">
                <strong>Congestion Tracking</strong>
                <small>Review station activity demonstration</small>
              </span>
              <span className="shortcut-arrow">↗️</span>
            </button>

            <button
              className="shortcut-row"
              onClick={() => setActivePage("m2")}
            >
              <span className="shortcut-icon purple">✳</span>
              <span className="shortcut-copy">
                <strong>AI Analytics</strong>
                <small>Forecasts, delays and recommendations</small>
              </span>
              <span className="shortcut-arrow">↗️</span>
            </button>
          </article>
        </section>

        <footer className="app-footer">
          <span>
            AI-MetroFlow <b>v1.0</b>
          </span>
          <span>
            Demonstration with simulated station readings
          </span>
        </footer>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">M</div>
          <div>
            <h1>AI-MetroFlow</h1>
            <p>METRO INTELLIGENCE</p>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => setActivePage(item.id)}
              aria-current={
                activePage === item.id ? "page" : undefined
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && (
                <span className="nav-active-mark" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-demo-card">
            <span className="status-dot" />
            <div>
              <strong>Simulation mode</strong>
              <small>Verified live feed not connected</small>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar small">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="user-info">
              <strong>{user.username}</strong>
              <span>{user.role}</span>
            </div>

            <button
              className="sidebar-logout"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              ↗️
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {activePage === "dashboard" && renderDashboard()}
        {activePage === "crowd" && <CrowdMonitoring simulation={crowdData} />}
        {activePage === "congestion" && <Congestion />}
        {activePage === "m2" && <M2Dashboard />}
      </main>
    </div>
  );
}

export default App;