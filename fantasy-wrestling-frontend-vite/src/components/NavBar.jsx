import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("teamName");
    navigate("/login");
  };

  return (
    <nav style={{ background: "#222", padding: "1rem" }}>
      <Link to="/" style={{ color: "white", marginRight: "1rem" }}>Home</Link>
      <Link to="/available-wrestlers" style={{ color: "white", marginRight: "1rem" }}>Available</Link>
      <Link to="/standings" style={{ color: "white", marginRight: "1rem" }}>Standings</Link>
      <Link to="/transactions" style={{ color: "white", marginRight: "1rem" }}>Transactions</Link>
      <Link to="/import-event" style={{ color: "white", marginRight: "1rem" }}>Import Event</Link>
      <Link to="/trade-inbox" style={{ color: "white", marginRight: "1rem" }}>Trade Inbox</Link> {/* ✅ NEW */}
      <Link to="/event-summary" style={{ color: "white", marginRight: "1rem" }}>Event Summary</Link>
      <button onClick={handleLogout} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>Logout</button>
    </nav>
  );
};

export default NavBar;