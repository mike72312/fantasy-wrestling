// src/components/TradeProposal.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BASE_URL = "https://fantasy-wrestling-backend.onrender.com";

const TradeProposal = () => {
  const { opponentTeam, requestedWrestler } = useParams();
  const navigate = useNavigate();

  const userTeam = localStorage.getItem("teamName");

  const [userRoster, setUserRoster] = useState([]);
  const [opponentRoster, setOpponentRoster] = useState([]);
  const [offered, setOffered] = useState([]);
  const [requested, setRequested] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRosters = async () => {
      try {
        const [userRes, opponentRes] = await Promise.all([
          fetch(`${BASE_URL}/api/roster/${encodeURIComponent(userTeam)}`),
          fetch(`${BASE_URL}/api/roster/${encodeURIComponent(opponentTeam)}`)
        ]);

        if (!userRes.ok || !opponentRes.ok) throw new Error("Failed to fetch rosters");

        const [userData, opponentData] = await Promise.all([
          userRes.json(),
          opponentRes.json()
        ]);

        setUserRoster(userData);
        setOpponentRoster(opponentData);

        if (requestedWrestler) {
          setRequested([requestedWrestler]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading rosters:", err);
        alert("Failed to load team rosters. Please check team names or try again.");
      }
    };

    fetchRosters();
  }, [userTeam, opponentTeam, requestedWrestler]);

  const toggleWrestler = (name, list, setList) => {
    setList(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const submitTrade = async () => {
    if (offered.length === 0 || requested.length === 0) {
      alert("Please select at least one wrestler from each team.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/proposeTrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeringTeam: userTeam,
          receivingTeam: opponentTeam,
          offeredWrestlers: offered,
          requestedWrestlers: requested
        })
      });

      if (!res.ok) throw new Error("Trade proposal failed");

      alert("Trade proposed!");
      navigate("/transactions");
    } catch (err) {
      console.error("Trade error:", err);
      alert("Something went wrong proposing the trade.");
    }
  };

  if (loading) return <div className="container"><p>Loading rosters...</p></div>;

  return (
    <div className="container">
      <h2>Trade Proposal</h2>
      <p>You ({userTeam}) are proposing a trade to {opponentTeam}</p>

      <div style={{ display: "flex", gap: "2rem", justifyContent: "space-between", flexWrap: "wrap" }}>
        {/* Your Team */}
        <div style={{ flex: 1 }}>
          <h3>{userTeam} (Your Team)</h3>
          <table className="wrestler-table">
            <thead>
              <tr>
                <th>Offer?</th>
                <th>Wrestler</th>
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

        {/* Opponent Team */}
        <div style={{ flex: 1 }}>
          <h3>{opponentTeam}</h3>
          <table className="wrestler-table">
            <thead>
              <tr>
                <th>Request?</th>
                <th>Wrestler</th>
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
        <h4>Summary</h4>
        <p>
          <strong>You're offering:</strong> {offered.join(", ") || "None"}
        </p>
        <p>
          <strong>You're requesting:</strong> {requested.join(", ") || "None"}
        </p>
        <button onClick={submitTrade}>Submit Trade Proposal</button>
      </div>
    </div>
  );
};

export default TradeProposal;