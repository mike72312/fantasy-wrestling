import React, { useState } from 'react';
import axios from 'axios';

const EventForm = () => {
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setMessage("");
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("csvFile", file);

    try {
      const response = await axios.post(
        "https://wrestling-backend2.onrender.com/api/upload-csv",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(response.data);
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setMessage("Error uploading CSV.");
    }
  };

  return (
    <div className="container">
      <h2>Upload Event Data (CSV)</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {message && <div className="card">{message}</div>}
    </div>
  );
};

export default EventForm;
