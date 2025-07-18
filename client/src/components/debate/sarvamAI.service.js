const axios = require('axios');

class SarvamAIService {
  constructor() {
    this.apiKey = process.env.SARVAM_AI_API_KEY;
    this.baseURL = process.env.SARVAM_AI_BASE_URL || 'https://api.sarvam.ai';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': Bearer ${this.apiKey},
        'Content-Type': 'application/json'
      }
    });
  }

  async analyzeArgument(content, position = 'affirmative') {
    try {
      const prompt = 
        Analyze this debate argument for:
        1. Logical structure and coherence
        2. Evidence quality and relevance
        3. Persuasiveness and clarity
        4. Areas for improvement
        
        Position: ${position}
        Argument: ${content}
        
        Provide a score (0-100) and detailed feedback.
      ;

      const response = await this.client.post('/v1/chat/completions', {
        model: 'sarvam-2b-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert debate coach providing constructive feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const analysis = this.parseAnalysisResponse(response.data.choices[0].message.content);
      
      return {
        score: analysis.score,
        feedback: analysis.feedback,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        suggestions: analysis.suggestions
      };
    } catch (error) {
      console.error('Sarvam AI Analysis Error:', error);
      throw new Error('Failed to analyze argument');
    }
  }

  async generateTopicSuggestions(category = 'general', difficulty = 'intermediate') {
    try {
      const prompt = 
        Generate 5 debate topics for ${category} category at ${difficulty} level.
        Topics should be:
        1. Current and relevant
        2. Balanced (both sides arguable)
        3. Educational and engaging
        4. Appropriate for students
        
        Format as JSON array with title, description, and complexity level.
      ;

      const response = await this.client.post('/v1/chat/completions', {
        model: 'sarvam-2b-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.8
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Topic Generation Error:', error);
      throw new Error('Failed to generate topics');
    }
  }

  async translateContent(content, targetLanguage) {
    try {
      const response = await this.client.post('/v1/translate', {
        input: content,
        source_language_code: 'en-IN',
        target_language_code: targetLanguage,
        speaker_gender: 'Male',
        mode: 'formal'
      });

      return response.data.translated_text;
    } catch (error) {
      console.error('Translation Error:', error);
      throw new Error('Failed to translate content');
    }
  }

  parseAnalysisResponse(responseText) {
    // Parse AI response to extract structured feedback
    const scoreMatch = responseText.match(/Score[:\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    return {
      score,
      feedback: responseText,
      strengths: this.extractSection(responseText, 'strengths'),
      improvements: this.extractSection(responseText, 'improvements'),
      suggestions: this.extractSection(responseText, 'suggestions')
    };
  }

  extractSection(text, section) {
    const regex = new RegExp(${section}[:\s]*([^\\n]+), 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}

module.exports = new SarvamAIService();
