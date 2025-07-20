const sarvamAIService = require('../services/sarvamAI.service');
const Debate = require('../models/Debate');

class FeedbackController {
  // Get detailed feedback for a specific aspect
  async getDetailedFeedback(req, res, next) {
    try {
      const { debateId, aspect } = req.body;
      
      // Get the debate
      const debate = await Debate.findById(debateId);
      if (!debate) {
        return res.status(404).json({
          success: false,
          error: 'Debate not found'
        });
      }
      
      // Check permission
      if (debate.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      // Generate detailed feedback
      const detailedFeedback = await sarvamAIService.generateDetailedFeedback(
        debate.response,
        aspect,
        debate.language
      );
      
      res.json({
        success: true,
        data: {
          aspect,
          feedback: detailedFeedback,
          tips: getFeedbackTips(aspect)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get improvement suggestions
  async getImprovementPlan(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Get recent debates
      const recentDebates = await Debate.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('feedback.scores feedback.overallScore');
      
      if (recentDebates.length === 0) {
        return res.json({
          success: true,
          data: {
            message: 'Complete some debates first to get personalized improvement suggestions'
          }
        });
      }
      
      // Analyze patterns
      const weakAreas = analyzeWeakAreas(recentDebates);
      const improvementPlan = generateImprovementPlan(weakAreas);
      
      res.json({
        success: true,
        data: improvementPlan
      });
    } catch (error) {
      next(error);
    }
  }

  // Request human feedback (peer review)
  async requestPeerReview(req, res, next) {
    try {
      const { debateId } = req.body;
      
      const debate = await Debate.findById(debateId);
      if (!debate) {
        return res.status(404).json({
          success: false,
          error: 'Debate not found'
        });
      }
      
      // Mark for peer review
      debate.peerReviewRequested = true;
      debate.peerReviewStatus = 'pending';
      await debate.save();
      
      // Notify available mentors
      const io = req.app.get('io');
      io.emit('peerReview:requested', {
        debateId,
        topic: debate.topic,
        userId: req.user.id
      });
      
      res.json({
        success: true,
        message: 'Peer review requested successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper functions
function getFeedbackTips(aspect) {
  const tips = {
    argumentation: [
      'Use the PEEL structure: Point, Evidence, Explanation, Link',
      'Include specific examples and statistics',
      'Address potential counterarguments',
      'Ensure logical flow between points'
    ],
    delivery: [
      'Vary sentence structure for engagement',
      'Use transition words effectively',
      'Maintain clarity and conciseness',
      'Keep a confident tone'
    ],
    rebuttal: [
      'Identify weak points in opposing arguments',
      'Use evidence to counter claims',
      'Stay focused on the topic',
      'Acknowledge valid points before countering'
    ],
    structure: [
      'Start with a clear thesis statement',
      'Organize points logically',
      'Use signposting to guide readers',
      'End with a memorable conclusion'
    ]
  };
  
  return tips[aspect] || ['Keep practicing and reviewing feedback!'];
}

function analyzeWeakAreas(debates) {
  const scoreAverages = {
    argumentation: 0,
    delivery: 0,
    rebuttal: 0,
    structure: 0
  };
  
  debates.forEach(debate => {
    Object.keys(scoreAverages).forEach(key => {
      scoreAverages[key] += debate.feedback.scores[key] || 0;
    });
  });
  
  // Calculate averages
  Object.keys(scoreAverages).forEach(key => {
    scoreAverages[key] = scoreAverages[key] / debates.length;
  });
  
  // Find weak areas (below 70)
  return Object.entries(scoreAverages)
    .filter(([_, score]) => score < 70)
    .sort(([_, a], [__, b]) => a - b)
    .map(([area, score]) => ({ area, score }));
}

function generateImprovementPlan(weakAreas) {
  const plan = {
    weakAreas,
    recommendations: [],
    exercises: []
  };
  
  weakAreas.forEach(({ area, score }) => {
    switch (area) {
      case 'argumentation':
        plan.recommendations.push('Focus on building stronger logical connections');
        plan.exercises.push({
          title: 'Evidence Collection Practice',
          description: 'For each topic, collect 5 credible sources before debating'
        });
        break;
      case 'delivery':
        plan.recommendations.push('Work on clarity and engagement in your writing');
        plan.exercises.push({
          title: 'Sentence Variety Exercise',
          description: 'Rewrite paragraphs using different sentence structures'
        });
        break;
      case 'rebuttal':
        plan.recommendations.push('Practice anticipating counterarguments');
        plan.exercises.push({
          title: 'Devil\'s Advocate Practice',
          description: 'Argue the opposite side of your beliefs'
        });
        break;
      case 'structure':
        plan.recommendations.push('Improve organization and flow');
        plan.exercises.push({
          title: 'Outline First',
          description: 'Create detailed outlines before writing arguments'
        });
        break;
    }
  });
  
  return plan;
}

module.exports = new FeedbackController();
