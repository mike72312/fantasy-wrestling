// src/components/TradeProposal.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TradeProposal = () => {
  const { opponentTeam, requestedWrestler } = useParams();
  const userTeam = localStorage.getItem("teamName");
  const navigate = useNavigate();

  const [userRoster, setUserRoster] = useState([]);
  const [opponentRoster, setOpponentRoster] = useState([]);

  const [offered, setOffered] = useState([]);
  const [requested, setRequested] = useState([requestedWrestler]);

  useEffect(() => {
    if (!userTeam) return;

    fetch(`/api/roster/${userTeam}`)
      .then(res => res.json())
      .then(setUserRoster);

    fetch(`/api/roster/${opponentTeam}`)
      .then(res => res.json())
      .then(setOpponentRoster);
  }, [userTeam, opponentTeam]);

  const toggleWrestler = (name, list, setList) => {
    setList(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const submitTrade = () => {
    fetch("/api/proposeTrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offeringTeam: userTeam,
        receivingTeam: opponentTeam,
        offeredWrestlers: offered,
        requestedWrestlers: requested,
      }),
    })
      .then(res => res.json())
      .then(() => {
        alert("Trade proposed!");
        navigate("/transactions");
      })
      .catch(err => {
        console.error("Trade failed:", err);
        alert("Failed to propose trade.");
      });
  };

  return (
    <div className="container">
      <h2>Trade Proposal: {userTeam} ⇄ {opponentTeam}</h2>

      <div style={{ display: "flex", gap: "2rem", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h3>Your Team</h3>
          <table className="wrestler-table">
            <thead>
              <tr>
                <th>Offer?</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {userRoster.map(w => (
                <tr key={w.wrestler_name}>
                  <td>
                    <input
                      type="checkbox"
                      checked={offered.includes(w.wrestler_name)}
                      onChange={() => toggleWrestler(w.wrestler_name, offered, setOffered)}
                    />
                  </td>
                  <td>{w.wrestler_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <h3>{opponentTeam}'s Team</h3>
          <table className="wrestler-table">
            <thead>
              <tr>
                <th>Request?</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {opponentRoster.map(w => (
                <tr key={w.wrestler_name}>
                  <td>
                    <input
                      type="checkbox"
                      checked={requested.includes(w.wrestler_name)}
                      onChange={() => toggleWrestler(w.wrestler_name, requested, setRequested)}
                    />
                  </td>
                  <td>{w.wrestler_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h4>Summary:</h4>
        <p>
          You are offering: <strong>{offered.join(", ") || "None"}</strong>
        </p>
        <p>
          You are requesting: <strong>{requested.join(", ") || "None"}</strong>
        </p>
        <button
          onClick={submitTrade}
          disabled={offered.length === 0 || requested.length === 0}
        >
          Submit Trade Proposal
        </button>
      </div>
    </div>
  );
};

export default TradeProposal;