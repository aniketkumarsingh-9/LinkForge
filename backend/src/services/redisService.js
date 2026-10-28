import { getRedisClient, isRedisAvailable } from '../config/redis.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const KEY_PREFIX = 'url:shortcode:';

export const redisService = {
  formatKey: (shortCode) => `${KEY_PREFIX}${shortCode}`,

  /**
   * Retrieve cached URL record by short code.
   * Returns null if cache miss, expired, or Redis unavailable.
   */
  async get(shortCode) {
    if (!isRedisAvailable()) return null;

    try {
      const client = getRedisClient();
      const key = this.formatKey(shortCode);
      const data = await client.get(key);
      
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Verify expiration in case Redis TTL didn't evict yet
      if (parsed.expiresAt && new Date(parsed.expiresAt) <= new Date()) {
        await this.del(shortCode);
        return null;
      }

      return parsed;
    } catch (error) {
      logger.warn('Redis GET failure, falling back to database', { shortCode, error: error.message });
      return null;
    }
  },

  /**
   * Cache URL record with TTL.
   */
  async set(shortCode, urlData, customTtlSeconds = null) {
    if (!isRedisAvailable() || !urlData) return false;

    try {
      const client = getRedisClient();
      const key = this.formatKey(shortCode);

      // Calculate effective TTL: if link expires sooner than default TTL, adjust TTL
      let ttl = customTtlSeconds || config.redis.ttl;
      if (urlData.expiresAt) {
        const remainingMs = new Date(urlData.expiresAt).getTime() - Date.now();
        const remainingSeconds = Math.floor(remainingMs / 1000);
        if (remainingSeconds <= 0) {
          // Already expired, do not cache
          return false;
        }
        ttl = Math.min(ttl, remainingSeconds);
      }

      const payload = JSON.stringify({
        id: urlData._id?.toString() || urlData.id,
        originalUrl: urlData.originalUrl,
        shortCode: urlData.shortCode,
        owner: urlData.owner?.toString() || urlData.owner || null,
        expiresAt: urlData.expiresAt || null,
        isActive: urlData.isActive ?? true,
      });

      await client.set(key, payload, { EX: ttl });
      return true;
    } catch (error) {
      logger.warn('Redis SET failure (continuing without cache)', { shortCode, error: error.message });
      return false;
    }
  },

  /**
   * Invalidate cached short code.
   */
  async del(shortCode) {
    if (!isRedisAvailable() || !shortCode) return false;

    try {
      const client = getRedisClient();
      const key = this.formatKey(shortCode);
      await client.del(key);
      return true;
    } catch (error) {
      logger.warn('Redis DEL failure during invalidation', { shortCode, error: error.message });
      return false;
    }
  }
};
