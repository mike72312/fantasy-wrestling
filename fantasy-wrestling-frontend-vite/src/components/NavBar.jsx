import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav style={{ background: "#222", padding: "1rem" }}>
      <Link to="/" style={{ color: "white", marginRight: "1rem" }}>Home</Link>
      <Link to="/available-wrestlers" style={{ color: "white", marginRight: "1rem" }}>Available</Link>
      <Link to="/standings" style={{ color: "white", marginRight: "1rem" }}>Standings</Link>
      <Link to="/transactions" style={{ color: "white", marginRight: "1rem" }}>Transactions</Link>
      <Link to="/import-event" style={{ color: "white", marginRight: "1rem" }}>Import Event</Link>
    </nav>
  );
};

export default NavBar;