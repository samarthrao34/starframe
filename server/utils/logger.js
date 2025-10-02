const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            logMessage += ` ${JSON.stringify(meta)}`;
        }
        return logMessage;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'starframe-admin' },
    transports: [
        // Write to all logs with level `info` and below
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),

        // Write all logs error and below to `error.log`
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),

        // Security logs
        new winston.transports.File({
            filename: path.join(logsDir, 'security.log'),
            level: 'warn',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
            tailable: true
        })
    ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Security-specific logging methods
logger.security = (message, meta = {}) => {
    logger.warn(`[SECURITY] ${message}`, { 
        ...meta, 
        type: 'security',
        timestamp: new Date().toISOString() 
    });
};

logger.audit = (message, meta = {}) => {
    logger.info(`[AUDIT] ${message}`, { 
        ...meta, 
        type: 'audit',
        timestamp: new Date().toISOString() 
    });
};

logger.performance = (message, meta = {}) => {
    logger.info(`[PERFORMANCE] ${message}`, { 
        ...meta, 
        type: 'performance',
        timestamp: new Date().toISOString() 
    });
};

// Handle uncaught exceptions
logger.exceptions.handle(
    new winston.transports.File({ 
        filename: path.join(logsDir, 'exceptions.log'),
        maxsize: 5242880,
        maxFiles: 5
    })
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = logger;
