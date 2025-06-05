import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";  // Import Router

import "./index.css";

// Wrap App component with Router
ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById("root")
);