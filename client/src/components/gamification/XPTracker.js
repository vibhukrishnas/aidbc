import React from 'react';
import { useGameification } from '../../hooks/useGameification';
import './XPTracker.css';

const XPTracker = () => {
  const { user, xpForNextLevel } = useGameification();
  
  const xpProgress = (user.xp / xpForNextLevel) * 100;

  return (
    <div className="xp-tracker">
      <div className="xp-header">
        <span className="level-badge">Level {user.level}</span>
        <span className="xp-text">{user.xp} / {xpForNextLevel} XP</span>
      </div>
      
      <div className="xp-bar">
        <div 
          className="xp-fill"
          style={{ width: `${xpProgress}%` }}
        >
          <span className="xp-percentage">{Math.round(xpProgress)}%</span>
        </div>
      </div>
      
      <div className="next-reward">
        Next: {getNextReward(user.level + 1)}
      </div>
    </div>
  );
};

const getNextReward = (level) => {
  const rewards = {
    5: 'Silver Badge',
    10: 'Gold Badge',
    15: 'Mentor Status',
    20: 'Master Debater Title',
    25: 'Legend Status'
  };
  
  return rewards[level] || `Level ${level} Rewards`;
};

export default XPTracker;
