import React, { useState } from "react";
import axios from "axios";

const TradeProposalForm = ({ fromTeam, toTeam, offeredWrestler, requestedWrestler, onClose }) => {
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post("https://wrestling-backend2.onrender.com/api/proposeTrade", {
        from_team: fromTeam,
        to_team: toTeam,
        offered_wrestler: offeredWrestler,
        requested_wrestler: requestedWrestler,
      });
      setStatusMessage(res.data.message || "Trade proposed.");
    } catch (error) {
      console.error("Error submitting trade:", error);
      setStatusMessage("Failed to propose trade.");
    }
  };

  return (
    <div className="trade-form">
      <h3>Propose Trade</h3>
      <p>{fromTeam} offers {offeredWrestler} to {toTeam} for {requestedWrestler}</p>
      <button onClick={handleSubmit}>Submit Trade</button>
      <button onClick={onClose}>Cancel</button>
      <p>{statusMessage}</p>
    </div>
  );
};

export default TradeProposalForm;
