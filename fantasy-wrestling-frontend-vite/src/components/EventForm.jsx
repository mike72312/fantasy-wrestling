import React, { useState } from "react";

const EventForm = () => {
  const [file, setFile] = useState(null);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !eventName || !eventDate) {
      alert("All fields required.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const html = reader.result;

      try {
        const response = await fetch("https://wrestling-backend2.onrender.com/api/importEvent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, event_name: eventName, event_date: eventDate }),
        });

        if (!response.ok) throw new Error("Upload failed");
        alert("Event imported successfully!");
      } catch (err) {
        console.error("❌ Upload failed:", err);
        alert("Error uploading event.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="container">
      <h2>Import Event Results</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
        <input
          type="file"
          accept=".html"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type="submit">Import</button>
      </form>
    </div>
  );
};

export default EventForm;