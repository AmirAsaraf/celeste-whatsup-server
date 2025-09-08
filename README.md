# WhatsApp API Bot

A WhatsApp bot that integrates with external APIs to provide automated responses and services.

## Features

- 📱 WhatsApp integration (supports both personal and business accounts)
- 🔌 External API integration
- 🤖 Automated message processing
- 📝 Command-based interactions
- 🔍 Search functionality
- 🌤️ Weather information
- 🔤 Text translation
- 📊 Logging and monitoring

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./whatsapp-session
BOT_NAME=WhatsApp API Bot
SEND_WELCOME_TO_SELF=false
ADMIN_NUMBERS=+1234567890,+0987654321

# External API Configuration
EXTERNAL_API_URL=https://your-api.com
EXTERNAL_API_KEY=your_api_key

# Server Configuration
PORT=3000
NODE_ENV=development

# WhatsApp Business API (optional)
WEBHOOK_VERIFY_TOKEN=your_webhook_token
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

### 3. Choose Your WhatsApp Integration Method

#### Option A: Personal WhatsApp (whatsapp-web.js)
- Uses your personal WhatsApp account
- Requires QR code scanning
- Free but has limitations

#### Option B: WhatsApp Business API
- Official business solution
- Requires Facebook Business account
- More reliable for production

## Usage

### Start the Bot

```bash
# Development
npm run dev

# Production
npm start
```

### Available Commands

Send these commands via WhatsApp:

- `/weather [location]` - Get weather information
- `/translate [text]` - Translate text to English
- `/search [query]` - Search for information
- `/help` - Show available commands

### API Integration

The bot can integrate with any REST API. Modify `src/api/handlers.js` to add your specific API endpoints:

```javascript
async customAPICall(params) {
  const response = await axios.get(`${this.baseURL}/your-endpoint`, {
    params: params,
    headers: { 'Authorization': `Bearer ${this.apiKey}` }
  });
  return response.data;
}
```

## Configuration Options

### WhatsApp Business API Setup

1. Create a Facebook Business account
2. Set up WhatsApp Business API
3. Configure webhook URL: `https://your-domain.com/webhook`
4. Add verify token and access token to `.env`

### Personal WhatsApp Setup

1. Run the application
2. Scan the QR code with your phone
3. The session will be saved for future use

## File Structure

```
src/
├── app.js              # Main application entry point
├── whatsapp/
│   └── client.js       # WhatsApp client management
├── api/
│   └── handlers.js     # API integration handlers
└── utils/
    └── logger.js       # Logging utility
```

## Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start src/app.js --name whatsapp-bot
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **QR Code not appearing**: Check console output and ensure puppeteer dependencies are installed
2. **API calls failing**: Verify your API keys and endpoints in `.env`
3. **Messages not sending**: Check WhatsApp client connection status

### Logs

Check the `logs/` directory for detailed application logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.