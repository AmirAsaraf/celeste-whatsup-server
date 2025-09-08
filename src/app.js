require('dotenv').config();
const express = require('express');
const WhatsAppClient = require('./whatsapp/client');
const apiHandlers = require('./api/handlers');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize WhatsApp client
const whatsappClient = new WhatsAppClient();

// Handle incoming messages from WhatsApp Web
whatsappClient.client.on('message', async (message) => {
  try {
    const from = message.from;
    const messageText = message.body;

    if (!messageText) return;

    // Check if this message should be handled by the bot
    if (!shouldHandleMessage(message)) {
      return; // Ignore messages from non-bot chats
    }

    logger.info(`Received bot message from ${from}: ${messageText}`);

    // Process message and get API response
    const response = await apiHandlers.processMessage(messageText);

    // Send response back via WhatsApp
    await message.reply(response);

  } catch (error) {
    logger.error('Error handling message:', error);
  }
});

// Function to determine if the bot should respond to this message
function shouldHandleMessage(message) {
  const from = message.from;
  const messageText = message.body;
  const responseMode = process.env.BOT_RESPONSE_MODE || 'admin_only';
  
  // Don't respond to messages from yourself (avoid loops)
  if (message.fromMe) {
    return false;
  }
  
  // Don't respond to group messages
  if (from.endsWith('@g.us')) {
    logger.debug(`Ignoring group message from: ${from}`);
    return false;
  }
  
  switch (responseMode) {
    case 'admin_only':
      // Only respond to messages from admin numbers
      const adminNumbers = process.env.ADMIN_NUMBERS?.split(',').map(num => num.trim()) || [];
      const fromNumber = from.replace('@c.us', '');
      
      for (const adminNumber of adminNumbers) {
        const cleanAdminNumber = adminNumber.replace(/[^\d]/g, '');
        if (fromNumber.includes(cleanAdminNumber)) {
          logger.info(`Message from admin number: ${from}`);
          return true;
        }
      }
      logger.debug(`Ignoring message from non-admin: ${from}`);
      return false;
      
    case 'command_only':
      // Only respond to messages that start with bot commands
      const botCommands = ['/weather', '/translate', '/search', '/help'];
      if (botCommands.some(cmd => messageText.toLowerCase().startsWith(cmd))) {
        logger.info(`Bot command detected from: ${from}`);
        return true;
      }
      logger.debug(`Ignoring non-command message from: ${from}`);
      return false;
      
    case 'direct_messages_only':
      // Respond to all direct messages (not groups)
      if (from.endsWith('@c.us')) {
        logger.info(`Direct message from: ${from}`);
        return true;
      }
      return false;
      
    case 'all':
      // Respond to all messages (original behavior)
      logger.info(`Message from: ${from}`);
      return true;
      
    default:
      // Default to admin_only for security
      logger.warn(`Unknown BOT_RESPONSE_MODE: ${responseMode}, defaulting to admin_only`);
      return shouldHandleMessage(message); // Recursive call with admin_only logic
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Initializing WhatsApp Web client...');
  
  try {
    await whatsappClient.initialize();
    logger.info('WhatsApp Web client initialized successfully!');
  } catch (error) {
    logger.error('Failed to initialize WhatsApp Web client:', error);
  }
});

module.exports = app; 