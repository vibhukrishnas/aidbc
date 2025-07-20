import { useState, useCallback } from 'react';
import { sarvamAI } from '../services/sarvam-ai';

export const useSarvamAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateFeedback = useCallback(async (response, topicId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const feedback = await sarvamAI.analyzeDebate(response, topicId);
      
      return feedback;
    } catch (err) {
      setError(err.message);
      
      // Fallback to offline scoring
      return generateOfflineFeedback(response);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const translateText = useCallback(async (text, targetLanguage) => {
    try {
      setIsLoading(true);
      const translated = await sarvamAI.translate(text, targetLanguage);
      return translated;
    } catch (err) {
      setError(err.message);
      return text; // Return original on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const transcribeSpeech = useCallback(async (audioBlob, language = 'en') => {
    try {
      setIsLoading(true);
      const transcript = await sarvamAI.speechToText(audioBlob, language);
      return transcript;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateFeedback,
    translateText,
    transcribeSpeech,
    isLoading,
    error
  };
};

// Offline fallback
function generateOfflineFeedback(response) {
  const wordCount = response.split(/\s+/).length;
  const hasStructure = /firstly|secondly|finally|in conclusion/i.test(response);
  const hasEvidence = /research|study|data|example/i.test(response);
  
  const baseScore = Math.min(100, 50 + (wordCount / 10) + (hasStructure ? 20 : 0) + (hasEvidence ? 15 : 0));
  
  return {
    overallScore: Math.round(baseScore),
    scores: {
      argumentation: Math.round(baseScore * 0.9),
      delivery: Math.round(baseScore * 0.85),
      rebuttal: Math.round(baseScore * 0.8),
      structure: hasStructure ? 85 : 65
    },
    strengths: [
      'Attempted to present your argument',
      wordCount > 200 ? 'Detailed response' : 'Concise presentation'
    ],
    improvements: [
      'Consider adding more specific examples',
      'Work on structuring your arguments clearly'
    ],
    summary: 'Keep practicing! Offline feedback is limited - connect online for detailed AI analysis.'
  };
}
