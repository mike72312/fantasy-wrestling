// src/components/EventSummary.jsx
import React, { useState } from "react";
import axios from "axios";

const EventForm = () => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !eventName || !eventDate) {
      setMessage("❌ Please provide all required fields.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const html = event.target.result;

      try {
        setLoading(true);
        setMessage("");

        const response = await axios.post("https://fantasy-wrestling-backend.onrender.com/api/importEvent", {
          html,
          event_name: eventName,
          event_date: eventDate
        });

        setMessage(`✅ Upload successful! ${response.data.updated} updates processed.`);
      } catch (err) {
        console.error("❌ Upload failed:", err);
        setMessage("❌ Upload failed: " + (err.response?.data?.error || "Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="container">
      <h2>Import Event</h2>

      <div>
        <label>Event Name:</label>
        <input
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Event Date:</label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Upload HTML File:</label>
        <input
          type="file"
          accept=".html"
          onChange={handleFileUpload}
        />
      </div>

      {loading && <p>Uploading...</p>}
      {message && <p>{message}</p>}
    </div>
  );
};

export default EventForm;