import express from 'express';
import { getOverviewAnalytics } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', requireAuth, getOverviewAnalytics);

export default router;
