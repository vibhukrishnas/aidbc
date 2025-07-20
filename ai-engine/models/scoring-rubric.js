class ScoringRubric {
  constructor() {
    this.categories = {
      argumentation: {
        weight: 0.30,
        subcriteria: {
          clarity: {
            weight: 0.25,
            indicators: [
              { keyword: 'clear', points: 2 },
              { keyword: 'specific', points: 2 },
              { keyword: 'precise', points: 1 },
              { pattern: /I (argue|believe|contend) that/i, points: 3 }
            ]
          },
          evidence: {
            weight: 0.35,
            indicators: [
              { keyword: 'example', points: 3 },
              { keyword: 'research', points: 4 },
              { keyword: 'study', points: 4 },
              { keyword: 'data', points: 3 },
              { pattern: /according to/i, points: 2 },
              { pattern: /\d+%/, points: 2 } // Percentages
            ]
          },
          logic: {
            weight: 0.25,
            indicators: [
              { keyword: 'therefore', points: 2 },
              { keyword: 'because', points: 2 },
              { keyword: 'consequently', points: 2 },
              { keyword: 'thus', points: 2 },
              { pattern: /if.*then/i, points: 3 }
            ]
          },
          depth: {
            weight: 0.15,
            indicators: [
              { pattern: /first.*second.*third/i, points: 5 },
              { minWords: 200, points: 5 },
              { minSentences: 8, points: 3 }
            ]
          }
        }
      },

      delivery: {
        weight: 0.25,
        subcriteria: {
          clarity: {
            weight: 0.30,
            indicators: [
              { avgWordLength: { min: 4, max: 8 }, points: 5 },
              { sentenceVariety: true, points: 5 }
            ]
          },
          engagement: {
            weight: 0.30,
            indicators: [
              { keyword: 'imagine', points: 2 },
              { keyword: 'consider', points: 2 },
              { pattern: /what if/i, points: 3 },
              { rhetoricalQuestions: true, points: 3 }
            ]
          },
          tone: {
            weight: 0.20,
            indicators: [
              { keyword: 'respectfully', points: 2 },
              { keyword: 'importantly', points: 1 },
              { formalityScore: true, points: 5 }
            ]
          },
          flow: {
            weight: 0.20,
            indicators: [
              { keyword: 'furthermore', points: 2 },
              { keyword: 'however', points: 2 },
              { keyword: 'additionally', points: 2 },
              { transitionWords: { min: 3 }, points: 5 }
            ]
          }
        }
      },

      rebuttal: {
        weight: 0.25,
        subcriteria: {
          anticipation: {
            weight: 0.35,
            indicators: [
              { pattern: /some (may|might|could) argue/i, points: 5 },
              { pattern: /critics (say|claim|argue)/i, points: 4 },
              { keyword: 'opponents', points: 3 },
              { keyword: 'counterargument', points: 4 }
            ]
          },
          refutation: {
            weight: 0.35,
            indicators: [
              { keyword: 'however', points: 2 },
              { keyword: 'nevertheless', points: 3 },
              { keyword: 'despite', points: 2 },
              { pattern: /this is flawed because/i, points: 5 }
            ]
          },
          balance: {
            weight: 0.30,
            indicators: [
              { keyword: 'acknowledge', points: 3 },
              { keyword: 'valid', points: 2 },
              { pattern: /while.*valid.*however/i, points: 5 },
              { bothSidesAddressed: true, points: 5 }
            ]
          }
        }
      },

      structure: {
        weight: 0.20,
        subcriteria: {
          introduction: {
            weight: 0.30,
            indicators: [
              { pattern: /^(In this debate|I will argue|The topic)/i, points: 5 },
              { thesisInFirst: true, points: 5 },
              { roadmap: true, points: 3 }
            ]
          },
          body: {
            weight: 0.40,
            indicators: [
              { paragraphCount: { min: 3 }, points: 5 },
              { topicSentences: true, points: 5 },
              { logicalProgression: true, points: 5 }
            ]
          },
          conclusion: {
            weight: 0.30,
            indicators: [
              { pattern: /(in conclusion|to conclude|finally)/i, points: 5 },
              { summaryPresent: true, points: 3 },
              { callToAction: true, points: 2 }
            ]
          }
        }
      }
    };

    this.bonuses = {
      creativity: {
        metaphor: 5,
        analogy: 5,
        personalStory: 3
      },
      engagement: {
        question: 2,
        exclamation: 1,
        quote: 3
      },
      academic: {
        citation: 5,
        statistic: 4,
        expertOpinion: 4
      }
    };

    this.penalties = {
      repetition: -2,
      offTopic: -5,
      grammaticalErrors: -1,
      incoherence: -3,
      tooShort: -10,
      tooLong: -5
    };
  }

  calculateScore(text, category = null) {
    if (category) {
      return this.calculateCategoryScore(text, this.categories[category]);
    }

    let totalScore = 0;
    for (const [catName, catData] of Object.entries(this.categories)) {
      const categoryScore = this.calculateCategoryScore(text, catData);
      totalScore += categoryScore * catData.weight;
    }

    // Apply bonuses and penalties
    totalScore += this.calculateBonuses(text);
    totalScore += this.calculatePenalties(text);

    return Math.max(0, Math.min(100, Math.round(totalScore)));
  }

  calculateCategoryScore(text, category) {
    let categoryScore = 0;

    for (const [subName, subData] of Object.entries(category.subcriteria)) {
      let subScore = 0;

      for (const indicator of subData.indicators) {
        if (indicator.keyword) {
          const regex = new RegExp(`\\b${indicator.keyword}\\b`, 'gi');
          const matches = (text.match(regex) || []).length;
          subScore += Math.min(matches * indicator.points, indicator.points * 2);
        }

        if (indicator.pattern) {
          const matches = (text.match(indicator.pattern) || []).length;
          subScore += Math.min(matches * indicator.points, indicator.points * 2);
        }

        if (indicator.minWords) {
          const wordCount = text.split(/\s+/).length;
          if (wordCount >= indicator.minWords) {
            subScore += indicator.points;
          }
        }

        if (indicator.minSentences) {
          const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
          if (sentenceCount >= indicator.minSentences) {
            subScore += indicator.points;
          }
        }
      }

      categoryScore += (subScore / (subData.indicators.length * 5)) * 100 * subData.weight;
    }

    return categoryScore;
  }

  calculateBonuses(text) {
    let bonus = 0;

    // Check for creativity bonuses
    if (/like|as if|similar to/i.test(text)) bonus += this.bonuses.creativity.metaphor;
    if (/\?/.test(text)) bonus += this.bonuses.engagement.question;
    if (/".*"/.test(text)) bonus += this.bonuses.engagement.quote;

    return Math.min(bonus, 15); // Cap bonuses at 15 points
  }

  calculatePenalties(text) {
    let penalty = 0;

    const wordCount = text.split(/\s+/).length;
    if (wordCount < 100) penalty += this.penalties.tooShort;
    if (wordCount > 1000) penalty += this.penalties.tooLong;

    // Check for repetition
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const repetitions = Object.values(wordFreq).filter(count => count > 3).length;
    penalty += repetitions * this.penalties.repetition;

    return Math.max(penalty, -20); // Cap penalties at -20 points
  }

  generateDetailedBreakdown(text) {
    const breakdown = {};

    for (const [catName, catData] of Object.entries(this.categories)) {
      breakdown[catName] = {
        score: this.calculateCategoryScore(text, catData),
        weight: catData.weight,
        subcriteria: {}
      };

      for (const [subName, subData] of Object.entries(catData.subcriteria)) {
        breakdown[catName].subcriteria[subName] = {
          score: 0, // Calculate individual subscores
          weight: subData.weight
        };
      }
    }

    return breakdown;
  }
}

module.exports = new ScoringRubric();