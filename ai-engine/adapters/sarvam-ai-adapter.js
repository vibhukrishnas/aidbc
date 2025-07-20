const axios = require('axios');
const FormData = require('form-data');

class SarvamAIAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.sarvam.ai/v1';
    this.timeout = config.timeout || 30000;
        
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Text generation
  async generateText(prompt, options = {}) {
    const payload = {
      model: options.model || 'sarvam-1',
      prompt: prompt,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.9,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0,
      language: options.language || 'en'
    };

    try {
      const response = await this.client.post('/generate', payload);
      return {
        success: true,
        text: response.data.generated_text || response.data.text,
        usage: response.data.usage,
        modelUsed: response.data.model
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Text translation
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    const payload = {
      text: text,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      preserve_formatting: true
    };

    try {
      const response = await this.client.post('/translate', payload);
      return {
        success: true,
        translatedText: response.data.translated_text,
        detectedLanguage: response.data.detected_language,
        confidence: response.data.confidence
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Speech to text
  async transcribeAudio(audioBuffer, language = 'en') {
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('language', language);
    formData.append('enable_punctuation', 'true');
    formData.append('enable_diarization', 'false');

    try {
      const response = await this.client.post('/speech-to-text', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      
      return {
        success: true,
        transcript: response.data.transcript,
        confidence: response.data.confidence,
        words: response.data.words || []
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Text to speech
  async synthesizeSpeech(text, options = {}) {
    const payload = {
      text: text,
      language: options.language || 'en',
      voice: options.voice || 'default',
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
      format: options.format || 'mp3'
    };

    try {
      const response = await this.client.post('/text-to-speech', payload, {
        responseType: 'arraybuffer'
      });
      
      return {
        success: true,
        audio: response.data,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Sentiment analysis
  async analyzeSentiment(text, language = 'en') {
    const payload = {
      text: text,
      language: language,
      granularity: 'sentence'
    };

    try {
      const response = await this.client.post('/sentiment', payload);
      return {
        success: true,
        overall: response.data.overall_sentiment,
        scores: response.data.sentiment_scores,
        sentences: response.data.sentence_sentiments || []
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Named entity recognition
  async extractEntities(text, language = 'en') {
    const payload = {
      text: text,
      language: language,
      entity_types: ['PERSON', 'LOCATION', 'ORGANIZATION', 'DATE', 'TIME']
    };

    try {
      const response = await this.client.post('/ner', payload);
      return {
        success: true,
        entities: response.data.entities
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Summarization
  async summarizeText(text, options = {}) {
    const payload = {
      text: text,
      language: options.language || 'en',
      summary_length: options.length || 'medium',
      summary_style: options.style || 'informative'
    };

    try {
      const response = await this.client.post('/summarize', payload);
      return {
        success: true,
        summary: response.data.summary,
        keyPoints: response.data.key_points || []
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Custom prompt with specific format
  async customPrompt(systemPrompt, userPrompt, options = {}) {
    const payload = {
      model: options.model || 'sarvam-1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      language: options.language || 'en'
    };

    try {
      const response = await this.client.post('/chat', payload);
      return {
        success: true,
        response: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // API returned an error response
      return {
        success: false,
        error: {
          status: error.response.status,
          message: error.response.data.error || error.response.data.message,
          code: error.response.data.code
        }
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: {
          message: 'No response from Sarvam AI API',
          timeout: error.code === 'ECONNABORTED'
        }
      };
    } else {
      // Something else went wrong
      return {
        success: false,
        error: {
          message: error.message
        }
      };
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        status: response.data.status,
        version: response.data.version
      };
    } catch (error) {
      return {
        success: false,
        status: 'unavailable'
      };
    }
  }

  // Get usage statistics
  async getUsageStats() {
    try {
      const response = await this.client.get('/usage');
      return {
        success: true,
        usage: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

module.exports = SarvamAIAdapter;