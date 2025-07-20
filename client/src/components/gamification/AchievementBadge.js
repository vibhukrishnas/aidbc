import React, { useState } from 'react';
import './AchievementBadge.css';

const AchievementBadge = ({ achievement, isUnlocked = false, showDetails = true }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={`achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="badge-icon">
        {isUnlocked ? achievement.icon : '🔒'}
      </div>
      
      {showDetails && (
        <div className="badge-info">
          <h4>{achievement.name}</h4>
          <p>{achievement.description}</p>
        </div>
      )}
      
      {showTooltip && !showDetails && (
        <div className="badge-tooltip">
          <strong>{achievement.name}</strong>
          <p>{achievement.description}</p>
          {!isUnlocked && <p className="unlock-hint">How: {achievement.hint}</p>}
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
