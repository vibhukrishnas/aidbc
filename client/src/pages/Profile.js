import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useGame } from '../contexts/GameContext';

const Profile = () => {
  const { user } = useUser();
  const { gameState } = useGame();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>👤 User Profile</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '10px', 
        marginBottom: '30px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: '#007bff', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'white'
          }}>
            👤
          </div>
          <div>
            <h2>{user?.name || 'Anonymous Debater'}</h2>
            <p>{user?.email || 'guest@example.com'}</p>
            <p>Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</p>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '10px'
        }}>
          <h3>📊 Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Level: <strong>{gameState.level}</strong></div>
            <div>XP: <strong>{gameState.xp}</strong></div>
            <div>Debates: <strong>0</strong></div>
            <div>Win Rate: <strong>0%</strong></div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '10px'
        }}>
          <h3>🏆 Achievements</h3>
          {gameState.achievements?.length > 0 ? (
            <div>
              {gameState.achievements.map((achievement, index) => (
                <div key={index} style={{ 
                  backgroundColor: '#fff', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  marginBottom: '5px' 
                }}>
                  🏅 {achievement.name}
                </div>
              ))}
            </div>
          ) : (
            <p>No achievements yet. Start debating to earn some!</p>
          )}
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#fff3e0', 
        padding: '20px', 
        borderRadius: '10px'
      }}>
        <h3>⚙️ Settings</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          <div>
            <label>
              <input type="checkbox" defaultChecked /> Email Notifications
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" defaultChecked /> Sound Effects
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" /> Dark Mode
            </label>
          </div>
          <div>
            <label>Language: </label>
            <select style={{ marginLeft: '10px', padding: '5px' }}>
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Telugu</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}>
            Save Settings
          </button>
          
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
