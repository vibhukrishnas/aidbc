import React, { useState, useEffect } from 'react';
import Avatar from '../core/Avatar';
import { api } from '../../services/api';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaderboard(timeframe);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>Top Debaters</h2>
        <div className="timeframe-selector">
          {['daily', 'weekly', 'monthly', 'all-time'].map(tf => (
            <button
              key={tf}
              className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading rankings...</div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((user, index) => (
            <div key={user.id} className={`leaderboard-item rank-${index + 1}`}>
              <div className="rank">
                {getMedalEmoji(index + 1)}
                <span className="rank-number">{index + 1}</span>
              </div>
              
              <Avatar user={user} size="small" showLevel={false} />
              
              <div className="user-info">
                <div className="username">{user.username}</div>
                <div className="user-stats">
                  Level {user.level} • {user.totalDebates} debates
                </div>
              </div>
              
              <div className="score">
                {user.score.toLocaleString()} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
