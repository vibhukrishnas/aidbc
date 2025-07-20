import React from 'react';

const DebateArena = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🏟️ Debate Arena</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2>🚀 Welcome to the Debate Arena!</h2>
        <p>Practice your debating skills with AI-powered coaching</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '10px'
        }}>
          <h3>📝 Topic Selection</h3>
          <p>Choose from various debate topics or create your own</p>
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Select Topic
          </button>
        </div>

        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '10px'
        }}>
          <h3>⚙️ Settings</h3>
          <p>Customize your debate experience</p>
          <div style={{ marginTop: '10px' }}>
            <label>
              <input type="checkbox" /> AI Assistance
            </label><br />
            <label>
              <input type="checkbox" /> Time Limits
            </label><br />
            <label>
              <input type="checkbox" /> Voice Input
            </label>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ddd', 
        borderRadius: '10px', 
        padding: '20px',
        minHeight: '400px'
      }}>
        <h3>💬 Debate Interface</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>Select a topic to begin your debate practice session</p>
          <p>The AI coach will provide real-time feedback and suggestions</p>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '30px'
        }}>
          <button style={{
            padding: '15px 30px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            🎤 Start Recording
          </button>
          
          <button style={{
            padding: '15px 30px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            📝 Type Response
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebateArena;
