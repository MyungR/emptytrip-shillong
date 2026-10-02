import { useState, useEffect } from "react";
import { locations } from "../data/trips";
import { createTrip, listMyTrips, listRequestsForDriver } from "../lib/api";

function requestStatusLabel(status) {
  if (status === "pending") return "✓ Pending confirmation";
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  return status;
}

function ListTrip() {
  const [form, setForm] = useState({
    driver: "",
    phone: "",
    from: "Sohra",
    to: "Shillong",
    date: "",
    departure: "",
    seats: "",
    vehicle: "",
    fare: "",
    notes: "",
  });
  const [listed, setListed] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [requests, setRequests] = useState([]);
  const [requestsError, setRequestsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listMyTrips()
      .then((trips) => {
        if (!cancelled) setListed(trips);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Could not load your listed trips.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listRequestsForDriver()
      .then((driverRequests) => {
        if (!cancelled) setRequests(driverRequests);
      })
      .catch((err) => {
        if (!cancelled) setRequestsError(err.message || "Could not load your ride requests.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSubmitted(false);
    try {
      const created = await createTrip(form);
      setListed((prev) => [created, ...prev]);
      setSubmitted(true);
      setForm({
        driver: "",
        phone: "",
        from: "Sohra",
        to: "Shillong",
        date: "",
        departure: "",
        seats: "",
        vehicle: "",
        fare: "",
        notes: "",
      });
    } catch (err) {
      setError(err.message || "Could not list your trip. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "6px",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: "32px", color: "#111827", marginBottom: "8px" }}>List Your Return Trip</h1>
      <p style={{ color: "#6b7280", marginBottom: "32px" }}>
        Already driving back? Let passengers heading your way find you.
      </p>

      {submitted && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #16a34a",
          color: "#166534",
          padding: "14px 18px",
          borderRadius: "8px",
          marginBottom: "24px",
          fontSize: "14px",
        }}>
          ✅ Your return trip has been listed.
        </div>
      )}

      {error && (
        <div role="alert" style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          padding: "14px 18px",
          borderRadius: "8px",
          marginBottom: "24px",
          fontSize: "14px",
        }}>
          Could not list your trip: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "40px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Driver Name</label>
            <input name="driver" value={form.driver} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>From</label>
            <select name="from" value={form.from} onChange={handleChange} style={inputStyle}>
              {locations.map((loc) => <option key={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <select name="to" value={form.to} onChange={handleChange} style={inputStyle}>
              {locations.map((loc) => <option key={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expected Departure</label>
            <input type="time" name="departure" value={form.departure} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Available Seats</label>
            <input type="number" name="seats" value={form.seats} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Vehicle Type</label>
            <input name="vehicle" value={form.vehicle} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expected Fare (₹)</label>
            <input type="number" name="fare" value={form.fare} onChange={handleChange} required style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Additional Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows="3"
            placeholder="e.g. Leaving Sohra around 5 PM, pickup near the market."
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <button type="submit" disabled={saving}
          style={{
            marginTop: "20px",
            background: "#16a34a",
            color: "white",
            border: "none",
            padding: "12px 28px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}>
          {saving ? "Listing..." : "List Return Trip"}
        </button>
      </form>

      {loadError && (
        <div role="alert" style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          padding: "14px 18px",
          borderRadius: "8px",
          marginBottom: "24px",
          fontSize: "14px",
        }}>
          Could not load your listed trips: {loadError}
        </div>
      )}

      {listed.length > 0 && (
        <div>
          <h2 style={{ fontSize: "20px", color: "#111827", marginBottom: "16px" }}>Your Listed Trips</h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {listed.map((trip) => (
              <div key={trip.id} style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "18px",
              }}>
                <div style={{ fontWeight: "700", color: "#111827", marginBottom: "6px" }}>
                  {trip.from} → {trip.to}
                </div>
                <div style={{ fontSize: "13px", color: "#4b5563" }}>
                  {trip.driver} · {trip.date} · {trip.departure} · {trip.seats} seats · ₹{trip.fare}/person
                </div>
                {trip.notes && (
                  <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px", fontStyle: "italic" }}>
                    "{trip.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(requests.length > 0 || requestsError) && (
        <div style={{ marginTop: listed.length > 0 ? "40px" : 0 }}>
          <h2 style={{ fontSize: "20px", color: "#111827", marginBottom: "16px" }}>Ride Requests</h2>

          {requestsError && (
            <div role="alert" style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "14px",
            }}>
              Could not load your ride requests: {requestsError}
            </div>
          )}

          <div style={{ display: "grid", gap: "12px" }}>
            {requests.map((request) => (
              <div key={request.id} style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "18px",
              }}>
                <div style={{ fontWeight: "700", color: "#111827", marginBottom: "6px" }}>
                  {request.trip.from} → {request.trip.to}
                </div>
                <div style={{ fontSize: "13px", color: "#4b5563" }}>
                  Passenger: {request.passengerName}
                </div>
                <div style={{ fontSize: "13px", color: "#4b5563" }}>
                  Phone: {request.passengerPhone}
                </div>
                <div style={{ fontSize: "13px", color: "#4b5563" }}>
                  Seats requested: {request.seatsRequested}
                </div>
                <div style={{ fontSize: "13px", color: "#4b5563" }}>
                  Status: {requestStatusLabel(request.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListTrip;
