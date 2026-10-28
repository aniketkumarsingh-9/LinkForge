import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initRedis, closeRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    logger.info('Initializing LinkForge Backend Service...');

    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Redis (non-blocking fallback enabled)
    await initRedis();

    // 3. Start listening
    server = app.listen(config.port, () => {
      logger.info(`LinkForge API server running on port ${config.port}`, {
        baseUrl: config.baseUrl,
        env: config.env,
      });
    });

  } catch (error) {
    logger.error('Fatal initialization error during server bootstrap', error);
    if (error.name === 'MongooseServerSelectionError' || error.message?.includes('ECONNREFUSED')) {
      logger.warn(`Could not connect to MongoDB at ${config.mongo.uri}. To start all services with MongoDB and Redis, run: "docker compose up -d" or start your local MongoDB daemon.`);
    }
    process.exit(1);
  }
};

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await closeRedis();
        await disconnectDB();
        logger.info('Graceful shutdown completed successfully.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during database/cache disconnection', err);
        process.exit(1);
      }
    });

    // Force close after 10 seconds if hanging
    setTimeout(() => {
      logger.error('Could not close connections in time, forcing exit.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  process.exit(1);
});

startServer();
