import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [teamName, setTeamName] = useState(''); // State to store the input team name
  const navigate = useNavigate(); // Hook to navigate after login

  // Handle the change in input field
  const handleInputChange = (event) => {
    setTeamName(event.target.value);
  };

  // Handle the login submit
  const handleLogin = (event) => {
    event.preventDefault(); // Prevent default form submission

    // Check if a team name is entered
    if (teamName.trim()) {
      // Store the team name in localStorage
      localStorage.setItem('teamName', teamName);
      
      // Redirect to the Home page after successful login
      navigate('/');
    } else {
      alert("Please enter a valid team name.");
    }
  };

  return (
    <div style={loginContainerStyle}>
      <h2>Login</h2>
      <form onSubmit={handleLogin} style={formStyle}>
        <div style={inputContainerStyle}>
          <label htmlFor="teamName" style={labelStyle}>Team Name:</label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Enter your team name"
          />
        </div>
        <button type="submit" style={buttonStyle}>Login</button>
      </form>
    </div>
  );
};

// Inline styles for the login page
const loginContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '50px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
};

const inputContainerStyle = {
  marginBottom: '10px',
};

const labelStyle = {
  fontSize: '16px',
  marginBottom: '5px',
};

const inputStyle = {
  padding: '8px 12px',
  fontSize: '16px',
  width: '200px',
  border: '1px solid #ccc',
  borderRadius: '5px',
};

const buttonStyle = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '10px 20px',
  fontSize: '16px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  width: '220px',
  marginTop: '10px',
};

export default Login;