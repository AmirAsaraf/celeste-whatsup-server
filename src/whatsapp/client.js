const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');

class WhatsAppClient {
  constructor() {
    // For whatsapp-web.js (personal WhatsApp)
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
      }),
      puppeteer: {
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        executablePath: process.env.CHROME_PATH || undefined,
        timeout: 60000
      }
    });

    this.isReady = false;
    this.welcomeMessageSent = false;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('loading_screen', (percent, message) => {
      logger.info(`Loading WhatsApp: ${percent}% - ${message}`);
    });

    this.client.on('qr', (qr) => {
      logger.info('QR Code received, scan with your phone:');
      qrcode.generate(qr, { small: true });
      logger.info('Waiting for QR code scan...');
    });

    this.client.on('ready', async () => {
      logger.info('WhatsApp client is ready!');
      this.isReady = true;

      // Only send welcome message once
      if (!this.welcomeMessageSent) {
        // Wait a bit for WhatsApp Web to fully initialize
        setTimeout(async () => {
          await this.sendWelcomeMessage();
          this.welcomeMessageSent = true;
        }, 3000); // 3 second delay
      }
    });

    this.client.on('authenticated', () => {
      logger.info('WhatsApp client authenticated successfully');
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('Authentication failed:', msg);
    });

    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp client disconnected:', reason);
    });

    this.client.on('change_state', (state) => {
      logger.info(`WhatsApp client state changed: ${state}`);
    });
  }

  async initialize() {
    try {
      logger.info('Starting WhatsApp client initialization...');
      await this.client.initialize();
      logger.info('WhatsApp client initialization completed');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  // Send message using whatsapp-web.js
  async sendMessage(to, message) {
    try {
      // Check if client is ready
      if (!this.client || !this.client.info) {
        throw new Error('WhatsApp client not ready');
      }

      // Format phone number for whatsapp-web.js
      const chatId = to.includes('@') ? to : `${to}@c.us`;

      // Add retry logic for WhatsApp Web
      let retries = 3;
      while (retries > 0) {
        try {
          await this.client.sendMessage(chatId, message);
          logger.info(`Message sent to ${to}: ${message.substring(0, 50)}...`);
          return;
        } catch (sendError) {
          retries--;
          if (retries === 0) {
            throw sendError;
          }
          logger.warn(`Retry sending message to ${to}, attempts left: ${retries}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      logger.error(`Error sending message to ${to}:`, error.message);
      throw error;
    }
  }



  async sendWelcomeMessage() {
    try {
      // Check if client is properly initialized
      if (!this.client || !this.client.info) {
        logger.warn('Client not fully ready, skipping welcome message');
        return;
      }

      // Get admin numbers from environment
      const adminNumbersEnv = process.env.ADMIN_NUMBERS;
      if (!adminNumbersEnv || adminNumbersEnv.trim() === '') {
        logger.info('No admin numbers configured in ADMIN_NUMBERS, skipping welcome message');
        return;
      }

      const adminNumbers = adminNumbersEnv.split(',').map(num => num.trim()).filter(num => num.length > 0);

      if (adminNumbers.length === 0) {
        logger.info('No valid admin numbers found, skipping welcome message');
        return;
      }

      logger.info(`Sending welcome message to ${adminNumbers.length} admin number(s): ${adminNumbers.join(', ')}`);

      const welcomeMessage = this.getWelcomeMessage();

      // Send to each admin number specifically
      for (const adminNumber of adminNumbers) {
        try {
          // Validate and format phone number
          if (!this.isValidPhoneNumber(adminNumber)) {
            logger.warn(`Invalid phone number format: ${adminNumber}, skipping`);
            continue;
          }

          // Format phone number properly for WhatsApp
          const chatId = this.formatPhoneNumber(adminNumber);

          logger.info(`Attempting to send welcome message to: ${adminNumber} (formatted as: ${chatId})`);

          // Add delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

          await this.client.sendMessage(chatId, welcomeMessage);
          logger.info(`✅ Welcome message sent successfully to admin: ${adminNumber}`);

        } catch (messageError) {
          logger.error(`❌ Failed to send welcome message to ${adminNumber}:`, messageError.message);
        }
      }

      // Only send to self if explicitly enabled and no admin numbers worked
      if (process.env.SEND_WELCOME_TO_SELF === 'true') {
        try {
          const info = this.client.info;
          if (info && info.wid) {
            await this.client.sendMessage(info.wid._serialized, welcomeMessage);
            logger.info('Welcome message sent to self (bot number)');
          }
        } catch (selfMessageError) {
          logger.error('Failed to send welcome message to self:', selfMessageError.message);
        }
      }

    } catch (error) {
      logger.error('Error in sendWelcomeMessage:', error.message);
    }
  }

  // Helper method to validate phone numbers
  isValidPhoneNumber(phoneNumber) {
    // Should start with + and contain only digits after that, or be in WhatsApp format
    const phoneRegex = /^\+\d{10,15}$|^\d{10,15}@c\.us$/;
    return phoneRegex.test(phoneNumber.trim());
  }

  // Helper method to format phone numbers for WhatsApp
  formatPhoneNumber(phoneNumber) {
    const trimmed = phoneNumber.trim();

    // If already in WhatsApp format, return as is
    if (trimmed.includes('@c.us')) {
      return trimmed;
    }

    // Remove + and any non-digits, then add @c.us
    const cleanNumber = trimmed.replace(/[^\d]/g, '');
    return `${cleanNumber}@c.us`;
  }

  getWelcomeMessage() {
    const botName = process.env.BOT_NAME || 'WhatsApp API Bot';
    return `🤖 ${botName} is now online and ready!

✅ Bot Status: Active
🕐 Started: ${new Date().toLocaleString()}

Available commands:
🌤️ /weather [location] - Get weather info
🔤 /translate [text] - Translate text
🔍 /search [query] - Search information
❓ /help - Show all commands

Send me any message to get started! 🚀`;
  }

  async getClient() {
    return this.client;
  }
}

module.exports = WhatsAppClient;