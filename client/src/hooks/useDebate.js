import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useDebate = () => {
  const [currentDebate, setCurrentDebate] = useState(null);
  const [debateHistory, setDebateHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitDebate = useCallback(async (debateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.submitDebate(debateData);
      setCurrentDebate(response);
      
      // Update local history
      setDebateHistory(prev => [response, ...prev].slice(0, 10));
      
      // Save to localStorage for offline access
      localStorage.setItem('lastDebate', JSON.stringify(response));
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDebateHistory = useCallback(async () => {
    try {
      setLoading(true);
      const history = await api.getDebateHistory();
      setDebateHistory(history);
    } catch (err) {
      setError(err.message);
      // Fallback to localStorage
      const cached = localStorage.getItem('debateHistory');
      if (cached) {
        setDebateHistory(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    currentDebate,
    debateHistory,
    loading,
    error,
    submitDebate,
    loadDebateHistory
  };
};
