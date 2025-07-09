// Simple logging utility for the application

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const getCurrentLevel = () => {
  const env = process.env.NODE_ENV;
  if (env === 'production') return LOG_LEVELS.WARN;
  if (env === 'test') return LOG_LEVELS.ERROR;
  return LOG_LEVELS.DEBUG; // development
};

const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  if (typeof message === 'object') {
    return `${prefix} ${JSON.stringify(message, null, 2)}`;
  }
  
  return `${prefix} ${message} ${args.length > 0 ? args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ') : ''}`;
};

const logger = {
  error: (message, ...args) => {
    if (getCurrentLevel() >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, ...args));
    }
  },
  
  warn: (message, ...args) => {
    if (getCurrentLevel() >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, ...args));
    }
  },
  
  info: (message, ...args) => {
    if (getCurrentLevel() >= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, ...args));
    }
  },
  
  debug: (message, ...args) => {
    if (getCurrentLevel() >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, ...args));
    }
  },
  
  // Database specific logging
  db: {
    query: (sql, params) => {
      if (getCurrentLevel() >= LOG_LEVELS.DEBUG) {
        console.log(formatMessage('DB-QUERY', sql, params ? { params } : ''));
      }
    },
    
    error: (error, sql) => {
      console.error(formatMessage('DB-ERROR', error.message, sql ? { sql } : ''));
    }
  },
  
  // Auth specific logging
  auth: {
    login: (userId, method) => {
      logger.info(`Login successful: ${userId} via ${method}`);
    },
    
    logout: (userId) => {
      logger.info(`Logout: ${userId}`);
    },
    
    unauthorized: (endpoint, reason) => {
      logger.warn(`Unauthorized access attempt: ${endpoint} - ${reason}`);
    }
  }
};

module.exports = logger;