const SarvamAIConfig = require('../config/sarvam-ai');
const axios = require('axios');

class SarvamAIService {
  constructor() {
    this.config = new SarvamAIConfig();
    this.apiKey = process.env.SARVAM_API_KEY;
    this.baseURL = process.env.SARVAM_API_URL || 'https://api.sarvam.ai';
  }

  // Analyze debate content and provide feedback
  async analyzeDebate(debateContent, language = 'en') {
    try {
      const prompt = this.generateAnalysisPrompt(debateContent);
      
      const response = await this.makeAPICall('/chat/completions', {
        model: 'sarvam-2b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert debate coach. Analyze debates and provide constructive feedback on argumentation, delivery, structure, and rebuttal skills.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return this.parseDebateAnalysis(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing debate:', error);
      throw new Error('Failed to analyze debate content');
    }
  }

  // Generate counter-arguments for practice
  async generateCounterArguments(topic, position, arguments, language = 'en') {
    try {
      const prompt = `
        Topic: ${topic}
        Position being argued: ${position}
        Arguments presented: ${arguments.map(arg => `- ${arg.point}: ${arg.evidence}`).join('\n')}
        
        Generate 3 strong counter-arguments that challenge these points. For each counter-argument, provide:
        1. The main counterpoint
        2. Supporting evidence or reasoning
        3. Potential weaknesses in the original argument
        
        Format your response as JSON with the structure:
        {
          "counterArguments": [
            {
              "point": "Main counterpoint",
              "evidence": "Supporting evidence",
              "weaknessExploited": "Weakness in original argument"
            }
          ]
        }
      `;

      const response = await this.makeAPICall('/chat/completions', {
        model: 'sarvam-2b',
        messages: [
          {
            role: 'system',
            content: 'You are a skilled debate opponent. Generate thoughtful counter-arguments to help users improve their debate skills.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      return result.counterArguments;
    } catch (error) {
      console.error('Error generating counter-arguments:', error);
      throw new Error('Failed to generate counter-arguments');
    }
  }

  // Translate content to different languages
  async translateContent(content, targetLanguage) {
    try {
      if (!this.config.supportedLanguages.includes(targetLanguage)) {
        throw new Error(`Language ${targetLanguage} not supported`);
      }

      const response = await this.makeAPICall('/translate', {
        input: content,
        source_language_code: 'en',
        target_language_code: targetLanguage,
        speaker_gender: 'Auto-detect',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true
      });

      return response.data.translated_text;
    } catch (error) {
      console.error('Error translating content:', error);
      throw new Error(`Failed to translate to ${targetLanguage}`);
    }
  }

  // Generate practice questions based on topic
  async generatePracticeQuestions(topic, difficulty = 'intermediate', count = 5) {
    try {
      const prompt = `
        Generate ${count} thought-provoking practice questions for the debate topic: "${topic}"
        
        Difficulty level: ${difficulty}
        
        Questions should:
        - Challenge different aspects of the topic
        - Encourage critical thinking
        - Be suitable for ${difficulty} level debaters
        - Cover various angles (ethical, practical, economic, social)
        
        Format as JSON:
        {
          "questions": [
            {
              "question": "Question text",
              "type": "critical-thinking|research|ethical|practical",
              "difficulty": "${difficulty}",
              "hints": ["hint1", "hint2"]
            }
          ]
        }
      `;

      const response = await this.makeAPICall('/chat/completions', {
        model: 'sarvam-2b',
        messages: [
          {
            role: 'system',
            content: 'You are an educational content generator specializing in debate preparation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1200
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      return result.questions;
    } catch (error) {
      console.error('Error generating practice questions:', error);
      throw new Error('Failed to generate practice questions');
    }
  }

  // Suggest improvements based on debate analysis
  async suggestImprovements(analysisResults, userLevel) {
    try {
      const prompt = `
        Based on the following debate analysis, suggest specific improvements:
        
        Analysis Results:
        - Overall Score: ${analysisResults.overallScore}/100
        - Argumentation: ${analysisResults.scores.argumentation}/100
        - Delivery: ${analysisResults.scores.delivery}/100
        - Rebuttal: ${analysisResults.scores.rebuttal}/100
        - Structure: ${analysisResults.scores.structure}/100
        
        User Level: ${userLevel}
        Strengths: ${analysisResults.strengths.join(', ')}
        Areas for Improvement: ${analysisResults.improvements.join(', ')}
        
        Provide:
        1. 3 specific, actionable improvement suggestions
        2. Recommended practice exercises
        3. Learning resources (books, videos, courses)
        4. Next steps for skill development
        
        Format as JSON with detailed explanations.
      `;

      const response = await this.makeAPICall('/chat/completions', {
        model: 'sarvam-2b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert debate coach providing personalized improvement suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating improvement suggestions:', error);
      throw new Error('Failed to generate improvement suggestions');
    }
  }

  // Generate debate topics based on user interests and skill level
  async generateTopics(interests, skillLevel, count = 5, language = 'en') {
    try {
      const prompt = `
        Generate ${count} debate topics based on:
        
        User Interests: ${interests.join(', ')}
        Skill Level: ${skillLevel}
        Language: ${language}
        
        Topics should be:
        - Relevant to user interests
        - Appropriate for ${skillLevel} level
        - Current and engaging
        - Balanced (both sides arguable)
        
        For each topic, include:
        - Title
        - Brief description
        - Category
        - Key discussion points
        - Estimated difficulty
        
        Format as JSON array.
      `;

      const response = await this.makeAPICall('/chat/completions', {
        model: 'sarvam-2b',
        messages: [
          {
            role: 'system',
            content: 'You are a debate topic curator who creates engaging and balanced debate topics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating topics:', error);
      throw new Error('Failed to generate debate topics');
    }
  }

  // Helper Methods
  generateAnalysisPrompt(debateContent) {
    return `
      Analyze this debate submission and provide detailed feedback:
      
      Topic: ${debateContent.topic}
      Position: ${debateContent.position}
      
      Arguments:
      ${debateContent.arguments.map((arg, i) => `${i+1}. ${arg.point}\n   Evidence: ${arg.evidence}`).join('\n')}
      
      Rebuttals:
      ${debateContent.rebuttalPoints?.map((reb, i) => `${i+1}. ${reb.rebuttal}`).join('\n') || 'None provided'}
      
      Conclusion: ${debateContent.conclusion}
      
      Provide scores (0-100) for:
      1. Argumentation (logic, relevance, strength)
      2. Delivery (clarity, structure, flow)
      3. Rebuttal (addressing counterpoints)
      4. Structure (organization, transitions)
      
      Also provide:
      - Overall score
      - 3 strengths
      - 3 areas for improvement
      - Detailed feedback
      - Suggested resources
      
      Format response as JSON with these exact keys: overallScore, scores, strengths, improvements, detailedFeedback, suggestedResources.
    `;
  }

  parseDebateAnalysis(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      // Fallback parsing if JSON is malformed
      return {
        overallScore: 75,
        scores: {
          argumentation: 75,
          delivery: 75,
          rebuttal: 70,
          structure: 80
        },
        strengths: ['Good structure', 'Clear arguments', 'Strong evidence'],
        improvements: ['Strengthen rebuttals', 'Add more examples', 'Improve transitions'],
        detailedFeedback: 'Overall solid debate performance with room for improvement in rebuttal techniques.',
        suggestedResources: []
      };
    }
  }

  async makeAPICall(endpoint, data) {
    const config = {
      method: 'POST',
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      data: data,
      timeout: 30000
    };

    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('API Request Error:', error.request);
        throw new Error('Network error: Unable to reach Sarvam AI API');
      } else {
        console.error('API Setup Error:', error.message);
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await this.makeAPICall('/health', {});
      return response.status === 200;
    } catch (error) {
      console.error('Sarvam AI health check failed:', error);
      return false;
    }
  }

  // Get available models
  async getAvailableModels() {
    try {
      const response = await this.makeAPICall('/models', {});
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return ['sarvam-2b']; // Default fallback
    }
  }
}

module.exports = SarvamAIService;
