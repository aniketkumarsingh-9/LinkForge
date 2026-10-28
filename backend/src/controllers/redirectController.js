import { Url } from '../models/Url.js';
import { ClickEvent } from '../models/ClickEvent.js';
import { redisService } from '../services/redisService.js';
import { parseRequestMetadata } from '../utils/userAgentParser.js';
import { logger } from '../utils/logger.js';

/**
 * HTML template for friendly error responses during direct browser navigation
 */
const renderErrorHtml = (title, message, statusCode = 404) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - LinkForge</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    h1 { font-size: 1.75rem; margin-bottom: 0.75rem; color: #fff; }
    p { color: #94a3b8; line-height: 1.5; margin-bottom: 1.75rem; }
    .btn {
      display: inline-block;
      background: #3b82f6;
      color: #fff;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">HTTP ${statusCode}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/" class="btn">Create Your Own Short Link</a>
  </div>
</body>
</html>
`;

/**
 * Handle URL redirection with Redis cache-aside and asynchronous analytics recording.
 * GET /:code
 */
export const handleRedirect = async (req, res, next) => {
  const { code } = req.params;

  if (!code || code === 'favicon.ico') {
    return res.status(404).end();
  }

  try {
    let urlRecord = null;
    let fromCache = false;

    // 1. Check Redis Cache
    const cached = await redisService.get(code);
    if (cached) {
      urlRecord = cached;
      fromCache = true;
    } else {
      // 2. Cache miss -> Query MongoDB
      const dbUrl = await Url.findOne({ shortCode: code });
      if (dbUrl) {
        urlRecord = {
          id: dbUrl._id.toString(),
          originalUrl: dbUrl.originalUrl,
          shortCode: dbUrl.shortCode,
          owner: dbUrl.owner ? dbUrl.owner.toString() : null,
          expiresAt: dbUrl.expiresAt,
          isActive: dbUrl.isActive,
        };

        // Cache for subsequent requests if active and unexpired
        if (urlRecord.isActive && (!urlRecord.expiresAt || new Date(urlRecord.expiresAt) > new Date())) {
          await redisService.set(code, urlRecord);
        }
      }
    }

    // 3. Check existence and active state
    if (!urlRecord || !urlRecord.isActive) {
      if (req.accepts('html')) {
        return res.status(404).send(renderErrorHtml(
          'Link Not Found',
          'The short link you followed does not exist, has been disabled, or was deleted.',
          404
        ));
      }
      return res.status(404).json({
        success: false,
        message: 'The requested short URL was not found or has been disabled.'
      });
    }

    // 4. Check expiration
    if (urlRecord.expiresAt && new Date(urlRecord.expiresAt) <= new Date()) {
      // Evict from cache if still lingering
      await redisService.del(code);

      if (req.accepts('html')) {
        return res.status(410).send(renderErrorHtml(
          'Link Expired',
          'This short link has reached its configured expiration date and is no longer accessible.',
          410
        ));
      }
      return res.status(410).json({
        success: false,
        message: 'This short URL has expired.'
      });
    }

    // 5. Asynchronously record click event without delaying redirect
    // Parse metadata before redirect
    const metadata = parseRequestMetadata(req);
    const destinationUrl = urlRecord.originalUrl;
    const urlId = urlRecord.id;

    // Perform HTTP 302 Found redirect
    // We choose 302 Found over 301 Moved Permanently so browsers do not cache the redirect locally,
    // ensuring subsequent clicks hit the server for accurate real-time analytics.
    res.redirect(302, destinationUrl);

    // Background asynchronous analytics update
    setImmediate(async () => {
      try {
        await Promise.all([
          ClickEvent.create({
            urlId,
            referrer: metadata.referrer,
            device: metadata.device,
            browser: metadata.browser,
            os: metadata.os,
            country: metadata.country,
            ipHash: metadata.ipHash,
            timestamp: new Date(),
          }),
          Url.findByIdAndUpdate(urlId, {
            $inc: { clickCount: 1 },
            $set: { lastClickedAt: new Date() },
          })
        ]);
        logger.debug('Click recorded', { code, fromCache, device: metadata.device });
      } catch (analyticsError) {
        logger.error('Failed to record click analytics event', analyticsError);
      }
    });

  } catch (error) {
    next(error);
  }
};
