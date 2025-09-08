# WhatsApp Setup Guide

Since WhatsApp Web.js can be unreliable on some systems, here are two options to get your bot working:

## Option 1: WhatsApp Business API (Recommended)

This is the official, reliable method for production use.

### Steps:

1. **Create Facebook Business Account**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Create a business account

2. **Set up WhatsApp Business API**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app
   - Add "WhatsApp" product to your app

3. **Get Your Credentials**
   - Phone Number ID: Found in WhatsApp > API Setup
   - Access Token: Generate a permanent token
   - Webhook Verify Token: Create your own secure string

4. **Configure Webhook**
   - Webhook URL: `https://your-domain.com/webhook`
   - Verify Token: Use the same token from step 3
   - Subscribe to: `messages`

5. **Update Your .env File**
   ```env
   WHATSAPP_ACCESS_TOKEN=your_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WEBHOOK_VERIFY_TOKEN=your_verify_token_here
   ADMIN_NUMBERS=+1234567890,+0987654321
   ```

### Testing
Once configured, your bot will automatically use the Business API and send welcome messages to admin numbers.

## Option 2: Fix WhatsApp Web.js Issues

If you prefer to use the web client, try these fixes:

### Install Chrome/Chromium
```bash
# On macOS with Homebrew
brew install --cask google-chrome

# Or install Chromium
brew install --cask chromium
```

### Update Puppeteer
```bash
npm install puppeteer@latest
```

### Try Different Puppeteer Args
The app will automatically try different configurations.

## Current Status

Run your app with:
```bash
npm run dev
```

The app will:
1. Try Business API first (if configured)
2. Fall back to WhatsApp Web (with 30-second timeout)
3. Show clear error messages if both fail

## Troubleshooting

### Business API Issues
- Check your access token hasn't expired
- Verify phone number ID is correct
- Ensure webhook URL is accessible from internet

### Web Client Issues
- Check internet connection
- Try running with `headless: false` to see browser
- Clear session data: `rm -rf whatsapp-session`

### General Issues
- Check logs in `logs/` directory
- Verify .env file is properly configured
- Test with `/health` endpoint: `http://localhost:3000/health`