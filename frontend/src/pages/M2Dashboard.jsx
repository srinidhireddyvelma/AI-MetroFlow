
import { useCallback, useEffect, useState } from "react";
import { request } from "../services/api";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const HYDERABAD_CENTER = [17.425, 78.46];

const HYDERABAD_BOUNDS = {
  minLat: 17.2,
  maxLat: 17.7,
  minLon: 78.2,
  maxLon: 78.7,
};

function Metric({ label, value, note, accent = "cyan" }) {
  return (
    <article className="dashboard-card analytics-metric">
      <span className={`metric-accent ${accent}`} />
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value ?? "—"}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function Panel({ title, eyebrow, children, className = "" }) {
  return (
    <section className={`dashboard-card analytics-panel ${className}`}>
      <div className="analytics-panel-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function safeNumber(value, digits = 0) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      })
    : "—";
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

export default function M2Dashboard() {
  const [peakHours, setPeakHours] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [demand, setDemand] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [delay, setDelay] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [heatmap, setHeatmap] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [announcementBusy, setAnnouncementBusy] = useState(false);
  const [realtimeBusy, setRealtimeBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionError("");

    try {
      // Load the existing GET endpoints independently of the demo
      // prediction requests so one failed section doesn't hide the others.
      const initialResults = await Promise.allSettled([
        request("/api/peak-hours/summary"),
        request("/api/traffic/summary"),
        request("/api/heatmap/data"),
      ]);

      const [peakResult, trafficResult, heatmapResult] = initialResults;
      const initialErrors = [];

      if (peakResult.status === "fulfilled") {
        setPeakHours(peakResult.value.peak_hours || []);
      } else {
        setPeakHours([]);
        initialErrors.push(
          `Peak-hour analysis: ${getErrorMessage(peakResult.reason)}`
        );
      }

      if (trafficResult.status === "fulfilled") {
        setTraffic(trafficResult.value.traffic_analysis || []);
      } else {
        setTraffic([]);
        initialErrors.push(
          `Traffic analysis: ${getErrorMessage(trafficResult.reason)}`
        );
      }

      if (heatmapResult.status === "fulfilled") {
        setHeatmap(heatmapResult.value.heatmap || []);
      } else {
        setHeatmap([]);
        initialErrors.push(
          `Station map: ${getErrorMessage(heatmapResult.reason)}`
        );
      }

      // These requests use example inputs. They are demonstration outputs,
      // not verified live Hyderabad Metro operational measurements.
      const demoResults = await Promise.allSettled([
        request("/api/demand/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hour: 17,
            day_of_week: 2,
            day_of_year: 200,
            month: 7,
            lag_1: 650,
            lag_24: 500,
            lag_168: 550,
          }),
        }),

        request("/api/schedule/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            avg_ridership: 660,
            current_frequency: 10,
          }),
        }),

        request("/api/delay/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delay_minutes: 12,
            scheduled_frequency: 10,
          }),
        }),

        request("/api/recommendations/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            predicted_ridership: 660,
            traffic_level: "high",
            delay_minutes: 12,
          }),
        }),

        request("/api/alerts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            predicted_ridership: 800,
            traffic_level: "high",
            delay_minutes: 20,
          }),
        }),
      ]);

      const [
        demandResult,
        scheduleResult,
        delayResult,
        recommendationsResult,
        alertsResult,
      ] = demoResults;

      if (demandResult.status === "fulfilled") {
        setDemand(demandResult.value);
      } else {
        setDemand(null);
        initialErrors.push(
          `Demand forecast: ${getErrorMessage(demandResult.reason)}`
        );
      }

      if (scheduleResult.status === "fulfilled") {
        setSchedule(scheduleResult.value);
      } else {
        setSchedule(null);
        initialErrors.push(
          `Schedule optimization: ${getErrorMessage(scheduleResult.reason)}`
        );
      }

      if (delayResult.status === "fulfilled") {
        setDelay(delayResult.value);
      } else {
        setDelay(null);
        initialErrors.push(
          `Delay analysis: ${getErrorMessage(delayResult.reason)}`
        );
      }

      if (recommendationsResult.status === "fulfilled") {
        setRecommendations(
          recommendationsResult.value.recommendations || []
        );
      } else {
        setRecommendations([]);
        initialErrors.push(
          `Recommendations: ${getErrorMessage(
            recommendationsResult.reason
          )}`
        );
      }

      const generatedAlerts =
        alertsResult.status === "fulfilled"
          ? alertsResult.value
          : null;

      if (generatedAlerts) {
        setAlerts(generatedAlerts.alerts || []);
      } else {
        setAlerts([]);
        initialErrors.push(
          `Alerts: ${getErrorMessage(alertsResult.reason)}`
        );
      }

      // This endpoint receives demonstration values. It is not a live
      // passenger or operations count.
      try {
        const analyticsResponse = await request("/api/analytics/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            total_passengers: 12424238,
            active_alerts: generatedAlerts?.alert_count || 0,
            delayed_trains: 1,
            average_delay: 8,
            peak_crowd_level: "high",
          }),
        });

        setAnalytics(analyticsResponse.analytics || null);
      } catch (analyticsError) {
        setAnalytics(null);
        initialErrors.push(
          `Operations summary: ${getErrorMessage(analyticsError)}`
        );
      }

      if (initialErrors.length > 0) {
        setError(
          `Some sections could not load. ${initialErrors.join(" | ")}`
        );
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const hyderabadStations = heatmap.filter((point) => {
    const latitude = Number(point.latitude);
    const longitude = Number(point.longitude);

    return (
      point.station &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= HYDERABAD_BOUNDS.minLat &&
      latitude <= HYDERABAD_BOUNDS.maxLat &&
      longitude >= HYDERABAD_BOUNDS.minLon &&
      longitude <= HYDERABAD_BOUNDS.maxLon
    );
  });

  // Creating an announcement is now a deliberate user action, not a
  // side effect of opening the dashboard.
  async function handleCreateAnnouncement() {
    setAnnouncementBusy(true);
    setActionError("");

    try {
      const response = await request("/api/announcements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Demo Platform Safety Alert",
          message:
            "Demonstration announcement: please follow station staff instructions and move safely.",
          severity: "high",
          station: "Miyapur",
        }),
      });

      setAnnouncement(response.announcement || response);
    } catch (actionError) {
      setActionError(
        `Could not create the demo announcement: ${getErrorMessage(
          actionError
        )}`
      );
    } finally {
      setAnnouncementBusy(false);
    }
  }

  // This sends an explicitly labelled example station update only when
  // the user clicks the button.
  async function handleSimulateStationUpdate() {
    setRealtimeBusy(true);
    setActionError("");

    try {
      const response = await request("/api/realtime/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station: "Miyapur",
          crowd_level: "high",
          train_status: "delayed",
          delay_minutes: 8,
        }),
      });

      setRealtime(response);
    } catch (actionError) {
      setActionError(
        `Could not submit the example station update: ${getErrorMessage(
          actionError
        )}`
      );
    } finally {
      setRealtimeBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <span className="loading-pulse" />
          <h2>Preparing AI Analytics</h2>
          <p>Loading model results and station locations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="eyebrow">INTELLIGENCE &amp; DECISION SUPPORT</p>
          <h1>AI Analytics</h1>
          <p className="analytics-subtitle">
            Demand forecasting, service planning, alerts, and station
            locations for the AI-MetroFlow demonstration.
          </p>
        </div>

        <span className="demo-pill">
          <span className="status-dot" />
          DEMO DATA
        </span>
      </header>


      {error && (
        <div className="notice notice-error">
          <strong>Some analytics could not load</strong>
          <span>{error}</span>
          <p>
            Check that the backend is running and your session is valid.
            Available sections can still be used.
          </p>
          <button
            type="button"
            className="analytics-action-button"
            onClick={loadDashboard}
          >
            Retry analytics
          </button>
        </div>
      )}

      {actionError && (
        <div className="notice notice-error">
          <strong>Action not completed</strong>
          <span>{actionError}</span>
        </div>
      )}

      <section className="analytics-metrics">
        <Metric
          label="Predicted ridership"
          value={
            demand?.predicted_ridership != null
              ? safeNumber(demand.predicted_ridership)
              : "—"
          }
          note="Demo model output"
          accent="cyan"
        />

        <Metric
          label="Recommended frequency"
          value={
            schedule?.recommended_frequency_minutes != null
              ? `${safeNumber(
                  schedule.recommended_frequency_minutes
                )} min`
              : "—"
          }
          note={schedule?.demand_level || "Demo schedule output"}
          accent="green"
        />

        <Metric
          label="Delay analyzed"
          value={
            delay?.delay_minutes != null
              ? `${safeNumber(delay.delay_minutes)} min`
              : "—"
          }
          note={delay?.severity || "Demo delay scenario"}
          accent="amber"
        />

        <Metric
          label="Generated alerts"
          value={alerts.length}
          note="Example scenario only"
          accent="red"
        />
      </section>

      <section className="analytics-grid">
        <Panel title="Demand forecast" eyebrow="PREDICTIVE MODEL">
          <div className="analytics-data-row">
            <span>Predicted ridership</span>
            <strong>
              {demand?.predicted_ridership != null
                ? safeNumber(demand.predicted_ridership)
                : "Not available"}
            </strong>
          </div>

          <div className="analytics-data-row">
            <span>Forecast status</span>
            <strong>{demand ? "Response received" : "Unavailable"}</strong>
          </div>

          <p className="panel-description">
            The existing forecasting API receives fixed demonstration
            inputs. Its output is not a verified Hyderabad station-specific
            forecast.
          </p>
        </Panel>

        <Panel title="Schedule optimization" eyebrow="SERVICE PLANNING">
          <div className="analytics-data-row">
            <span>Demand level</span>
            <strong>{schedule?.demand_level || "Not available"}</strong>
          </div>

          <div className="analytics-data-row">
            <span>Recommended frequency</span>
            <strong>
              {schedule?.recommended_frequency_minutes != null
                ? `${safeNumber(
                    schedule.recommended_frequency_minutes
                  )} min`
                : "Not available"}
            </strong>
          </div>

          <p className="panel-description">
            {schedule?.action ||
              "No scheduling recommendation returned by the API."}
          </p>
          <p className="panel-description">
            Recommendation is based on example ridership and frequency
            values, not a verified live timetable.
          </p>
        </Panel>

        <Panel title="Delay analysis" eyebrow="SERVICE RELIABILITY">
          <div className="analytics-data-row">
            <span>Analyzed delay</span>
            <strong>
              {delay?.delay_minutes != null
                ? `${safeNumber(delay.delay_minutes)} min`
                : "Not available"}
            </strong>
          </div>

          <div className="analytics-data-row">
            <span>Severity</span>
            <strong>{delay?.severity || "Not available"}</strong>
          </div>

          <p className="panel-description">
            {delay?.recommended_action ||
              "No delay recommendation returned by the API."}
          </p>
          <p className="panel-description">
            This is analysis of an example delay, not a live train status.
          </p>
        </Panel>

        <Panel title="AI recommendations" eyebrow="DECISION SUPPORT">
          {recommendations.length > 0 ? (
            <ul className="recommendation-list">
              {recommendations.map((item, index) => (
                <li key={`${index}-${String(item)}`}>
                  <span className="recommendation-bullet">✳</span>
                  <span>{String(item)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-description">
              No recommendations were returned by the API.
            </p>
          )}

          <p className="panel-description">
            Recommendations are generated from the demonstration scenario.
          </p>
        </Panel>

        <Panel title="Peak-hour analysis" eyebrow="DEMAND PATTERNS">
          {peakHours.length > 0 ? (
            <div className="analytics-list">
              {peakHours.slice(0, 8).map((item, index) => (
                <div
                  className="analytics-data-row"
                  key={`${item.hour}-${index}`}
                >
                  <span>{String(item.hour).padStart(2, "0")}:00</span>
                  <span>{item.demand_level || "Unclassified"}</span>
                  <strong>{safeNumber(item.avg_ridership)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-description">
              No peak-hour summary data available.
            </p>
          )}

          <p className="panel-description">
            The source dataset has not been verified as Hyderabad-specific.
          </p>
        </Panel>

        <Panel title="Traffic analysis" eyebrow="NETWORK ACTIVITY">
          {traffic.length > 0 ? (
            <div className="analytics-list">
              {traffic.slice(0, 8).map((item, index) => (
                <div
                  className="analytics-data-row"
                  key={`${item.line}-${index}`}
                >
                  <span>{item.line || `Group ${index + 1}`}</span>
                  <strong>{item.traffic_level || "Unclassified"}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-description">
              No traffic analysis data available.
            </p>
          )}

          <p className="panel-description">
            Existing traffic analysis uses the backend traffic dataset. It
            should not be interpreted as verified live Hyderabad traffic.
          </p>
        </Panel>

        <Panel title="Operational alerts" eyebrow="ALERT CENTER">
          {alerts.length > 0 ? (
            <div className="analytics-list">
              {alerts.map((alert, index) => (
                <div
                  className="alert-row"
                  key={`${alert.type || "alert"}-${index}`}
                >
                  <span className="alert-mark">!</span>
                  <div className="alert-copy">
                    <strong>{alert.type || "Operational alert"}</strong>
                    <small>
                      Severity: {alert.severity || "Unspecified"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-description">
              No alerts were returned for the example scenario.
            </p>
          )}

          <p className="panel-description">
            These are generated demonstration alerts, not verified active
            emergencies.
          </p>
        </Panel>

        <Panel title="Emergency announcement" eyebrow="COMMUNICATIONS">
          {announcement ? (
            <>
              <div className="analytics-data-row">
                <span>Station</span>
                <strong>{announcement.station || "Not specified"}</strong>
              </div>

              <div className="analytics-data-row">
                <span>Severity</span>
                <strong>{announcement.severity || "Unspecified"}</strong>
              </div>

              <h3 className="announcement-title">
                {announcement.title || "Announcement"}
              </h3>

              <p className="panel-description">
                {announcement.message || "No message provided."}
              </p>
            </>
          ) : (
            <p className="panel-description">
              No announcement has been submitted from this page during
              this session.
            </p>
          )}

          <p className="panel-description">
            Clicking the button submits an example announcement to the
            backend. Depending on backend behavior, it may be stored.
          </p>

          <button
            type="button"
            className="analytics-action-button"
            onClick={handleCreateAnnouncement}
            disabled={announcementBusy}
          >
            {announcementBusy
              ? "Submitting announcement…"
              : "Create demo announcement"}
          </button>
        </Panel>

        <Panel title="Station update" eyebrow="SIMULATED STATUS">
          {realtime ? (
            <>
              <div className="analytics-data-row">
                <span>Station</span>
                <strong>{realtime.station || "Miyapur"}</strong>
              </div>

              <div className="analytics-data-row">
                <span>Crowd level</span>
                <strong>{realtime.crowd_level || "Unknown"}</strong>
              </div>

              <div className="analytics-data-row">
                <span>Train status</span>
                <strong>{realtime.train_status || "Unknown"}</strong>
              </div>

              <div className="analytics-data-row">
                <span>Example delay</span>
                <strong>
                  {realtime.delay_minutes != null
                    ? `${safeNumber(realtime.delay_minutes)} min`
                    : "Not available"}
                </strong>
              </div>
            </>
          ) : (
            <p className="panel-description">
              No example station update has been submitted from this page
              during this session.
            </p>
          )}

          <p className="panel-description">
            This button submits a demonstration update. It does not connect
            to a live Hyderabad Metro operations feed.
          </p>

          <button
            type="button"
            className="analytics-action-button"
            onClick={handleSimulateStationUpdate}
            disabled={realtimeBusy}
          >
            {realtimeBusy
              ? "Submitting update…"
              : "Submit demo station update"}
          </button>
        </Panel>

        <Panel title="Operations summary" eyebrow="AGGREGATED ANALYTICS">
          {analytics ? (
            <>
              <div className="analytics-data-row">
                <span>Passenger count input</span>
                <strong>
                  {analytics.total_passengers != null
                    ? safeNumber(analytics.total_passengers)
                    : "—"}
                </strong>
              </div>

              <div className="analytics-data-row">
                <span>Alerts</span>
                <strong>{analytics.active_alerts ?? "—"}</strong>
              </div>

              <div className="analytics-data-row">
                <span>Delayed trains</span>
                <strong>{analytics.delayed_trains ?? "—"}</strong>
              </div>

              <div className="analytics-data-row">
                <span>Average delay</span>
                <strong>
                  {analytics.average_delay_minutes != null
                    ? `${safeNumber(
                        analytics.average_delay_minutes
                      )} min`
                    : "—"}
                </strong>
              </div>

              <div className="analytics-data-row">
                <span>Peak crowd level</span>
                <strong>{analytics.peak_crowd_level || "—"}</strong>
              </div>
            </>
          ) : (
            <p className="panel-description">
              No operations summary returned.
            </p>
          )}

          <p className="panel-description">
            The submitted passenger count, delay, and other summary values
            are example inputs. They are not measured Hyderabad Metro
            operational statistics.
          </p>
        </Panel>

        <Panel
          title="Hyderabad Metro stations"
          eyebrow="GEOGRAPHIC VIEW"
          className="heatmap-panel"
        >
          <p className="panel-description">
            Markers represent approximate station locations only. They do
            not indicate passenger counts, crowd intensity, train delays,
            or live service conditions.
          </p>

          <div className="heatmap-info">
            {hyderabadStations.length} Hyderabad-area station locations
          </div>

          {hyderabadStations.length === 0 && (
            <p className="panel-description">
              No station locations were returned inside the Hyderabad map
              bounds. Check the backend heatmap endpoint and its coordinates.
            </p>
          )}

          <MapContainer
            center={HYDERABAD_CENTER}
            zoom={11}
            scrollWheelZoom
            className="metro-heatmap"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {hyderabadStations.map((point, index) => (
              <CircleMarker
                key={`${point.station}-${index}`}
                center={[
                  Number(point.latitude),
                  Number(point.longitude),
                ]}
                radius={7}
                pathOptions={{
                  color: "#4ed9f5",
                  fillColor: "#4ed9f5",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{point.station}</strong>
                  <br />
                  Station location
                  <br />
                  Crowd data: Not available
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </Panel>
      </section>

      <footer className="app-footer">
        <span>AI-MetroFlow · AI Analytics</span>
        <span>Demonstration data · Not an official metro feed</span>
      </footer>
    </div>
  );
}