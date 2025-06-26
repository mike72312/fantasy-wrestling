// src/components/TradeInbox.jsx
import React, { useEffect, useState } from "react";

const TradeInbox = () => {
  const teamName = localStorage.getItem("teamName");
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetch("/api/trades")
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(t =>
          t.offering_team.toLowerCase() === teamName.toLowerCase() ||
          t.receiving_team.toLowerCase() === teamName.toLowerCase()
        );
        setTrades(filtered);
      })
      .catch(err => console.error("Error loading trades:", err));
  }, [teamName]);

  const respondToTrade = (id, action) => {
    fetch(`/api/trades/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    })
      .then(() => window.location.reload())
      .catch(err => console.error("Error responding to trade:", err));
  };

  return (
    <div className="container">
      <h2>Trade Inbox</h2>
      {trades.length === 0 ? (
        <p>No trades yet.</p>
      ) : (
        trades.map(trade => (
          <div key={trade.id} className="trade-card">
            <p><strong>{trade.offering_team}</strong> offers: {trade.offered_wrestlers.join(", ")}</p>
            <p><strong>{trade.receiving_team}</strong> gives: {trade.requested_wrestlers.join(", ")}</p>
            <p>Status: {trade.status}</p>
            {trade.status === "pending" && trade.receiving_team.toLowerCase() === teamName.toLowerCase() && (
              <div>
                <button onClick={() => respondToTrade(trade.id, "accept")}>Accept</button>
                <button onClick={() => respondToTrade(trade.id, "reject")}>Reject</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default TradeInbox;