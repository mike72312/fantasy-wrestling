import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();

  // Handle logout by clearing the team name from localStorage
  const handleLogout = () => {
    localStorage.removeItem('teamName'); // Remove team name from localStorage
    navigate('/login');  // Redirect to login page after logging out
  };

  return (
    <nav style={navbarStyle}>
      <ul style={navListStyle}>
        <li style={navItemStyle}>
          <Link to="/" style={linkStyle}>Home</Link>
        </li>
        <li style={navItemStyle}>
          <Link to="/available-wrestlers" style={linkStyle}>Available Wrestlers</Link>
        </li>
        <li style={navItemStyle}>
          <Link to="/transactionlog" style={linkStyle}>Transactions</Link>
        </li>
        <li style={navItemStyle}>
          <button onClick={handleLogout} style={buttonStyle}>Logout</button> {/* Logout Button */}
        </li>
      </ul>
    </nav>
  );
};

// Inline styles for the Navbar
const navbarStyle = {
  backgroundColor: '#333',
  color: '#fff',
  padding: '10px',
};

const navListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  justifyContent: 'space-around',
};

const navItemStyle = {
  padding: '5px 10px',
};

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
};

const buttonStyle = {
  backgroundColor: '#ff5733',
  color: 'white',
  border: 'none',
  padding: '8px 15px',
  cursor: 'pointer',
  fontSize: '16px',
};

export default NavBar;