// src/components/LeagueSettings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./LeagueSettings.css";

const LeagueSettings = () => {
  const [windows, setWindows] = useState([]);
  const [day, setDay] = useState(0);
  const [startHour, setStartHour] = useState(20);
  const [endHour, setEndHour] = useState(23);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [winStatus, setWinStatus] = useState("");

  const fetchWindows = async () => {
    try {
      const res = await axios.get("https://fantasy-wrestling-backend.onrender.com/api/restrictedWindows");
      setWindows(res.data);
    } catch (err) {
      console.error("Failed to load restricted windows", err);
    }
  };

  useEffect(() => {
    fetchWindows();
  }, []);

  const addWindow = async () => {
    try {
      await axios.post("https://fantasy-wrestling-backend.onrender.com/api/restrictedWindows", {
        day,
        start_hour: startHour,
        end_hour: endHour
      });
      setDay(0);
      setStartHour(20);
      setEndHour(23);
      fetchWindows();
    } catch (err) {
      alert("Failed to add restriction: " + (err.response?.data?.error || err.message));
    }
  };

  const deleteWindow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this window?")) return;
    try {
      await axios.delete(`https://fantasy-wrestling-backend.onrender.com/api/restrictedWindows/${id}`);
      fetchWindows();
    } catch (err) {
      alert("Failed to delete restriction.");
    }
  };

const awardWin = async () => {
  if (!selectedWeek) return;
  try {
    const res = await axios.post(
      "https://fantasy-wrestling-backend.onrender.com/api/calculateWeeklyWins",
      {},
      { params: { week: selectedWeek } }
    );
    setWinStatus(res.data.message);
  } catch (err) {
    setWinStatus(err.response?.data?.error || "❌ Error awarding win");
  }
};

  const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="container">
      <h2>League Settings: Restricted Time Windows</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Day</th>
            <th>Start Hour</th>
            <th>End Hour</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {windows.map((w) => (
            <tr key={w.id}>
              <td>{dayMap[w.day]}</td>
              <td>{w.start_hour}:00</td>
              <td>{w.end_hour}:00</td>
              <td>
                <button onClick={() => deleteWindow(w.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Add New Restricted Window</h3>
      <label>
        Day:
        <select value={day} onChange={(e) => setDay(parseInt(e.target.value))}>
          {dayMap.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Start Hour (0–23):
        <input type="number" value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))} />
      </label>
      <br />
      <label>
        End Hour (1–24):
        <input type="number" value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))} />
      </label>
      <br />
      <button onClick={addWindow}>Add Restriction</button>

      <hr style={{ margin: "40px 0" }} />

      <h2>Award Weekly Win</h2>
      <div className="win-award-tool">
        <label>
          Week Start Date:
          <input
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
          />
        </label>
        <button onClick={awardWin}>Award Win</button>
        {winStatus && <p className="win-status">{winStatus}</p>}
      </div>
    </div>
  );
};

export default LeagueSettings;