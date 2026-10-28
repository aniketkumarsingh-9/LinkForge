import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDB = async (customUri) => {
  const uri = customUri || config.mongo.uri;
  
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: config.env !== 'production', // Build indexes in dev, manage separately in prod
    });

    isConnected = true;
    logger.info('Connected to MongoDB', { host: conn.connection.host, name: conn.connection.name });
    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    // In production we exit; in dev/test we rethrow
    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  }
};

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', err);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB connection lost');
});
