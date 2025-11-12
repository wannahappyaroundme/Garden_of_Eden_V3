/**
 * Centralized Logger Utility
 * Winston-based structured logging with file rotation
 */

import winston from 'winston';
import * as path from 'path';
import { app } from 'electron';

// Get user data directory for logs
const getLogPath = (): string => {
  try {
    return path.join(app.getPath('userData'), 'logs');
  } catch {
    // Fallback for tests or early initialization
    return path.join(process.cwd(), 'logs');
  }
};

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const logPath = getLogPath();

  return winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: 'garden-of-eden' },
    transports: [
      // Write all logs to console in development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
          })
        ),
      }),

      // Write all logs to combined.log
      new winston.transports.File({
        filename: path.join(logPath, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),

      // Write errors to error.log
      new winston.transports.File({
        filename: path.join(logPath, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
};

// Create logger instance
export const logger = createLogger();

/**
 * Log helper functions with context
 */
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta);
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta);
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta);
  },

  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, { error: String(error), ...meta });
    }
  },

  // Service-specific loggers
  ai: {
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, { service: 'ai', ...meta });
    },
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      if (error instanceof Error) {
        logger.error(message, { service: 'ai', error: error.message, stack: error.stack, ...meta });
      } else {
        logger.error(message, { service: 'ai', error: String(error), ...meta });
      }
    },
  },

  file: {
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, { service: 'file', ...meta });
    },
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      if (error instanceof Error) {
        logger.error(message, { service: 'file', error: error.message, stack: error.stack, ...meta });
      } else {
        logger.error(message, { service: 'file', error: String(error), ...meta });
      }
    },
  },

  git: {
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, { service: 'git', ...meta });
    },
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      if (error instanceof Error) {
        logger.error(message, { service: 'git', error: error.message, stack: error.stack, ...meta });
      } else {
        logger.error(message, { service: 'git', error: String(error), ...meta });
      }
    },
  },

  db: {
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, { service: 'database', ...meta });
    },
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      if (error instanceof Error) {
        logger.error(message, { service: 'database', error: error.message, stack: error.stack, ...meta });
      } else {
        logger.error(message, { service: 'database', error: String(error), ...meta });
      }
    },
  },
};

export default logger;
