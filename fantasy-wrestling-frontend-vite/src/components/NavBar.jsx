import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav style={{ background: "#333", padding: "10px" }}>
      <Link to="/" style={{ color: "white", margin: "0 10px" }}>Home</Link>
      <Link to="/available-wrestlers" style={{ color: "white", margin: "0 10px" }}>Available</Link>
      <Link to="/standings" style={{ color: "white", margin: "0 10px" }}>Standings</Link>
      <Link to="/transactions" style={{ color: "white", margin: "0 10px" }}>Transactions</Link>
      <Link to="/import-event" style={{ color: "white", margin: "0 10px" }}>Import Event</Link>
    </nav>
  );
};

export default NavBar;