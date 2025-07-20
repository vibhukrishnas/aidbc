const debatePrompts = {
  en: {
    basic: (topic, response) => `As an expert debate coach, analyze this debate response on the topic "${topic}":

Response: "${response}"

Provide feedback focusing on:
1. Argumentation quality and logical flow
2. Use of evidence and examples
3. Structure and organization
4. Clarity of expression
5. Addressing the topic effectively

Format your response as JSON with:
- strengths: array of 2-3 specific strengths
- improvements: array of 2-3 areas for improvement
- summary: encouraging summary (max 100 words)`,

    detailed: (topic, response, aspect) => `Analyze this debate response specifically for ${aspect}:

Topic: "${topic}"
Response: "${response}"

Provide detailed feedback on ${aspect} including:
- Current performance level
- Specific examples from the response
- Actionable improvement suggestions
- Practice exercises

Be constructive and encouraging.`,

    comparative: (response1, response2) => `Compare these two debate responses:

Response 1: "${response1}"
Response 2: "${response2}"

Analyze:
- Key differences in approach
- Strengths of each response
- Which arguments are more effective and why
- Suggestions for combining the best elements`
  },

  hi: {
    basic: (topic, response) => `एक विशेषज्ञ वाद-विवाद कोच के रूप में, "${topic}" विषय पर इस प्रतिक्रिया का विश्लेषण करें:

प्रतिक्रिया: "${response}"

निम्नलिखित पर ध्यान देते हुए प्रतिक्रिया दें:
1. तर्क की गुणवत्ता और तार्किक प्रवाह
2. साक्ष्य और उदाहरणों का उपयोग
3. संरचना और संगठन
4. अभिव्यक्ति की स्पष्टता
5. विषय को प्रभावी ढंग से संबोधित करना

JSON प्रारूप में उत्तर दें।`
  }
  // Add more languages as needed
};

// Scoring prompts
const scoringPrompts = {
  argumentation: `Evaluate the logical structure and persuasiveness of the arguments.
Score from 0-100 based on:
- Clarity of main thesis (20%)
- Supporting evidence quality (30%)
- Logical connections (25%)
- Addressing counterarguments (25%)`,

  delivery: `Assess the clarity and engagement of the presentation.
Score from 0-100 based on:
- Sentence variety and flow (25%)
- Appropriate tone (25%)
- Clear expression (25%)
- Engaging style (25%)`,

  rebuttal: `Evaluate how well potential counterarguments are addressed.
Score from 0-100 based on:
- Anticipation of objections (30%)
- Quality of responses (30%)
- Maintaining respectful tone (20%)
- Strengthening own position (20%)`,

  structure: `Analyze the organization and flow of ideas.
Score from 0-100 based on:
- Clear introduction (25%)
- Logical progression (30%)
- Effective transitions (20%)
- Strong conclusion (25%)`
};

// Context-aware prompts
const contextualPrompts = {
  beginner: {
    prefix: "For a beginner debater, focus on fundamental skills. ",
    suffix: "Provide encouragement and basic tips for improvement."
  },
  intermediate: {
    prefix: "For an intermediate debater, analyze technique and strategy. ",
    suffix: "Suggest ways to refine existing skills."
  },
  advanced: {
    prefix: "For an advanced debater, provide nuanced analysis. ",
    suffix: "Focus on subtle improvements and mastery-level techniques."
  }
};

// Cultural context modifiers
const culturalModifiers = {
  indian: "Consider Indian cultural context and communication styles. Include relevant local examples where appropriate.",
  global: "Consider diverse global perspectives and cross-cultural communication.",
  academic: "Focus on academic debate standards and formal argumentation.",
  casual: "Evaluate for everyday debate and discussion scenarios."
};

module.exports = {
  debatePrompts,
  scoringPrompts,
  contextualPrompts,
  culturalModifiers,
  
  // Helper function to build complete prompt
  buildPrompt: (language, type, params) => {
    const basePrompt = debatePrompts[language]?.[type] || debatePrompts.en[type];
    let prompt = basePrompt(...params);
    
    // Add contextual modifications
    if (params.level) {
      const context = contextualPrompts[params.level];
      prompt = context.prefix + prompt + context.suffix;
    }
    
    if (params.cultural) {
      prompt += '\n\n' + culturalModifiers[params.cultural];
    }
    
    return prompt;
  }
};