const feedbackTemplates = {
  strengths: {
    argumentation: [
      "Your main argument is clearly stated and well-supported",
      "Excellent use of logical reasoning to build your case",
      "Strong evidence provided to support your claims",
      "Good job connecting your points to the main thesis"
    ],
    delivery: [
      "Clear and engaging writing style",
      "Good variation in sentence structure",
      "Confident tone throughout the response",
      "Effective use of transitions between ideas"
    ],
    rebuttal: [
      "Thoughtful consideration of opposing viewpoints",
      "Strong counterarguments that strengthen your position",
      "Respectful acknowledgment of different perspectives",
      "Effective refutation of potential objections"
    ],
    structure: [
      "Well-organized response with clear sections",
      "Strong introduction that sets up your argument",
      "Logical flow from point to point",
      "Compelling conclusion that reinforces your thesis"
    ]
  },
  
  improvements: {
    argumentation: [
      "Try to include more specific examples or data",
      "Strengthen the logical connections between your points",
      "Consider addressing potential weaknesses in your argument",
      "Develop your supporting points more thoroughly"
    ],
    delivery: [
      "Vary your sentence length for better rhythm",
      "Use more precise vocabulary to express your ideas",
      "Work on maintaining a consistent tone",
      "Add more transitional phrases to improve flow"
    ],
    rebuttal: [
      "Anticipate and address more counterarguments",
      "Strengthen your responses to opposing views",
      "Acknowledge valid points from the other side",
      "Use evidence to refute opposing claims"
    ],
    structure: [
      "Create a clearer roadmap in your introduction",
      "Improve transitions between main points",
      "Ensure each paragraph has a clear purpose",
      "Strengthen your conclusion with a call to action"
    ]
  }
};

const encouragementPhrases = {
  excellent: [
    "Outstanding work! Your debate skills are really shining through.",
    "Excellent performance! You're mastering the art of argumentation.",
    "Brilliant job! Your arguments are compelling and well-structured."
  ],
  good: [
    "Good effort! You're showing solid debate skills.",
    "Well done! Your arguments are developing nicely.",
    "Nice work! Keep building on these strengths."
  ],
  developing: [
    "Keep practicing! Every debate helps you improve.",
    "You're on the right track! Focus on the suggestions for growth.",
    "Good start! With practice, your skills will continue to develop."
  ]
};

const specificFeedback = {
  shortResponse: {
    feedback: "Your response is quite brief. Try to expand your arguments with more detail and examples.",
    suggestion: "Aim for at least 150-200 words to fully develop your points."
  },
  noEvidence: {
    feedback: "Your argument would be stronger with specific evidence or examples.",
    suggestion: "Try to include at least 2-3 concrete examples or pieces of evidence."
  },
  weakStructure: {
    feedback: "The organization of your response could be clearer.",
    suggestion: "Use a clear introduction, body paragraphs for each main point, and a conclusion."
  },
  excellentLogic: {
    feedback: "Your logical reasoning is exceptional!",
    suggestion: "Consider teaching others your approach to constructing arguments."
  }
};

// Dynamic feedback generator
class FeedbackGenerator {
  static generateFeedback(analysis, score, language = 'en') {
    const feedback = {
      strengths: [],
      improvements: [],
      summary: ''
    };

    // Select strengths based on high-scoring areas
    const strongAreas = Object.entries(analysis.categoryScores)
      .filter(([_, score]) => score >= 75)
      .map(([category, _]) => category);

    strongAreas.forEach(area => {
      const possibleStrengths = feedbackTemplates.strengths[area] || [];
      if (possibleStrengths.length > 0) {
        feedback.strengths.push(
          possibleStrengths[Math.floor(Math.random() * possibleStrengths.length)]
        );
      }
    });

    // Select improvements based on low-scoring areas
    const weakAreas = Object.entries(analysis.categoryScores)
      .filter(([_, score]) => score < 70)
      .map(([category, _]) => category);

    weakAreas.forEach(area => {
      const possibleImprovements = feedbackTemplates.improvements[area] || [];
      if (possibleImprovements.length > 0) {
        feedback.improvements.push(
          possibleImprovements[Math.floor(Math.random() * possibleImprovements.length)]
        );
      }
    });

    // Generate summary based on overall score
    let encouragementLevel = 'developing';
    if (score >= 85) encouragementLevel = 'excellent';
    else if (score >= 70) encouragementLevel = 'good';

    const encouragement = encouragementPhrases[encouragementLevel];
    feedback.summary = encouragement[Math.floor(Math.random() * encouragement.length)];

    // Add specific feedback if applicable
    if (analysis.wordCount < 100) {
      feedback.improvements.push(specificFeedback.shortResponse.suggestion);
    }

    return feedback;
  }

  static generateDetailedFeedback(aspect, performance, examples) {
    const detailed = {
      overview: `Your ${aspect} performance shows ${performance.level} proficiency.`,
      strengths: [],
      improvements: [],
      exercises: [],
      examples: examples
    };

    // Add aspect-specific detailed feedback
    switch (aspect) {
      case 'argumentation':
        detailed.exercises = [
          "Practice the PEEL method: Point, Evidence, Explanation, Link",
          "Create argument maps for complex topics",
          "Study logical fallacies to avoid them"
        ];
        break;
      case 'delivery':
        detailed.exercises = [
          "Read your response aloud to check flow",
          "Practice varying sentence lengths",
          "Study powerful speeches for inspiration"
        ];
        break;
      case 'rebuttal':
        detailed.exercises = [
          "Practice steel-manning (presenting the strongest version of opposing arguments)",
          "Create a rebuttal bank for common arguments",
          "Study successful debate rebuttals"
        ];
        break;
      case 'structure':
        detailed.exercises = [
          "Create outlines before writing",
          "Practice the hamburger paragraph method",
          "Study essay structures from top debaters"
        ];
        break;
    }

    return detailed;
  }
}

module.exports = {
  feedbackTemplates,
  encouragementPhrases,
  specificFeedback,
  FeedbackGenerator
};