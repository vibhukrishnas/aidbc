import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useGame } from '../contexts/GameContext';

const Dashboard = () => {
  const { user } = useUser();
  const { gameState } = useGame();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎯 Welcome to AI Debate Coach!</h1>
      
      {user && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px', 
          marginBottom: '20px' 
        }}>
          <h2>👋 Hello, {user.name || 'Debater'}!</h2>
          <p>Level: {gameState.level} | XP: {gameState.xp}</p>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '30px', 
          borderRadius: '10px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          ':hover': { transform: 'translateY(-5px)' }
        }}>
          <h3>🗣️ Start Debate</h3>
          <p>Practice your debate skills with AI-powered feedback</p>
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Enter Arena
          </button>
        </div>

        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '30px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>📊 Your Progress</h3>
          <p>Level {gameState.level}</p>
          <p>{gameState.xp} XP</p>
          <p>{gameState.achievements?.length || 0} Achievements</p>
        </div>

        <div style={{ 
          backgroundColor: '#fff3e0', 
          padding: '30px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>🏆 Leaderboard</h3>
          <p>See how you rank among other debaters</p>
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#f57c00',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            View Rankings
          </button>
        </div>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <h2>🌟 Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4>🤖 AI-Powered Analysis</h4>
            <p>Get intelligent feedback powered by Sarvam AI</p>
          </div>
          <div>
            <h4>🌍 Multilingual Support</h4>
            <p>Practice debates in multiple languages</p>
          </div>
          <div>
            <h4>♿ Accessible Design</h4>
            <p>Built with accessibility in mind for everyone</p>
          </div>
          <div>
            <h4>🎮 Gamification</h4>
            <p>Earn XP, levels, and achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
