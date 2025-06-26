// src/components/TradeProposal.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TradeProposal = () => {
  const { opponentTeam, requestedWrestler } = useParams(); // from URL
  const navigate = useNavigate();

  const [userTeam, setUserTeam] = useState(localStorage.getItem("teamName"));
  const [userRoster, setUserRoster] = useState([]);
  const [offeredWrestlers, setOfferedWrestlers] = useState([]);
  const [requestedWrestlers, setRequestedWrestlers] = useState([requestedWrestler]);

  useEffect(() => {
    fetch(`/api/roster/${userTeam}`)
      .then(res => res.json())
      .then(data => setUserRoster(data))
      .catch(err => console.error("Error loading roster:", err));
  }, [userTeam]);

  const toggleOffered = (name) => {
    setOfferedWrestlers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const submitTrade = () => {
    const payload = {
      offeringTeam: userTeam,
      receivingTeam: opponentTeam,
      offeredWrestlers,
      requestedWrestlers
    };

    fetch("/api/proposeTrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        alert("Trade proposed!");
        navigate("/transactions");
      })
      .catch(err => console.error("Trade failed:", err));
  };

  return (
    <div className="container">
      <h2>Propose Trade to {opponentTeam}</h2>
      <p>You're requesting: <strong>{requestedWrestler}</strong></p>
      <h3>Select Wrestlers to Offer:</h3>
      <ul>
        {userRoster.map(w => (
          <li key={w.wrestler_name}>
            <label>
              <input
                type="checkbox"
                checked={offeredWrestlers.includes(w.wrestler_name)}
                onChange={() => toggleOffered(w.wrestler_name)}
              />
              {w.wrestler_name}
            </label>
          </li>
        ))}
      </ul>
      <button disabled={offeredWrestlers.length === 0} onClick={submitTrade}>
        Submit Trade Proposal
      </button>
    </div>
  );
};

export default TradeProposal;