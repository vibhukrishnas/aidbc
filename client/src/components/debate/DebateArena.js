import React, { useState, useEffect } from 'react';
import { useDebate } from '../../hooks/useDebate';
import { useSarvamAI } from '../../hooks/useSarvamAI';
import Button from '../core/Button';
import Card from '../core/Card';
import './DebateArena.css';

const DebateArena = ({ topic, participants }) => {
  const { debate, startDebate, submitArgument, endDebate } = useDebate();
  const { analyzeArgument, generateFeedback } = useSarvamAI();
  const [currentArgument, setCurrentArgument] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmitArgument = async () => {
    if (!currentArgument.trim()) return;

    // Submit argument to debate system
    const argument = await submitArgument({
      content: currentArgument,
      participant: participants[0], // Current user
      timestamp: Date.now()
    });

    // Get AI analysis using Sarvam AI
    const analysis = await analyzeArgument(currentArgument);
    const feedback = await generateFeedback(analysis);

    setCurrentArgument('');
  };

  return (
    <div className="debate-arena">
      <Card title={Debate: ${topic}} variant="primary" elevated>
        <div className="debate-content">
          <div className="debate-timeline">
            {debate.arguments?.map((arg, index) => (
              <div key={index} className="argument-bubble">
                <div className="argument-content">{arg.content}</div>
                <div className="argument-meta">
                  {arg.participant.name}  {new Date(arg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          <div className="debate-input">
            <textarea
              value={currentArgument}
              onChange={(e) => setCurrentArgument(e.target.value)}
              placeholder="Present your argument..."
              className="argument-textarea"
            />
            <div className="debate-controls">
              <Button
                variant="secondary"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? ' Stop Recording' : ' Voice Input'}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitArgument}
                disabled={!currentArgument.trim()}
              >
                Submit Argument
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DebateArena;
