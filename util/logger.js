import { createLogger, transports, format } from 'winston';
import path from 'path';

const logFormat = format.combine(
  format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
);

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(__dirname, 'logs/error.log'), level: 'error' }),
    new transports.File({ filename: path.join(__dirname, 'logs/combined.log') })
  ],
});

export default logger;
