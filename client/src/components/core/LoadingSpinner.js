import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = '#007bff', text = 'Loading...' }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return '20px';
      case 'large':
        return '60px';
      default:
        return '40px';
    }
  };

  const spinnerStyle = {
    width: getSize(),
    height: getSize(),
    border: `3px solid rgba(0, 123, 255, 0.1)`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={spinnerStyle}></div>
      {text && <p style={{ marginTop: '10px', color: '#666' }}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
