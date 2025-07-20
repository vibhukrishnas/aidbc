import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGameification } from '../hooks/useGameification';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    xp: 0,
    level: 1,
    achievements: [],
    badges: [],
    streak: 0
  });

  const { updateXP, checkAchievements } = useGameification();

  const addXP = (amount) => {
    setGameState(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      
      // Check for achievements
      const newAchievements = checkAchievements(newXP, newLevel);
      
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        achievements: [...prev.achievements, ...newAchievements]
      };
    });
  };

  const updateStreak = () => {
    setGameState(prev => ({
      ...prev,
      streak: prev.streak + 1
    }));
  };

  const value = {
    gameState,
    addXP,
    updateStreak,
    xp: gameState.xp,
    level: gameState.level,
    achievements: gameState.achievements,
    streak: gameState.streak
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
