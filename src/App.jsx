import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import FindRide from "./pages/FindRide";
import ListTrip from "./pages/ListTrip";

function Navbar() {
  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 32px",
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ fontSize: "20px", fontWeight: "bold", color: "#16a34a", textDecoration: "none" }}>
        🚕 EmptyTrip
      </Link>
      <div style={{ display: "flex", gap: "24px" }}>
        <Link to="/" style={{ color: "#374151", textDecoration: "none" }}>Home</Link>
        <Link to="/find" style={{ color: "#374151", textDecoration: "none" }}>Find a Ride</Link>
        <Link to="/list" style={{ color: "#374151", textDecoration: "none" }}>List a Trip</Link>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: "24px 32px",
      marginTop: "60px",
      borderTop: "1px solid #e5e7eb",
      color: "#6b7280",
      fontSize: "13px",
      textAlign: "center",
    }}>
      Prototype only — driver verification, payments, live GPS tracking and real-time notifications would be added in a production version.
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<FindRide />} />
        <Route path="/list" element={<ListTrip />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
