import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../core/Card';
import { api } from '../../services/api';
import './TopicSelector.css';

const TopicSelector = () => {
  const [topics, setTopics] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'kn', name: 'ಕನ್ನಡ' }
  ];

  useEffect(() => {
    loadTopics();
  }, [selectedLanguage]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await api.getTopics(selectedLanguage);
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTopic = (topicId) => {
    navigate(`/debate/${topicId}?lang=${selectedLanguage}`);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  return (
    <div className="topic-selector">
      <div className="language-selector">
        <label>Select Language:</label>
        <select 
          value={selectedLanguage} 
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="language-dropdown"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading topics...</div>
      ) : (
        <div className="topics-grid">
          {topics.map(topic => (
            <Card
              key={topic.id}
              interactive
              onClick={() => selectTopic(topic.id)}
              className="topic-card"
            >
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              
              <div className="topic-meta">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(topic.difficulty) }}
                >
                  {topic.difficulty}
                </span>
                <span className="category-badge">
                  {topic.category}
                </span>
              </div>
              
              {topic.prompts && (
                <div className="topic-prompts">
                  <strong>Consider:</strong>
                  <ul>
                    {topic.prompts.slice(0, 2).map((prompt, idx) => (
                      <li key={idx}>{prompt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
