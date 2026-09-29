import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trips } from "../data/trips";

function Home() {
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("emptyTripRequests") || "[]");
    const allTrips = [...trips, ...JSON.parse(localStorage.getItem("emptyTripListings") || "[]")];
    const requestedTrips = allTrips.filter((t) => saved.includes(t.id));
    setMyRequests(requestedTrips);
  }, []);

  return (
    <div className="page">

      {/* ================= HERO ================= */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gap: "64px",
        alignItems: "center",
        padding: "96px 0 80px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div>
          <div style={{
            display: "inline-block",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#2d5f3f",
            background: "#e8f0eb",
            padding: "6px 14px",
            borderRadius: "100px",
            marginBottom: "28px",
          }}>
            EmptyTrip · Shillong
          </div>

          <h1 style={{
            fontSize: "64px",
            fontWeight: "900",
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            color: "#0f172a",
            marginBottom: "24px",
          }}>
            Don't let the taxi ride back{" "}
            <span style={{ color: "#2d5f3f" }}>empty.</span>
          </h1>

          <p style={{
            fontSize: "17px",
            color: "#4b5563",
            maxWidth: "480px",
            marginBottom: "36px",
            lineHeight: 1.65,
          }}>
            Taxis return to Shillong empty every day. We connect those return
            journeys with passengers already heading the same way.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => navigate("/find")}>
              Find a Return Ride
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/list")}>
              List a Return Trip
            </button>
          </div>

          <div style={{
            display: "flex",
            gap: "40px",
            marginTop: "48px",
            paddingTop: "32px",
            borderTop: "1px solid #e5e7eb",
          }}>
            <Stat number="10+" label="Return routes" />
            <Stat number="8" label="Locations" />
            <Stat number="0" label="Empty trips" />
          </div>
        </div>

        <div style={{
          position: "relative",
          aspectRatio: "4 / 5",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(28, 25, 23, 0.15)",
          background: "linear-gradient(135deg, #2d5f3f 0%, #1e4230 100%)",
        }}>
          <img
            src="/hero.jpg"
            alt="Shillong"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            right: "20px",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            padding: "14px 18px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#0f172a",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}>
            One existing trip. Two passengers served.
          </div>
        </div>
      </div>

      {/* ================= YOUR REQUESTS ================= */}
      {myRequests.length > 0 && (
        <div className="section">
          <div className="eyebrow">Your Requests</div>
          <h2 className="section-title">Trips you've requested.</h2>

          <div style={{ display: "grid", gap: "12px" }}>
            {myRequests.map((trip) => (
              <div key={trip.id} style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderLeft: "4px solid #2d5f3f",
                borderRadius: "12px",
                padding: "18px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}>
                <div>
                  <div style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: "4px",
                    letterSpacing: "-0.02em",
                  }}>
                    {trip.from} → {trip.to}
                  </div>
                  <div style={{ fontSize: "13px", color: "#4b5563" }}>
                    {trip.driver} · {trip.departure || "—"}
                    {trip.vehicle ? ` · ${trip.vehicle}` : ""}
                  </div>
                </div>
                <div style={{
                  background: "#f0fdf4",
                  color: "#166534",
                  padding: "6px 14px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.04em",
                }}>
                  ✓ Pending confirmation
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= PROBLEM ================= */}
      <div className="section">
        <div className="eyebrow">The Problem</div>
        <h2 className="section-title">
          A taxi drops a passenger.<br />
          Then drives back alone.
        </h2>
        <p style={{ fontSize: "16px", color: "#4b5563", maxWidth: "680px", lineHeight: 1.75 }}>
          That return journey happens anyway. The car is going. The fuel is spent. The
          seats are empty. Meanwhile, someone in Sohra is trying to get to Shillong and
          ends up waiting — or paying for a whole new taxi.
        </p>
      </div>

      {/* ================= HOW IT WORKS ================= */}
      <div className="section">
        <div className="eyebrow">What We Offer</div>
        <h2 className="section-title">How it works</h2>

        <div className="steps-grid">
          {[
            { icon: "🚕", title: "The trip is completed", desc: "A taxi drops off a passenger outside Shillong." },
            { icon: "📍", title: "The driver lists the return", desc: "Route, time, seats, and expected fare." },
            { icon: "🔎", title: "A passenger finds the route", desc: "They search for the journey they actually need." },
            { icon: "🤝", title: "The seat is booked", desc: "The driver gets a passenger for the ride back." },
            { icon: "✅", title: "Nobody drives home empty", desc: "Both sides win — the same trip, one less empty seat." },
          ].map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= WHY IT MATTERS ================= */}
      <div className="section">
        <div className="eyebrow">Why It Matters</div>
        <h2 className="section-title">
          Small change.<br />Real impact on the road.
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1px",
          background: "#e5e7eb",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          {[
            { num: "01", title: "Fewer empty taxis", desc: "Less traffic on the highway, more cars actually carrying people." },
            { num: "02", title: "Less fuel wasted", desc: "Every filled seat means less petrol burned for nothing." },
            { num: "03", title: "Existing seats used", desc: "No new cars needed — just better use of the ones already driving." },
            { num: "04", title: "Easier return travel", desc: "Passengers outside Shillong can finally find a ride back." },
            { num: "05", title: "More driver income", desc: "Local drivers earn on both legs of the trip, not just one." },
            { num: "06", title: "Better use of what's there", desc: "The same trip serves two people instead of one." },
          ].map((item) => (
            <div key={item.num} style={{
              background: "#ffffff",
              padding: "28px 26px",
            }}>
              <div style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                color: "#a8a29e",
                marginBottom: "16px",
              }}>
                {item.num}
              </div>
              <div style={{
                fontSize: "17px",
                fontWeight: "700",
                color: "#0f172a",
                letterSpacing: "-0.015em",
                marginBottom: "8px",
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: "14px",
                color: "#4b5563",
                lineHeight: 1.55,
              }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div>
      <div style={{
        fontSize: "28px",
        fontWeight: "900",
        color: "#0f172a",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>
        {number}
      </div>
      <div style={{
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "8px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontWeight: "600",
      }}>
        {label}
      </div>
    </div>
  );
}

export default Home;