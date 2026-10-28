import express from 'express';
import {
  createUrl,
  getUserUrls,
  getUrlById,
  updateUrl,
  deleteUrl
} from '../controllers/urlController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { urlCreateLimiter } from '../middleware/rateLimiter.js';
import { getUrlAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Allow optional auth for creation so visitors can generate short URLs on landing page,
// while authenticated users get them assigned to their dashboard!
router.post('/', optionalAuth, urlCreateLimiter, createUrl);

// Protected URL management
router.get('/', requireAuth, getUserUrls);
router.get('/:id', requireAuth, getUrlById);
router.patch('/:id', requireAuth, updateUrl);
router.delete('/:id', requireAuth, deleteUrl);

// URL analytics sub-route
router.get('/:id/analytics', requireAuth, getUrlAnalytics);

export default router;
