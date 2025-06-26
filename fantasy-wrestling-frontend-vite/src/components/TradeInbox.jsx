// src/components/TradeInbox.jsx
import React, { useEffect, useState } from "react";

const BASE_URL = "https://fantasy-wrestling-backend.onrender.com";

const TradeInbox = () => {
  const teamName = localStorage.getItem("teamName");
  const teamNameLC = teamName?.toLowerCase();

  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/trades`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(t =>
          t.offering_team?.toLowerCase() === teamNameLC ||
          t.receiving_team?.toLowerCase() === teamNameLC
        );
        setTrades(filtered);
      })
      .catch(err => console.error("Error loading trades:", err));
  }, [teamNameLC]);

  const respondToTrade = async (tradeId, action) => {
    try {
      const res = await fetch(`${BASE_URL}/api/trades/${tradeId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (!res.ok) throw new Error("Failed to respond");

      // Refresh
      const updated = await fetch(`${BASE_URL}/api/trades`).then(r => r.json());
      const filtered = updated.filter(t =>
        t.offering_team?.toLowerCase() === teamNameLC ||
        t.receiving_team?.toLowerCase() === teamNameLC
      );
      setTrades(filtered);
    } catch (err) {
      console.error("Failed to respond to trade:", err);
      alert("Could not process trade response.");
    }
  };

  return (
    <div className="container">
      <h2>Trade Inbox</h2>
      {trades.length === 0 ? (
        <p>No trades found.</p>
      ) : (
        trades.map((trade) => (
          <div key={trade.id} className="trade-card">
            <p>
              <strong>{trade.offering_team}</strong> offers:{" "}
              {trade.offered_wrestlers.join(", ")}
            </p>
            <p>
              <strong>{trade.receiving_team}</strong> gives:{" "}
              {trade.requested_wrestlers.join(", ")}
            </p>
            <p>Status: <strong>{trade.status}</strong></p>

            {trade.status === "pending" &&
              trade.receiving_team.toLowerCase() === teamNameLC && (
                <div>
                  <button onClick={() => respondToTrade(trade.id, "accept")}>
                    Accept
                  </button>
                  <button onClick={() => respondToTrade(trade.id, "reject")}>
                    Reject
                  </button>
                </div>
              )}
          </div>
        ))
      )}
    </div>
  );
};

export default TradeInbox;