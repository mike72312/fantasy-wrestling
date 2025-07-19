import React, { useState } from "react";
import axios from "axios";
import "./EventForm.css";

const EventForm = () => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [file, setFile] = useState(null);
  const [eventText, setEventText] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Uploading...");

    let textContent = eventText;

    if (!textContent && file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        textContent = e.target.result;
        await submitImport(textContent);
      };
      reader.readAsText(file);
    } else {
      await submitImport(textContent);
    }
  };

  const submitImport = async (textContent) => {
    if (!eventName || !eventDate || !textContent) {
      setStatus("❌ Event name, date, and text are required.");
      return;
    }

    try {
      const res = await axios.post("https://fantasy-wrestling-backend.onrender.com/api/importEvent", {
        rawText: textContent,
        event_name: eventName,
        event_date: eventDate,
      });
      setStatus(`✅ ${res.data.message} (${res.data.updated} updates)`);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setStatus("❌ Upload failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="eventform-container">
      <h2>Import Event</h2>
      <form onSubmit={handleSubmit} className="eventform-form">
        <div>
          <label>Event Name:</label>
          <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
        </div>
        <div>
          <label>Event Date:</label>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
        </div>
        <div>
          <label>Paste Event Text:</label>
          <textarea
            rows="15"
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="Paste the Matches and Bonus Points here..."
          />
        </div>
        <div>
          <label>Or Upload Event File (.txt or .html):</label>
          <input type="file" accept=".txt,.html" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <button type="submit">Submit</button>
      </form>
      {status && <p className="eventform-status">{status}</p>}
    </div>
  );
};

export default EventForm;
