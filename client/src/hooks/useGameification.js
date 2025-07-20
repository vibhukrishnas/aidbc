import { useState, useContext, useCallback, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ACHIEVEMENTS } from '../utils/constants';

export const useGameification = () => {
  const { user, updateUser } = useContext(UserContext);
  const [combo, setCombo] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const addXP = useCallback((amount) => {
    const newXP = user.xp + amount;
    const newLevel = calculateLevel(user.totalXP + amount);
    
    if (newLevel > user.level) {
      triggerLevelUp(newLevel);
    }
    
    updateUser({
      xp: newXP,
      totalXP: user.totalXP + amount,
      level: newLevel
    });
    
    showNotification(`+${amount} XP!`, 'xp');
  }, [user, updateUser]);

  const triggerCombo = useCallback(() => {
    const newCombo = combo + 1;
    setCombo(newCombo);
    
    if (newCombo > 2) {
      const bonusXP = newCombo * 5;
      addXP(bonusXP);
      showNotification(`${newCombo}x Combo! +${bonusXP} bonus XP`, 'combo');
    }
  }, [combo, addXP]);

  const checkAchievements = useCallback(() => {
    const newAchievements = [];
    
    ACHIEVEMENTS.forEach(achievement => {
      if (!user.achievements.includes(achievement.id)) {
        if (achievement.condition(user)) {
          newAchievements.push(achievement);
        }
      }
    });
    
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievement => {
        unlockAchievement(achievement);
      });
    }
  }, [user]);

  const unlockAchievement = (achievement) => {
    updateUser({
      achievements: [...user.achievements, achievement.id]
    });
    
    showNotification(
      `Achievement Unlocked: ${achievement.name}`,
      'achievement',
      achievement.icon
    );
    
    // Bonus XP for achievement
    addXP(achievement.xpReward || 50);
  };

  const triggerLevelUp = (newLevel) => {
    showNotification(
      `Level Up! You're now level ${newLevel}!`,
      'levelup',
      '🎉'
    );
    
    // Play celebration animation
    document.body.classList.add('celebration');
    setTimeout(() => {
      document.body.classList.remove('celebration');
    }, 3000);
  };

  const showNotification = (message, type, icon) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      icon
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const xpForNextLevel = calculateXPForLevel(user.level + 1) - user.totalXP;

  return {
    user,
    combo,
    notifications,
    addXP,
    triggerCombo,
    checkAchievements,
    xpForNextLevel
  };
};

// Helper functions
function calculateLevel(totalXP) {
  // Level formula: level = floor(sqrt(totalXP / 100))
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

function calculateXPForLevel(level) {
  // XP needed for level: 100 * (level - 1)^2
  return 100 * Math.pow(level - 1, 2);
}
