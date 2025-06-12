import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container">
      <h1>Fantasy Wrestling League</h1>
      <p>Welcome to the fantasy wrestling site. Choose from the navigation bar above:</p>
      <ul>
        <li><Link to="/available-wrestlers">View Available Wrestlers</Link></li>
        <li><Link to="/standings">View Standings</Link></li>
        <li><Link to="/transactions">View Transactions</Link></li>
        <li><Link to="/import-event">Import Event Results</Link></li>
      </ul>
    </div>
  );
};

export default Home;