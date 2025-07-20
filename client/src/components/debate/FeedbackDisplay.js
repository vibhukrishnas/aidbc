import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './FeedbackDisplay.css';

const FeedbackDisplay = ({ feedback, onClose }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && feedback.scores) {
      drawRadarChart();
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [feedback]);

  const drawRadarChart = () => {
    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Argumentation', 'Delivery', 'Rebuttal', 'Structure'],
        datasets: [{
          label: 'Your Performance',
          data: [
            feedback.scores.argumentation,
            feedback.scores.delivery,
            feedback.scores.rebuttal,
            feedback.scores.structure
          ],
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          borderColor: 'rgb(37, 99, 235)',
          pointBackgroundColor: 'rgb(37, 99, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(37, 99, 235)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="feedback-overlay">
      <div className="feedback-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Your Debate Performance</h2>
        
        <div className="overall-score" style={{ color: getScoreColor(feedback.overallScore) }}>
          <div className="score-number">{feedback.overallScore}</div>
          <div className="score-label">Overall Score</div>
        </div>

        <div className="feedback-content">
          <div className="feedback-chart">
            <canvas ref={chartRef} width="300" height="300"></canvas>
          </div>

          <div className="feedback-details">
            <div className="feedback-section">
              <h3>💪 Strengths</h3>
              <ul>
                {feedback.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="feedback-section">
              <h3>📈 Areas for Improvement</h3>
              <ul>
                {feedback.improvements.map((improvement, idx) => (
                  <li key={idx}>{improvement}</li>
                ))}
              </ul>
            </div>

            <div className="feedback-summary">
              <p>{feedback.summary}</p>
            </div>
          </div>
        </div>

        <div className="xp-earned">
          +{Math.floor(feedback.overallScore * 0.5)} XP Earned!
        </div>
      </div>
    </div>
  );
};

export default FeedbackDisplay;
