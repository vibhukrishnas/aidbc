const axios = require('axios');
const config = require('./environment');

class SarvamAIConfig {
  constructor() {
    this.apiKey = config.SARVAM_API_KEY;
    this.baseURL = config.SARVAM_API_BASE_URL;
    this.timeout = config.SARVAM_TIMEOUT;

    if (!this.apiKey) {
      throw new Error('SARVAM_API_KEY is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Sarvam AI Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          console.error('Sarvam AI Error:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url
          });
        } else if (error.request) {
          console.error('Sarvam AI Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check method
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return {
        status: 'healthy',
        response: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new SarvamAIConfig();