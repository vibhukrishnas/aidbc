import React from 'react';

const Leaderboard = () => {
  // Mock data for demonstration
  const mockLeaderboard = [
    { rank: 1, name: 'Alex Johnson', level: 15, xp: 2450, debatesWon: 45 },
    { rank: 2, name: 'Sarah Chen', level: 14, xp: 2380, debatesWon: 42 },
    { rank: 3, name: 'Mike Rodriguez', level: 13, xp: 2150, debatesWon: 38 },
    { rank: 4, name: 'Emma Thompson', level: 12, xp: 1980, debatesWon: 35 },
    { rank: 5, name: 'David Kim', level: 12, xp: 1920, debatesWon: 33 },
    { rank: 6, name: 'Lisa Wang', level: 11, xp: 1750, debatesWon: 28 },
    { rank: 7, name: 'James Wilson', level: 10, xp: 1650, debatesWon: 25 },
    { rank: 8, name: 'You', level: 1, xp: 0, debatesWon: 0 },
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#ffd700';
      case 2: return '#c0c0c0';
      case 3: return '#cd7f32';
      default: return '#f8f9fa';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🏆 Leaderboard</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2>🌟 Top Debaters</h2>
        <p>See how you rank among the community of debaters</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>📈 This Week</h3>
          <p>Most active debaters this week</p>
        </div>

        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>🎯 All Time</h3>
          <p>Overall top performers</p>
        </div>

        <div style={{ 
          backgroundColor: '#fff3e0', 
          padding: '20px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>🔥 Rising Stars</h3>
          <p>Fastest growing debaters</p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ddd', 
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px 20px', 
          borderBottom: '1px solid #ddd',
          display: 'grid',
          gridTemplateColumns: '50px 1fr 80px 80px 100px',
          gap: '20px',
          fontWeight: 'bold'
        }}>
          <span>Rank</span>
          <span>Name</span>
          <span>Level</span>
          <span>XP</span>
          <span>Wins</span>
        </div>

        {mockLeaderboard.map((player, index) => (
          <div 
            key={index}
            style={{ 
              padding: '15px 20px', 
              borderBottom: index < mockLeaderboard.length - 1 ? '1px solid #eee' : 'none',
              display: 'grid',
              gridTemplateColumns: '50px 1fr 80px 80px 100px',
              gap: '20px',
              backgroundColor: player.name === 'You' ? '#fff3cd' : getRankColor(player.rank),
              alignItems: 'center',
              fontWeight: player.name === 'You' ? 'bold' : 'normal'
            }}
          >
            <span style={{ fontSize: '18px' }}>
              {getRankIcon(player.rank)}
            </span>
            <span>{player.name}</span>
            <span>{player.level}</span>
            <span>{player.xp.toLocaleString()}</span>
            <span>{player.debatesWon}</span>
          </div>
        ))}
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '30px',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <h3>🚀 Want to climb higher?</h3>
        <p>Practice more debates to earn XP and improve your ranking!</p>
        <button style={{
          padding: '15px 30px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '10px'
        }}>
          Start Practicing
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
