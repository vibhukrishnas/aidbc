import React, { useState, useEffect, useRef } from 'react';
import { useSarvamAI } from '../../hooks/useSarvamAI';
import { useDebate } from '../../hooks/useDebate';
import { useGameification } from '../../hooks/useGameification';
import SpeechInput from './SpeechInput';
import Timer from './Timer';
import FeedbackDisplay from './FeedbackDisplay';
import PowerUpBar from '../gamification/PowerUpBar';
import './DebateArena.css';

const DebateArena = ({ topic }) => {
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { generateFeedback, isLoading } = useSarvamAI();
  const { submitDebate, currentDebate } = useDebate();
  const { addXP, checkAchievements, triggerCombo } = useGameification();
  
  const textareaRef = useRef(null);

  // Auto-save draft
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (userInput) {
        localStorage.setItem('debate-draft', userInput);
      }
    }, 1000);
    
    return () => clearTimeout(saveTimer);
  }, [userInput]);

  const handleSubmit = async () => {
    if (userInput.trim().length < 50) {
      alert('Please provide at least 50 characters for your argument.');
      return;
    }

    try {
      const feedback = await generateFeedback(userInput, topic.id);
      const result = await submitDebate({
        topicId: topic.id,
        response: userInput,
        feedback
      });

      // Gamification rewards
      const xpEarned = Math.floor(feedback.overallScore * 0.5);
      addXP(xpEarned);
      
      if (feedback.overallScore > 80) {
        triggerCombo();
      }
      
      checkAchievements();
      setShowFeedback(true);
      
      // Clear draft
      localStorage.removeItem('debate-draft');
    } catch (error) {
      console.error('Error submitting debate:', error);
    }
  };

  const handleSpeechResult = (transcript) => {
    setUserInput(prev => prev + ' ' + transcript);
  };

  return (
    <div className="debate-arena">
      <div className="debate-header">
        <h2>{topic.title}</h2>
        <Timer />
      </div>

      <PowerUpBar />

      <div className="debate-content">
        <div className="debate-prompt">
          <p>{topic.description}</p>
          <div className="debate-tips">
            💡 Tip: Structure your argument with clear points and evidence
          </div>
        </div>

        <div className="debate-input-section">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Present your argument here..."
            className="debate-textarea"
            maxLength={2000}
          />
          
          <div className="input-controls">
            <SpeechInput 
              onResult={handleSpeechResult}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />
            
            <div className="char-count">
              {userInput.length} / 2000
            </div>
          </div>
        </div>

        <div className="debate-actions">
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading || userInput.trim().length < 50}
          >
            {isLoading ? 'Analyzing...' : 'Submit Argument'}
          </button>
        </div>
      </div>

      {showFeedback && currentDebate?.feedback && (
        <FeedbackDisplay 
          feedback={currentDebate.feedback}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
};

export default DebateArena;
