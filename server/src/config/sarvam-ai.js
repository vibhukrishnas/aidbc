// Sarvam AI Configuration
module.exports = {
 apiKey: process.env.SARVAM_AI_API_KEY || 'sk_r5yqc3yy_KDrfQsFdd2U6tezhrIeqtiBm',
 baseURL: process.env.SARVAM_AI_BASE_URL || 'https://api.sarvam.ai',
 timeout: 30000,
 maxRetries: 3,
 models: {
 chat: 'sarvam-2b-chat',
 translation: 'sarvam-translate',
 tts: 'sarvam-tts'
 },
 supportedLanguages: [
 'hi', 'bn', 'gu', 'ta', 'te', 'kn', 'ml', 'mr', 'or', 'pa', 'as', 'en'
 ]
};
