const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Import models
const User = require('../../server/src/models/User');
const Debate = require('../../server/src/models/Debate');
const Analytics = require('../../server/src/models/Analytics');

class DataAggregator {
  constructor() {
    this.outputDir = path.join(__dirname, '../reports');
  }

  async connect() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/debate-coach');
    console.log('Connected to database');
  }

  async aggregateUserMetrics(startDate, endDate) {
    const metrics = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averageLevel: { $avg: '$level' },
          totalXP: { $sum: '$totalXP' },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: ['$lastActiveAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          languageDistribution: { $push: '$preferences.language' }
        }
      }
    ]);

    return metrics[0] || {};
  }

  async aggregateDebateMetrics(startDate, endDate) {
    const metrics = await Debate.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$feedback.overallScore' },
          avgArgumentation: { $avg: '$feedback.scores.argumentation' },
          avgDelivery: { $avg: '$feedback.scores.delivery' },
          avgRebuttal: { $avg: '$feedback.scores.rebuttal' },
          avgStructure: { $avg: '$feedback.scores.structure' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return metrics;
  }

  async aggregateTopicPopularity() {
    const popularity = await Debate.aggregate([
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 },
          avgScore: { $avg: '$feedback.overallScore' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: '_id',
          as: 'topicInfo'
        }
      },
      { $unwind: '$topicInfo' },
      {
        $project: {
          title: '$topicInfo.title',
          category: '$topicInfo.category',
          difficulty: '$topicInfo.difficulty',
          debateCount: '$count',
          avgScore: { $round: ['$avgScore', 2] },
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { debateCount: -1 } }
    ]);

    return popularity;
  }

  async aggregateSkillProgression() {
    const progression = await Debate.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$user',
          debates: {
            $push: {
              date: '$createdAt',
              scores: '$feedback.scores'
            }
          }
        }
      },
      {
        $project: {
          userId: '$_id',
          firstDebate: { $arrayElemAt: ['$debates', 0] },
          lastDebate: { $arrayElemAt: ['$debates', -1] },
          totalDebates: { $size: '$debates' }
        }
      },
      {
        $project: {
          userId: 1,
          totalDebates: 1,
          improvement: {
            argumentation: {
              $subtract: ['$lastDebate.scores.argumentation', '$firstDebate.scores.argumentation']
            },
            delivery: {
              $subtract: ['$lastDebate.scores.delivery', '$firstDebate.scores.delivery']
            },
            rebuttal: {
              $subtract: ['$lastDebate.scores.rebuttal', '$firstDebate.scores.rebuttal']
            },
            structure: {
              $subtract: ['$lastDebate.scores.structure', '$firstDebate.scores.structure']
            }
          }
        }
      }
    ]);

    return progression;
  }

  async generateReport(type = 'weekly') {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (type) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    console.log(`Generating ${type} report...`);

    const report = {
      type,
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate
      },
      userMetrics: await this.aggregateUserMetrics(startDate, endDate),
      debateMetrics: await this.aggregateDebateMetrics(startDate, endDate),
      topicPopularity: await this.aggregateTopicPopularity(),
      skillProgression: await this.aggregateSkillProgression()
    };

    // Save report
    const filename = `report_${type}_${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    console.log(`Report saved to: ${filepath}`);
    return report;
  }

  async generateCustomReport(query) {
    console.log('Generating custom report...');
    
    const results = await Debate.aggregate(query);
    
    const filename = `custom_report_${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    
    return results;
  }

  async close() {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// CLI execution
if (require.main === module) {
  const aggregator = new DataAggregator();
  const type = process.argv[2] || 'weekly';
  
  aggregator.connect()
    .then(() => aggregator.generateReport(type))
    .then(() => aggregator.close())
    .catch(console.error);
}

module.exports = DataAggregator;