import { Url } from '../models/Url.js';
import { ClickEvent } from '../models/ClickEvent.js';
import { validateDestinationUrl } from '../middleware/validate.js';
import {
  generateUniqueCode,
  validateCustomAlias,
  RESERVED_WORDS
} from '../services/codeGenerator.js';
import { redisService } from '../services/redisService.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new short URL.
 * POST /api/urls
 */
export const createUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresAt, title } = req.body;

    // Validate original URL scheme and format
    const urlValidation = validateDestinationUrl(originalUrl);
    if (!urlValidation.valid) {
      return res.status(400).json({
        success: false,
        message: urlValidation.message
      });
    }

    let shortCode;
    let isCustom = false;

    // Handle custom alias if requested
    if (customAlias && customAlias.trim().length > 0) {
      const aliasValidation = validateCustomAlias(customAlias);
      if (!aliasValidation.valid) {
        return res.status(400).json({
          success: false,
          message: aliasValidation.message
        });
      }

      const existing = await Url.findOne({ shortCode: aliasValidation.alias });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `The custom alias "${aliasValidation.alias}" is already taken. Please choose another.`
        });
      }

      shortCode = aliasValidation.alias;
      isCustom = true;
    } else {
      // Generate a secure unique short code
      shortCode = await generateUniqueCode();
    }

    // Expiration date validation
    let parsedExpiresAt = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expiration date format'
        });
      }
      if (expDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Expiration date must be in the future'
        });
      }
      parsedExpiresAt = expDate;
    }

    // Assign owner if authenticated
    const ownerId = req.user ? req.user._id : null;

    const newUrl = await Url.create({
      originalUrl: urlValidation.url,
      shortCode,
      title: title?.trim() || '',
      owner: ownerId,
      expiresAt: parsedExpiresAt,
      isCustom,
      isActive: true,
    });

    // Populate Redis cache asynchronously
    await redisService.set(shortCode, newUrl);

    logger.info('Created new short URL', { shortCode, owner: ownerId });

    return res.status(201).json({
      success: true,
      message: 'Short URL created successfully',
      data: {
        url: newUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all URLs owned by current authenticated user.
 * Supports pagination, searching, sorting, and status filtering.
 * GET /api/urls
 */
export const getUserUrls = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search?.trim();
    const sortBy = req.query.sortBy === 'clickCount' ? 'clickCount' : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const filter = req.query.filter || 'all'; // all, active, expired

    const query = { owner: req.user._id };

    if (search) {
      // Escape special regex characters to prevent regex injection
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { shortCode: { $regex: escaped, $options: 'i' } },
        { originalUrl: { $regex: escaped, $options: 'i' } },
        { title: { $regex: escaped, $options: 'i' } }
      ];
    }

    const now = new Date();
    if (filter === 'active') {
      query.isActive = true;
      query.$or = [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ];
    } else if (filter === 'expired') {
      query.expiresAt = { $ne: null, $lte: now };
    }

    const total = await Url.countDocuments(query);
    const urls = await Url.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true });

    return res.status(200).json({
      success: true,
      data: {
        urls,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single URL details by ID with ownership verification.
 * GET /api/urls/:id
 */
export const getUrlById = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL record not found'
      });
    }

    // Ownership enforcement
    if (!url.owner || url.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this URL record'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update URL properties (title, custom alias, expiration, active state).
 * PATCH /api/urls/:id
 */
export const updateUrl = async (req, res, next) => {
  try {
    const { title, customAlias, expiresAt, isActive } = req.body;
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL record not found'
      });
    }

    // Ownership check
    if (!url.owner || url.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this URL record'
      });
    }

    const oldShortCode = url.shortCode;

    // Handle custom alias update
    if (customAlias && customAlias.trim() !== url.shortCode) {
      const aliasValidation = validateCustomAlias(customAlias);
      if (!aliasValidation.valid) {
        return res.status(400).json({
          success: false,
          message: aliasValidation.message
        });
      }

      // Check collision
      const existing = await Url.findOne({ shortCode: aliasValidation.alias });
      if (existing && existing._id.toString() !== url._id.toString()) {
        return res.status(409).json({
          success: false,
          message: `The alias "${aliasValidation.alias}" is already taken.`
        });
      }

      url.shortCode = aliasValidation.alias;
      url.isCustom = true;
    }

    if (title !== undefined) {
      url.title = title.trim();
    }

    if (isActive !== undefined) {
      url.isActive = Boolean(isActive);
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        url.expiresAt = null;
      } else {
        const expDate = new Date(expiresAt);
        if (isNaN(expDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid expiration date format'
          });
        }
        url.expiresAt = expDate;
      }
    }

    await url.save();

    // Cache management: Invalidate old cache and update new cache
    await redisService.del(oldShortCode);
    if (url.isActive && !url.isExpired()) {
      await redisService.set(url.shortCode, url);
    } else {
      await redisService.del(url.shortCode);
    }

    return res.status(200).json({
      success: true,
      message: 'URL updated successfully',
      data: {
        url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a URL and its analytics data.
 * DELETE /api/urls/:id
 */
export const deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL record not found'
      });
    }

    // Ownership check
    if (!url.owner || url.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this URL record'
      });
    }

    const shortCode = url.shortCode;
    const urlId = url._id;

    await Url.findByIdAndDelete(urlId);
    // Delete associated click events to prevent orphaned records
    await ClickEvent.deleteMany({ urlId });

    // Evict from Redis cache immediately
    await redisService.del(shortCode);

    logger.info('Deleted URL record', { urlId, shortCode });

    return res.status(200).json({
      success: true,
      message: 'URL deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
