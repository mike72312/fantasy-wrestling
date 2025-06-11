import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const WrestlerProfile = () => {
  const { name } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`https://wrestling-backend2.onrender.com/api/wrestler/${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error('Error loading wrestler:', err));
  }, [name]);

  if (!profile) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <div className="card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h2>{profile.name}</h2>
        <p><strong>Team:</strong> {profile.team_name || 'Free Agent'}</p>
        <p><strong>Total Points:</strong> {profile.total_points}</p>
        {/* Add more stats or info as needed */}
      </div>
    </div>
  );
};

export default WrestlerProfile;
