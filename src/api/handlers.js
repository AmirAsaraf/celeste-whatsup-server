const axios = require('axios');
const logger = require('../utils/logger');

class APIHandlers {
  constructor() {
    this.baseURL = process.env.EXTERNAL_API_URL;
    this.apiKey = process.env.EXTERNAL_API_KEY;
  }

  async processMessage(messageText) {
    try {
      // Parse the message to determine what API call to make
      const command = this.parseCommand(messageText);
      
      switch (command.type) {
        case 'weather':
          return await this.getWeather(command.params);
        case 'translate':
          return await this.translateText(command.params);
        case 'search':
          return await this.searchAPI(command.params);
        case 'help':
          return this.getHelpMessage();
        default:
          return await this.handleGenericQuery(messageText);
      }
    } catch (error) {
      logger.error('Error processing message:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }

  parseCommand(messageText) {
    const text = messageText.toLowerCase().trim();
    
    if (text.startsWith('/weather') || text.includes('weather')) {
      const location = text.replace('/weather', '').replace('weather', '').trim();
      return { type: 'weather', params: { location } };
    }
    
    if (text.startsWith('/translate')) {
      const parts = text.split(' ');
      const textToTranslate = parts.slice(1).join(' ');
      return { type: 'translate', params: { text: textToTranslate } };
    }
    
    if (text.startsWith('/search')) {
      const query = text.replace('/search', '').trim();
      return { type: 'search', params: { query } };
    }
    
    if (text.includes('help') || text === '/help') {
      return { type: 'help', params: {} };
    }
    
    return { type: 'generic', params: { text: messageText } };
  }

  async getWeather(params) {
    try {
      // Example weather API call
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          location: params.location,
          key: this.apiKey
        },
        timeout: 10000
      });
      
      const weather = response.data;
      return `Weather in ${params.location}: ${weather.description}, ${weather.temperature}°C`;
    } catch (error) {
      logger.error('Weather API error:', error);
      return `Sorry, I couldn't get weather information for ${params.location}. Please try again.`;
    }
  }

  async translateText(params) {
    try {
      // Example translation API call
      const response = await axios.post(`${this.baseURL}/translate`, {
        text: params.text,
        target_language: 'en'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      return `Translation: ${response.data.translated_text}`;
    } catch (error) {
      logger.error('Translation API error:', error);
      return 'Sorry, I couldn\'t translate that text. Please try again.';
    }
  }

  async searchAPI(params) {
    try {
      // Example search API call
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: params.query,
          api_key: this.apiKey
        },
        timeout: 10000
      });
      
      const results = response.data.results.slice(0, 3); // Limit to 3 results
      let message = `Search results for "${params.query}":\n\n`;
      
      results.forEach((result, index) => {
        message += `${index + 1}. ${result.title}\n${result.description}\n\n`;
      });
      
      return message;
    } catch (error) {
      logger.error('Search API error:', error);
      return `Sorry, I couldn't search for "${params.query}". Please try again.`;
    }
  }

  async handleGenericQuery(messageText) {
    try {
      // Generic API call for any message
      const response = await axios.post(`${this.baseURL}/chat`, {
        message: messageText
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      return response.data.response || 'I received your message but couldn\'t generate a response.';
    } catch (error) {
      logger.error('Generic API error:', error);
      return 'I received your message. How can I help you? Try sending /help for available commands.';
    }
  }

  getHelpMessage() {
    return `Available commands:
    
🌤️ /weather [location] - Get weather information
🔤 /translate [text] - Translate text to English  
🔍 /search [query] - Search for information
❓ /help - Show this help message

You can also send me any message and I'll try to help!`;
  }
}

module.exports = new APIHandlers();