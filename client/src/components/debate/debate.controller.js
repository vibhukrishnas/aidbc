const debateService = require('../services/debateService');
const sarvamAIService = require('../services/sarvamAI.service');
const gamificationService = require('../services/gamification.service');

class DebateController {
  async createDebate(req, res) {
    try {
      const { topic, format, participants } = req.body;
      
      const debate = await debateService.createDebate({
        topic,
        format,
        participants,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: debate
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async submitArgument(req, res) {
    try {
      const { debateId, content, position } = req.body;
      
      // Save argument
      const argument = await debateService.addArgument(debateId, {
        content,
        position,
        userId: req.user.id,
        timestamp: new Date()
      });

      // Get AI analysis from Sarvam AI
      const analysis = await sarvamAIService.analyzeArgument(content, position);
      
      // Update user XP based on argument quality
      await gamificationService.updateUserXP(req.user.id, analysis.score);

      res.json({
        success: true,
        data: {
          argument,
          analysis,
          feedback: analysis.feedback
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDebateAnalytics(req, res) {
    try {
      const { debateId } = req.params;
      
      const analytics = await debateService.getDebateAnalytics(debateId);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DebateController();
