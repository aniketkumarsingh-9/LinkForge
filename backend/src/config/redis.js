import { createClient } from 'redis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient = null;
let isRedisReady = false;

export const initRedis = async () => {
  if (redisClient && isRedisReady) {
    return redisClient;
  }

  const url = config.redis.password
    ? `redis://:${encodeURIComponent(config.redis.password)}@${config.redis.host}:${config.redis.port}`
    : `redis://${config.redis.host}:${config.redis.port}`;

  try {
    redisClient = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.warn('Max Redis reconnect attempts reached. Falling back to DB-only operation.');
            return false; // Stop reconnecting after 5 attempts
          }
          const delay = Math.min(retries * 500, 3000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})...`);
          return delay;
        },
        connectTimeout: 4000,
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      isRedisReady = true;
      logger.info('Redis client connected and ready');
    });

    redisClient.on('error', (err) => {
      isRedisReady = false;
      logger.warn('Redis error encountered (fallback to database enabled):', { message: err.message });
    });

    redisClient.on('end', () => {
      isRedisReady = false;
      logger.warn('Redis connection closed');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    isRedisReady = false;
    logger.warn('Could not establish initial connection to Redis. Application will operate in MongoDB-only mode.', {
      error: error.message
    });
    return null;
  }
};

export const getRedisClient = () => redisClient;
export const isRedisAvailable = () => Boolean(redisClient && isRedisReady);

export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore if already closed
    }
    isRedisReady = false;
    redisClient = null;
    logger.info('Redis connection gracefully closed');
  }
};
