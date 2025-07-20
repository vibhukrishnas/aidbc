const multilingualSupport = {
  // Language-specific debate terminology
  debateTerms: {
    en: {
      argument: "argument",
      evidence: "evidence",
      rebuttal: "rebuttal",
      conclusion: "conclusion",
      stance: "stance",
      claim: "claim",
      counterargument: "counterargument"
    },
    hi: {
      argument: "तर्क",
      evidence: "साक्ष्य",
      rebuttal: "खंडन",
      conclusion: "निष्कर्ष",
      stance: "रुख",
      claim: "दावा",
      counterargument: "प्रतितर्क"
    },
    ta: {
      argument: "வாதம்",
      evidence: "சான்று",
      rebuttal: "மறுப்பு",
      conclusion: "முடிவு",
      stance: "நிலைப்பாடு",
      claim: "கூற்று",
      counterargument: "எதிர்வாதம்"
    }
    // Add more languages
  },

  // Language-specific feedback phrases
  feedbackPhrases: {
    en: {
      excellent: "Excellent work!",
      good: "Good job!",
      needsWork: "Needs improvement",
      tryAgain: "Keep practicing!",
      strength: "Strength:",
      weakness: "Area for improvement:",
      suggestion: "Suggestion:"
    },
    hi: {
      excellent: "उत्कृष्ट कार्य!",
      good: "अच्छा काम!",
      needsWork: "सुधार की आवश्यकता",
      tryAgain: "अभ्यास जारी रखें!",
      strength: "ताकत:",
      weakness: "सुधार का क्षेत्र:",
      suggestion: "सुझाव:"
    }
  },

  // Cultural context adjustments
  culturalContext: {
    en: {
      formalityLevel: "medium",
      exampleTypes: ["global", "western"],
      communicationStyle: "direct"
    },
    hi: {
      formalityLevel: "high",
      exampleTypes: ["indian", "local"],
      communicationStyle: "respectful"
    },
    ta: {
      formalityLevel: "high",
      exampleTypes: ["tamil", "indian"],
      communicationStyle: "formal"
    }
  },

  // Language detection patterns
  languagePatterns: {
    hi: /[\u0900-\u097F]/,
    ta: /[\u0B80-\u0BFF]/,
    te: /[\u0C00-\u0C7F]/,
    kn: /[\u0C80-\u0CFF]/,
    ml: /[\u0D00-\u0D7F]/,
    bn: /[\u0980-\u09FF]/,
    gu: /[\u0A80-\u0AFF]/,
    mr: /[\u0900-\u097F]/,
    pa: /[\u0A00-\u0A7F]/
  }
};

// Multilingual prompt builder
class MultilingualPromptBuilder {
  static detectLanguage(text) {
    for (const [lang, pattern] of Object.entries(multilingualSupport.languagePatterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    return 'en';
  }

  static buildPrompt(language, promptType, params) {
    const terms = multilingualSupport.debateTerms[language] || multilingualSupport.debateTerms.en;
    const phrases = multilingualSupport.feedbackPhrases[language] || multilingualSupport.feedbackPhrases.en;
    const context = multilingualSupport.culturalContext[language] || multilingualSupport.culturalContext.en;

    // Build culturally appropriate prompt
    let prompt = '';
    switch (promptType) {
      case 'analysis':
        prompt = this.buildAnalysisPrompt(language, terms, params);
        break;
      case 'feedback':
        prompt = this.buildFeedbackPrompt(language, phrases, params);
        break;
      case 'scoring':
        prompt = this.buildScoringPrompt(language, terms, params);
        break;
    }

    // Add cultural context
    prompt += `\n\nCultural context: ${context.communicationStyle} communication style, ${context.formalityLevel} formality level.`;
    return prompt;
  }

  static buildAnalysisPrompt(language, terms, params) {
    const templates = {
      en: `Analyze this ${terms.argument} on the topic "${params.topic}". Evaluate the ${terms.evidence}, ${terms.claim}s, and ${terms.counterargument}s.`,
      hi: `"${params.topic}" विषय पर इस ${terms.argument} का विश्लेषण करें। ${terms.evidence}, ${terms.claim} और ${terms.counterargument} का मूल्यांकन करें।`
    };
    return templates[language] || templates.en;
  }

  static translateFeedback(feedback, targetLanguage) {
    const phrases = multilingualSupport.feedbackPhrases[targetLanguage] || multilingualSupport.feedbackPhrases.en;
    
    // Simple translation mapping - in production, use Sarvam AI translation
    const translated = {
      strengths: feedback.strengths.map(s => `${phrases.strength} ${s}`),
      improvements: feedback.improvements.map(i => `${phrases.weakness} ${i}`),
      summary: feedback.summary
    };
    
    return translated;
  }
}

// Language-specific scoring adjustments
const languageScoringAdjustments = {
  // Some languages may have different expectations for structure or style
  hi: {
    structureWeight: 0.25, // Slightly higher weight on structure
    formalityBonus: 5 // Bonus points for formal language
  },
  en: {
    structureWeight: 0.20,
    formalityBonus: 0
  }
};

module.exports = {
  multilingualSupport,
  MultilingualPromptBuilder,
  languageScoringAdjustments
};