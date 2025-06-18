const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const LOG_COLORS = {
  DEBUG: '#808080',
  INFO: '#0066cc',
  WARN: '#ff9900',
  ERROR: '#cc0000'
};

class Logger {
  constructor(context) {
    this.context = context;
    this.level = LOG_LEVELS.DEBUG;
  }

  setLevel(level) {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.DEBUG;
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.context}] [${level}]`;
    
    if (data) {
      console.groupCollapsed(
        `%c${prefix} ${message}`,
        `color: ${LOG_COLORS[level]}`
      );
      console.log('Données:', data);
      console.groupEnd();
    } else {
      console.log(
        `%c${prefix} ${message}`,
        `color: ${LOG_COLORS[level]}`
      );
    }
  }

  debug(message, data) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      this.formatMessage('DEBUG', message, data);
    }
  }

  info(message, data) {
    if (this.level <= LOG_LEVELS.INFO) {
      this.formatMessage('INFO', message, data);
    }
  }

  warn(message, data) {
    if (this.level <= LOG_LEVELS.WARN) {
      this.formatMessage('WARN', message, data);
    }
  }

  error(message, error) {
    if (this.level <= LOG_LEVELS.ERROR) {
      this.formatMessage('ERROR', message, error);
      if (error?.stack) {
        console.error(error.stack);
      }
    }
  }
}

export { Logger }