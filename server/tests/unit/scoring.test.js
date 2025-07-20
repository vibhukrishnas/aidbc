const scoringService = require('../../src/services/scoring.service');

describe('Scoring Service', () => {
  describe('calculateScores', () => {
    it('should calculate basic scores correctly', () => {
      const response = 'This is a test response with clear arguments. Therefore, I believe this is important.';
      const aiFeedback = {
        strengths: ['Clear arguments'],
        improvements: ['Add more examples'],
        summary: 'Good effort'
      };
      
      const scores = scoringService.calculateScores(response, aiFeedback);
      
      expect(scores).toHaveProperty('overall');
      expect(scores.overall).toBeGreaterThan(0);
      expect(scores.overall).toBeLessThanOrEqual(100);
    });
    
    it('should penalize very short responses', () => {
      const shortResponse = 'Too short';
      const aiFeedback = { strengths: [], improvements: [], summary: '' };
      
      const scores = scoringService.calculateScores(shortResponse, aiFeedback);
      
      expect(scores.overall).toBeLessThan(50);
    });

    it('should award higher scores for keyword-rich responses', () => {
      const richResponse = 'Firstly, I believe this argument is clear and specific. Therefore, based on research and studies, I can conclude that evidence supports this position. Furthermore, the logical consequences clearly demonstrate the validity of this stance.';
      const aiFeedback = {
        strengths: ['Well structured arguments', 'Good use of evidence'],
        improvements: ['Could add more examples'],
        summary: 'Excellent debate response'
      };
      
      const scores = scoringService.calculateScores(richResponse, aiFeedback);
      
      expect(scores.overall).toBeGreaterThan(70);
      expect(scores.argumentation).toBeGreaterThan(60);
      expect(scores.structure).toBeGreaterThan(60);
    });

    it('should handle empty AI feedback gracefully', () => {
      const response = 'A decent argument with reasonable points.';
      const emptyFeedback = null;
      
      const scores = scoringService.calculateScores(response, emptyFeedback);
      
      expect(scores).toHaveProperty('overall');
      expect(scores.overall).toBeGreaterThan(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate appropriate insights for high scores', () => {
      const highScores = {
        overall: 92,
        argumentation: 88,
        delivery: 95,
        rebuttal: 90,
        structure: 85
      };
      
      const insights = scoringService.generateInsights(highScores);
      
      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0]).toContain('Excellent');
    });

    it('should provide constructive feedback for lower scores', () => {
      const lowScores = {
        overall: 45,
        argumentation: 40,
        delivery: 50,
        rebuttal: 35,
        structure: 55
      };
      
      const insights = scoringService.generateInsights(lowScores);
      
      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => 
        insight.includes('practice') || insight.includes('learning')
      )).toBeTruthy();
    });
  });
});
