import mongoose from 'mongoose';
import { Url } from '../models/Url.js';
import { ClickEvent } from '../models/ClickEvent.js';

/**
 * Get detailed analytics for a single URL owned by current user.
 * GET /api/urls/:id/analytics
 */
export const getUrlAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));

    const url = await Url.findById(id);
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
        message: 'You do not have permission to view analytics for this URL'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const matchQuery = {
      urlId: new mongoose.Types.ObjectId(id),
      timestamp: { $gte: startDate }
    };

    // Parallel aggregations for speed
    const [dailyClicks, devices, browsers, referrers, recentClicks] = await Promise.all([
      // 1. Daily clicks over time
      ClickEvent.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            clicks: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 2. Device breakdown
      ClickEvent.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$device',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // 3. Browser breakdown
      ClickEvent.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$browser',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // 4. Referrer breakdown
      ClickEvent.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$referrer',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // 5. Recent 20 click events
      ClickEvent.find({ urlId: id })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('timestamp referrer device browser os country')
        .lean()
    ]);

    // Format daily clicks to include all days even with 0 clicks
    const dailyMap = new Map(dailyClicks.map(d => [d._id, d.clicks]));
    const formattedTimeline = [];
    const curr = new Date(startDate);
    const today = new Date();

    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];
      formattedTimeline.push({
        date: dateStr,
        clicks: dailyMap.get(dateStr) || 0
      });
      curr.setDate(curr.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      data: {
        url: {
          id: url._id,
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          title: url.title,
          totalClicks: url.clickCount,
          createdAt: url.createdAt,
          expiresAt: url.expiresAt,
          isActive: url.isActive,
        },
        timeRangeDays: days,
        timeline: formattedTimeline,
        devices: devices.map(d => ({ name: d._id || 'unknown', value: d.count })),
        browsers: browsers.map(b => ({ name: b._id || 'Unknown', value: b.count })),
        referrers: referrers.map(r => ({ name: r._id || 'Direct', value: r.count })),
        recentClicks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get account-wide overview analytics for dashboard summary cards.
 * GET /api/analytics/overview
 */
export const getOverviewAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. URLs summary counts
    const urls = await Url.find({ owner: userId }).select('clickCount expiresAt isActive createdAt title shortCode originalUrl').lean();

    const totalUrls = urls.length;
    let totalClicks = 0;
    let activeUrls = 0;
    let expiredUrls = 0;

    urls.forEach((u) => {
      totalClicks += (u.clickCount || 0);
      const isExpired = u.expiresAt && new Date(u.expiresAt) <= now;
      if (isExpired || !u.isActive) {
        expiredUrls += 1;
      } else {
        activeUrls += 1;
      }
    });

    // 2. Top 5 performing URLs
    const topUrls = [...urls]
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 5);

    // 3. Account-wide click trend (last 14 days)
    const urlIds = urls.map(u => u._id);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);

    let timeline = [];
    if (urlIds.length > 0) {
      const clickTrends = await ClickEvent.aggregate([
        {
          $match: {
            urlId: { $in: urlIds },
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            clicks: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const map = new Map(clickTrends.map(c => [c._id, c.clicks]));
      const curr = new Date(startDate);
      while (curr <= now) {
        const dateStr = curr.toISOString().split('T')[0];
        timeline.push({
          date: dateStr,
          clicks: map.get(dateStr) || 0
        });
        curr.setDate(curr.getDate() + 1);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUrls,
          totalClicks,
          activeUrls,
          expiredUrls,
        },
        topUrls,
        timeline,
      }
    });
  } catch (error) {
    next(error);
  }
};
