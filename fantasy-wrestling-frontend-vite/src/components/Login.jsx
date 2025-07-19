import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [teamName, setTeamName] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    setTeamName(event.target.value);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (teamName.trim()) {
      localStorage.setItem('teamName', teamName);
      navigate('/');
    } else {
      alert('Please enter a valid team name.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <label htmlFor="teamName">Team Name:</label>
        <input
          type="text"
          id="teamName"
          value={teamName}
          onChange={handleInputChange}
          placeholder="Enter team name"
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
