// src/components/EventForm.js
import React, { useState } from 'react';
import axios from 'axios';

const EventForm = () => {
  const [message, setMessage] = useState(""); // For showing success/error messages

  const handleFileChange = (e) => {
    setMessage(""); // Clear any previous messages
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("csvFile", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload-csv", // Make sure this matches your backend endpoint
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(response.data); // Display success message from the backend
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setMessage("Error uploading CSV.");
    }
  };

  return (
    <div>
      <h2>Upload Event Data (CSV)</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
      {/* Display Success/Error Message */}
      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default EventForm;