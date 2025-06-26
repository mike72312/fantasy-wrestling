import React, { useState } from "react";

const EventForm = () => {
  const [file, setFile] = useState(null);
  const [eventUrl, setEventUrl] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventName || !eventDate) {
      alert("Event name and date are required.");
      return;
    }

    try {
      let payload = { event_name: eventName, event_date: eventDate };

      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          payload.html = reader.result;
          await upload(payload);
        };
        reader.readAsText(file);
      } else if (eventUrl) {
        payload.url = eventUrl;
        await upload(payload);
      } else {
        alert("Please provide either a file or a URL.");
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Error uploading event.");
    }
  };

  const upload = async (payload) => {
    const response = await fetch("https://fantasy-wrestling-backend.onrender.com/api/importEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Upload failed");
    alert("Event imported successfully!");
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
          onChange={(e) => {
            setFile(e.target.files[0]);
            setEventUrl(""); // Clear URL if file is uploaded
          }}
        />
        <input
          type="url"
          placeholder="or paste DropTheBelt event URL"
          value={eventUrl}
          onChange={(e) => {
            setEventUrl(e.target.value);
            setFile(null); // Clear file if URL is typed
          }}
        />
        <button type="submit">Import</button>
      </form>
    </div>
  );
};

export default EventForm;