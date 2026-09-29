

import { useState } from "react";
import { trips, locations, locationCoords } from "../data/trips";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

const customIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    width: 24px; height: 24px;
    background: #2d5f3f;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});                                                     

function getCoords(trip, type) {
  if (type === "from") {
    return trip.fromCoords || locationCoords[trip.from] || [25.5788, 91.8933];
  }
  return trip.toCoords || locationCoords[trip.to] || [25.5788, 91.8933];
}


function FindRide() {
  const [from, setFrom] = useState("Sohra");
  const [to, setTo] = useState("Shillong");
  const [maxFare, setMaxFare] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [minRating, setMinRating] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [requested, setRequested] = useState([]);
  const [modalTrip, setModalTrip] = useState(null);

  function handleSearch() {
    const saved = JSON.parse(localStorage.getItem("emptyTripListings") || "[]");
    const allTrips = [...trips, ...saved];

    let filtered = allTrips.filter((t) => t.from === from && t.to === to);
    if (maxFare) filtered = filtered.filter((t) => t.fare && t.fare <= Number(maxFare));
    if (minSeats) filtered = filtered.filter((t) => t.seats && t.seats >= Number(minSeats));
    if (minRating) filtered = filtered.filter((t) => t.rating && t.rating >= Number(minRating));

    setResults(filtered);
    setSearched(true);
  }

  function confirmRequest() {
    const updated = [...requested, modalTrip.id];
    setRequested(updated);
    localStorage.setItem("emptyTripRequests", JSON.stringify(updated));
    setModalTrip(null);
  }

  function availableSeats(trip) {
    const booked = requested.filter((id) => id === trip.id).length;
    const total = trip.seats || 3;
    return Math.max(total - booked, 0);
  }

  return (
    <div className="page">

      <div className="section" style={{ paddingBottom: "32px" }}>
        <div className="eyebrow">Find a Ride</div>
        <h1 className="section-title">Return journeys.</h1>
        <p style={{ fontSize: "16px", color: "#4b5563", maxWidth: "520px" }}>
          Search taxis already returning from your destination.
        </p>
      </div>

      {/* SEARCH FORM */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <div className="form-grid">
          <div>
            <label className="field-label">From</label>
            <select className="field-input" value={from} onChange={(e) => setFrom(e.target.value)}>
              {locations.map((loc) => <option key={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">To</label>
            <select className="field-input" value={to} onChange={(e) => setTo(e.target.value)}>
              {locations.map((loc) => <option key={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Max Fare (₹)</label>
            <input className="field-input" type="number" value={maxFare} onChange={(e) => setMaxFare(e.target.value)} placeholder="Any" />
          </div>
          <div>
            <label className="field-label">Min Seats</label>
            <input className="field-input" type="number" value={minSeats} onChange={(e) => setMinSeats(e.target.value)} placeholder="Any" />
          </div>
          <div>
            <label className="field-label">Min Rating</label>
            <input className="field-input" type="number" step="0.1" value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder="Any" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSearch} style={{ marginTop: "22px" }}>
          Search Trips
        </button>
      </div>

      {/* EMPTY */}
      {searched && results.length === 0 && (
        <div className="empty-state" style={{ marginBottom: "32px" }}>
          <p>No return trips found for this route yet.</p>
          <button className="btn btn-secondary">Notify Me</button>
        </div>
      )}

      {/* RESULTS */}
      <div style={{ display: "grid", gap: "16px", paddingBottom: "40px" }}>
        {results.map((trip) => {
          const seatsLeft = availableSeats(trip);
          const isRequested = requested.includes(trip.id);

          return (
            <div key={trip.id} className="ride-card">
              <div>
                <div className="ride-route">{trip.from} → {trip.to}</div>
                <div className="ride-meta">
                  <strong style={{ color: "#0f172a" }}>{trip.driver || "Driver"}</strong>
                  {trip.rating ? ` · ⭐ ${trip.rating}` : ""}
                  {trip.vehicle ? ` · ${trip.vehicle}` : ""}
                </div>
                <div className="ride-meta">
                  {trip.departure || ""}
                  {` · ${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`}
                  {trip.pickup ? ` · Pickup at ${trip.pickup}` : ""}
                </div>
                {trip.fare && (
                  <div className="ride-fare">
                    ₹{trip.fare} <span className="ride-fare-unit">/person</span>
                  </div>
                )}
              </div>
              <div>
                {isRequested ? (
                  <div className="alert alert-success" style={{ fontSize: "14px" }}>
                    ✓ Request Sent
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={() => setModalTrip(trip)}>
                    Request Ride
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modalTrip && (
        <div
          onClick={() => setModalTrip(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(28, 25, 23, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "460px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{
              fontSize: "22px", fontWeight: "800", color: "#0f172a",
              marginBottom: "6px", letterSpacing: "-0.02em",
            }}>
              Confirm your request
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
              The driver will be notified and will confirm shortly.
            </p>

            {/* MAP */}
            {/* REAL MAP */}
<div style={{
  borderRadius: "12px",
  overflow: "hidden",
  marginBottom: "20px",
  border: "1px solid #e5e7eb",
  height: "220px",
  position: "relative",
  zIndex: 0,
}}>
  <MapContainer
  center={modalTrip.fromCoords || [25.5788, 91.8933]}
  zoom={8}
  scrollWheelZoom={false}
  style={{ height: "100%", width: "100%", zIndex: 0 }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="© OpenStreetMap"
  />
  {modalTrip.toCoords && (
    <Marker position={getCoords(modalTrip, "to")} icon={customIcon}>
      <Popup>{modalTrip.to}</Popup>
    </Marker>
  )}
  <Marker position={getCoords(modalTrip, "to")} icon={customIcon}>
  <Popup>{modalTrip.to}</Popup>
</Marker>
<Marker position={getCoords(modalTrip, "from")} icon={customIcon}>
  <Popup>{modalTrip.from} · {modalTrip.driver}</Popup>
</Marker>
<Polyline
  positions={[getCoords(modalTrip, "from"), getCoords(modalTrip, "to")]}
  color="#2d5f3f"
  weight={3}
  dashArray="6, 8"
/>
  
</MapContainer>

  <div style={{
    position: "absolute",
    bottom: "10px", left: "10px", right: "10px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
    zIndex: 500,
    pointerEvents: "none",
  }}>
    {modalTrip.from} → {modalTrip.to}
  </div>
</div>

            {/* DRIVER PROFILE */}
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "16px", background: "#f7f6f3",
              borderRadius: "12px", marginBottom: "16px",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "#2d5f3f", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", fontWeight: "800",
              }}>
                {(modalTrip.driver || "D").split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                  {modalTrip.driver || "Driver"}
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  {modalTrip.rating ? `⭐ ${modalTrip.rating} · ` : ""}
                  {modalTrip.vehicle || "Vehicle"}
                </div>
              </div>
            </div>

            {/* TRIP DETAILS */}
            <div style={{ marginBottom: "20px" }}>
              <Row label="Departure" value={modalTrip.departure || "—"} />
              <Row label="Seats available" value={`${availableSeats(modalTrip)}`} />
              {modalTrip.fare && <Row label="Fare" value={`₹${modalTrip.fare} / person`} />}
              {modalTrip.pickup && <Row label="Pickup point" value={modalTrip.pickup} />}
            </div>

            {/* CALL DRIVER */}
            {modalTrip.phone && (
              <a
                href={`tel:${modalTrip.phone}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#f0fdf4",
                  color: "#2d5f3f",
                  border: "1px solid #d1e3d8",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  textDecoration: "none",
                  marginBottom: "12px",
                }}
              >
                📞 Call {modalTrip.driver || "Driver"}
              </a>
            )}

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setModalTrip(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRequest}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      padding: "8px 0",
      borderBottom: "1px solid #f5f5f4",
    }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ color: "#0f172a", fontWeight: "600" }}>{value}</span>
    </div>
  );
}

export default FindRide;
