const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${logMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return logMessage;
  }

  writeToFile(level, message) {
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, message + '\n');
  }

  info(message, data = null) {
    const formattedMessage = this.formatMessage('info', message, data);
    console.log(formattedMessage);
    this.writeToFile('info', formattedMessage);
  }

  error(message, data = null) {
    const formattedMessage = this.formatMessage('error', message, data);
    console.error(formattedMessage);
    this.writeToFile('error', formattedMessage);
  }

  warn(message, data = null) {
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(formattedMessage);
    this.writeToFile('warn', formattedMessage);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('debug', message, data);
      console.log(formattedMessage);
      this.writeToFile('debug', formattedMessage);
    }
  }
}

module.exports = new Logger();