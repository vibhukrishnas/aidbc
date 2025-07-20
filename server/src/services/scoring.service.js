// Scoring service for debate evaluation
class ScoringService {
  constructor() {
    this.scoringCriteria = {
      argumentation: {
        weight: 0.3,
        description: 'Logic, relevance, and strength of arguments',
        maxScore: 100
      },
      delivery: {
        weight: 0.25,
        description: 'Clarity, structure, and presentation',
        maxScore: 100
      },
      rebuttal: {
        weight: 0.25,
        description: 'Effectiveness of counter-arguments',
        maxScore: 100
      },
      structure: {
        weight: 0.2,
        description: 'Organization and flow',
        maxScore: 100
      }
    };
    
    this.xpRewards = {
      participation: 10,
      completion: 25,
      excellentScore: 50,
      firstDebate: 20,
      dailyStreak: 15,
      weeklyStreak: 50,
      achievement: 100
    };
  }

  // Calculate overall debate score
  calculateOverallScore(scores) {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.keys(this.scoringCriteria).forEach(criterion => {
      if (scores[criterion] !== undefined) {
        const weight = this.scoringCriteria[criterion].weight;
        weightedSum += scores[criterion] * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // Calculate XP based on performance
  calculateXP(debateScore, isFirstDebate = false, streakDays = 0) {
    let totalXP = this.xpRewards.participation + this.xpRewards.completion;
    
    // Performance bonus
    if (debateScore >= 90) {
      totalXP += this.xpRewards.excellentScore;
    } else if (debateScore >= 80) {
      totalXP += Math.round(this.xpRewards.excellentScore * 0.7);
    } else if (debateScore >= 70) {
      totalXP += Math.round(this.xpRewards.excellentScore * 0.4);
    }
    
    // First debate bonus
    if (isFirstDebate) {
      totalXP += this.xpRewards.firstDebate;
    }
    
    // Streak bonuses
    if (streakDays >= 7) {
      totalXP += this.xpRewards.weeklyStreak;
    } else if (streakDays > 0) {
      totalXP += this.xpRewards.dailyStreak * Math.min(streakDays, 6);
    }
    
    return totalXP;
  }

  // Determine performance level
  getPerformanceLevel(score) {
    if (score >= 90) return { level: 'Excellent', color: '#4CAF50', badge: 'gold' };
    if (score >= 80) return { level: 'Good', color: '#2196F3', badge: 'silver' };
    if (score >= 70) return { level: 'Satisfactory', color: '#FF9800', badge: 'bronze' };
    if (score >= 60) return { level: 'Needs Improvement', color: '#F44336', badge: 'none' };
    return { level: 'Poor', color: '#9E9E9E', badge: 'none' };
  }

  // Generate score breakdown
  generateScoreBreakdown(scores) {
    const breakdown = {};
    
    Object.keys(this.scoringCriteria).forEach(criterion => {
      const criterionData = this.scoringCriteria[criterion];
      const score = scores[criterion] || 0;
      
      breakdown[criterion] = {
        score,
        weight: criterionData.weight,
        description: criterionData.description,
        performance: this.getPerformanceLevel(score),
        contribution: Math.round(score * criterionData.weight)
      };
    });
    
    return breakdown;
  }

  // Calculate improvement suggestions based on scores
  generateImprovementSuggestions(scores) {
    const suggestions = [];
    const breakdown = this.generateScoreBreakdown(scores);
    
    // Find lowest scoring areas
    const sortedScores = Object.entries(breakdown)
      .sort(([,a], [,b]) => a.score - b.score);
    
    const lowestScore = sortedScores[0];
    const secondLowest = sortedScores[1];
    
    // Generate specific suggestions
    const improvementMap = {
      argumentation: [
        'Research your topic more thoroughly before debating',
        'Practice structuring logical arguments with clear premises',
        'Use more credible sources and evidence',
        'Work on connecting your arguments to the main thesis'
      ],
      delivery: [
        'Practice speaking clearly and at an appropriate pace',
        'Work on your confidence and vocal projection',
        'Use transitions between points more effectively',
        'Practice your debates out loud before submitting'
      ],
      rebuttal: [
        'Study common counter-arguments for your topics',
        'Practice identifying weaknesses in opposing arguments',
        'Learn to anticipate and address potential objections',
        'Strengthen your critical thinking skills'
      ],
      structure: [
        'Create an outline before starting your debate',
        'Use clear introduction, body, and conclusion format',
        'Improve transitions between arguments',
        'Practice organizing your thoughts more logically'
      ]
    };
    
    if (lowestScore[1].score < 70) {
      suggestions.push(...improvementMap[lowestScore[0]].slice(0, 2));
    }
    
    if (secondLowest[1].score < 75) {
      suggestions.push(improvementMap[secondLowest[0]][0]);
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  // Calculate skill progress over time
  calculateSkillProgress(recentDebates, skillArea) {
    if (recentDebates.length < 2) return null;
    
    const scores = recentDebates
      .map(debate => debate.feedback?.scores?.[skillArea] || 0)
      .filter(score => score > 0);
    
    if (scores.length < 2) return null;
    
    const recent = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(scores.length, 3);
    const older = scores.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(scores.length - 3, 1);
    
    const improvement = recent - older;
    
    return {
      currentAverage: Math.round(recent),
      previousAverage: Math.round(older),
      improvement: Math.round(improvement),
      trend: improvement > 2 ? 'improving' : improvement < -2 ? 'declining' : 'stable'
    };
  }

  // Generate comprehensive feedback report
  generateFeedbackReport(debate, userStats) {
    const scores = debate.feedback.scores;
    const overallScore = this.calculateOverallScore(scores);
    const breakdown = this.generateScoreBreakdown(scores);
    const performance = this.getPerformanceLevel(overallScore);
    const suggestions = this.generateImprovementSuggestions(scores);
    
    return {
      overall: {
        score: overallScore,
        performance,
        xpEarned: this.calculateXP(overallScore, userStats.totalDebates === 1, userStats.currentStreak)
      },
      breakdown,
      strengths: this.identifyStrengths(breakdown),
      improvements: suggestions,
      comparison: {
        personalBest: overallScore > (userStats.highestScore || 0),
        averageComparison: overallScore - (userStats.averageScore || 0)
      },
      nextSteps: this.generateNextSteps(breakdown, userStats.level)
    };
  }

  // Identify user's strengths
  identifyStrengths(breakdown) {
    return Object.entries(breakdown)
      .filter(([, data]) => data.score >= 80)
      .map(([criterion, data]) => ({
        area: criterion,
        score: data.score,
        description: `Excellent ${data.description.toLowerCase()}`
      }));
  }

  // Generate next steps for improvement
  generateNextSteps(breakdown, userLevel) {
    const steps = [];
    
    // Find areas for improvement
    const needsWork = Object.entries(breakdown)
      .filter(([, data]) => data.score < 75)
      .sort(([,a], [,b]) => a.score - b.score);
    
    if (needsWork.length > 0) {
      const primaryFocus = needsWork[0][0];
      steps.push({
        priority: 'high',
        action: `Focus on improving ${primaryFocus}`,
        suggestion: `Practice ${primaryFocus}-specific exercises`,
        timeframe: '1-2 weeks'
      });
    }
    
    // Level-appropriate suggestions
    if (userLevel < 3) {
      steps.push({
        priority: 'medium',
        action: 'Complete beginner tutorial series',
        suggestion: 'Master the basics before advancing',
        timeframe: 'Next 5 debates'
      });
    } else if (userLevel < 7) {
      steps.push({
        priority: 'medium',
        action: 'Practice with intermediate topics',
        suggestion: 'Challenge yourself with complex arguments',
        timeframe: 'Next 2 weeks'
      });
    } else {
      steps.push({
        priority: 'medium',
        action: 'Try advanced debate formats',
        suggestion: 'Explore parliamentary or Oxford-style debates',
        timeframe: 'Next month'
      });
    }
    
    return steps;
  }

  // Calculate leaderboard ranking
  calculateRanking(userScore, allScores) {
    const sortedScores = allScores.sort((a, b) => b - a);
    const rank = sortedScores.findIndex(score => score <= userScore) + 1;
    const percentile = Math.round(((allScores.length - rank) / allScores.length) * 100);
    
    return {
      rank,
      totalUsers: allScores.length,
      percentile,
      isTopPerformer: percentile >= 90
    };
  }
}

module.exports = ScoringService;
