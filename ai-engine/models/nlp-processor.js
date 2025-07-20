class NLPProcessor {
  constructor() {
    this.sentimentWords = {
      positive: [
        'excellent', 'great', 'wonderful', 'fantastic', 'amazing',
        'brilliant', 'outstanding', 'exceptional', 'superb', 'remarkable'
      ],
      negative: [
        'terrible', 'awful', 'horrible', 'poor', 'bad',
        'disappointing', 'inadequate', 'unsatisfactory', 'weak', 'flawed'
      ],
      neutral: [
        'adequate', 'acceptable', 'moderate', 'average', 'fair',
        'reasonable', 'satisfactory', 'decent', 'okay', 'standard'
      ]
    };

    this.transitionWords = {
      addition: ['furthermore', 'moreover', 'additionally', 'also', 'besides'],
      contrast: ['however', 'nevertheless', 'although', 'despite', 'yet'],
      cause: ['because', 'since', 'as', 'due to', 'owing to'],
      effect: ['therefore', 'thus', 'consequently', 'hence', 'accordingly'],
      sequence: ['firstly', 'secondly', 'finally', 'subsequently', 'next'],
      example: ['for example', 'for instance', 'such as', 'namely', 'specifically']
    };

    this.debateIndicators = {
      claim: ['argue', 'believe', 'contend', 'assert', 'maintain'],
      evidence: ['research shows', 'studies indicate', 'data suggests', 'according to'],
      reasoning: ['because', 'therefore', 'since', 'as a result', 'consequently'],
      counterargument: ['however', 'on the other hand', 'critics argue', 'opponents claim'],
      concession: ['admittedly', 'granted', 'true', 'acknowledge', 'recognize']
    };
  }

  analyzeText(text) {
    const analysis = {
      basicMetrics: this.getBasicMetrics(text),
      readability: this.calculateReadability(text),
      sentiment: this.analyzeSentiment(text),
      structure: this.analyzeStructure(text),
      debateElements: this.identifyDebateElements(text),
      languageQuality: this.assessLanguageQuality(text)
    };

    return analysis;
  }

  getBasicMetrics(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    return {
      characterCount: text.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      averageSentenceLength: words.length / sentences.length,
      uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
      vocabularyDiversity: new Set(words.map(w => w.toLowerCase())).size / words.length
    };
  }

  calculateReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    // Flesch Reading Ease
    const fleschScore = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);

    // Flesch-Kincaid Grade Level
    const fkGrade = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;

    return {
      fleschReadingEase: Math.max(0, Math.min(100, fleschScore)),
      fleschKincaidGrade: Math.max(0, fkGrade),
      interpretation: this.interpretReadability(fleschScore)
    };
  }

  countSyllables(word) {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;
    const vowels = 'aeiouy';

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent e
    if (word.endsWith('e')) {
      count--;
    }

    // Ensure at least one syllable
    return Math.max(1, count);
  }

  interpretReadability(score) {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  analyzeSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    words.forEach(word => {
      if (this.sentimentWords.positive.includes(word)) positiveCount++;
      else if (this.sentimentWords.negative.includes(word)) negativeCount++;
      else if (this.sentimentWords.neutral.includes(word)) neutralCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount + neutralCount;
        
    return {
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount,
      overall: positiveCount > negativeCount ? 'positive' :
                negativeCount > positiveCount ? 'negative' : 'neutral',
      confidence: totalSentimentWords / words.length
    };
  }

  analyzeStructure(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    // Check for introduction
    const hasIntroduction = /^(in this debate|i will argue|the topic|today)/i.test(text);

    // Check for conclusion
    const hasConclusion = /(in conclusion|to conclude|finally|in summary)/i.test(text);

    // Count transition words
    let transitionCount = 0;
    for (const [type, words] of Object.entries(this.transitionWords)) {
      words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        transitionCount += (text.match(regex) || []).length;
      });
    }

    // Analyze sentence variety
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const varietyScore = Math.sqrt(variance);

    return {
      hasIntroduction,
      hasConclusion,
      paragraphCount: paragraphs.length,
      transitionWords: transitionCount,
      sentenceVariety: varietyScore > 5 ? 'high' : varietyScore > 2 ? 'medium' : 'low',
      structureScore: (hasIntroduction ? 25 : 0) +
                      (hasConclusion ? 25 : 0) +
                      Math.min(transitionCount * 5, 25) +
                     (varietyScore > 5 ? 25 : varietyScore > 2 ? 15 : 5)
    };
  }

  identifyDebateElements(text) {
    const elements = {
      claims: [],
      evidence: [],
      reasoning: [],
      counterarguments: [],
      concessions: []
    };

    // Split into sentences for analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();

      // Check for different debate elements
      for (const [element, indicators] of Object.entries(this.debateIndicators)) {
        indicators.forEach(indicator => {
          if (lowerSentence.includes(indicator)) {
            elements[element].push({
              indicator,
              sentence: sentence.trim(),
              position: text.indexOf(sentence)
            });
          }
        });
      }
    });

    // Calculate debate quality score
    const debateScore = (
      elements.claims.length * 10 +
      elements.evidence.length * 15 +
      elements.reasoning.length * 10 +
      elements.counterarguments.length * 15 +
      elements.concessions.length * 10
    );

    return {
      ...elements,
      debateQualityScore: Math.min(100, debateScore),
      balance: this.assessBalance(elements)
    };
  }

  assessBalance(elements) {
    const hasAllElements = 
      elements.claims.length > 0 &&
      elements.evidence.length > 0 &&
      elements.reasoning.length > 0;

    const hasCounterarguments = elements.counterarguments.length > 0;
    const hasConcessions = elements.concessions.length > 0;

    if (hasAllElements && hasCounterarguments && hasConcessions) {
      return 'excellent';
    } else if (hasAllElements && (hasCounterarguments || hasConcessions)) {
      return 'good';
    } else if (hasAllElements) {
      return 'adequate';
    } else {
      return 'needs improvement';
    }
  }

  assessLanguageQuality(text) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for common errors
    const errors = {
      doubleSpaces: (text.match(/  +/g) || []).length,
      missingCapitalization: sentences.filter(s => s.trim() && !/^[A-Z]/.test(s.trim())).length,
      unclosedQuotes: (text.match(/"/g) || []).length % 2,
      repeatedWords: this.findRepeatedWords(words)
    };

    // Calculate quality score
    const errorPenalty = 
      errors.doubleSpaces * 2 +
      errors.missingCapitalization * 5 +
      errors.unclosedQuotes * 10 +
      errors.repeatedWords * 3;

    const qualityScore = Math.max(0, 100 - errorPenalty);

    return {
      errors,
      qualityScore,
      suggestions: this.generateLanguageSuggestions(errors)
    };
  }

  findRepeatedWords(words) {
    let repeats = 0;
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].toLowerCase() === words[i + 1].toLowerCase() && words[i].length > 2) {
        repeats++;
      }
    }
    return repeats;
  }

  generateLanguageSuggestions(errors) {
    const suggestions = [];

    if (errors.doubleSpaces > 0) {
      suggestions.push('Remove extra spaces between words');
    }
    if (errors.missingCapitalization > 0) {
      suggestions.push('Capitalize the first letter of each sentence');
    }
    if (errors.unclosedQuotes > 0) {
      suggestions.push('Check for unclosed quotation marks');
    }
    if (errors.repeatedWords > 0) {
      suggestions.push('Avoid repeating the same word consecutively');
    }

    return suggestions;
  }
}

module.exports = new NLPProcessor();