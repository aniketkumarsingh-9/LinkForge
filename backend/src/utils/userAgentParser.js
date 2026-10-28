import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

const IP_SALT = process.env.IP_SALT || 'linkforge-privacy-salt-2026';

export const parseRequestMetadata = (req) => {
  const userAgentString = req.headers['user-agent'] || '';
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Determine device category
  let device = 'desktop';
  if (result.device.type === 'mobile') {
    device = 'mobile';
  } else if (result.device.type === 'tablet') {
    device = 'tablet';
  } else if (!userAgentString) {
    device = 'unknown';
  }

  // Determine browser
  const browser = result.browser.name || 'Unknown';

  // Determine OS
  const os = result.os.name || 'Unknown';

  // Referrer parsing
  let referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct / None';
  try {
    if (referrer && referrer !== 'Direct / None') {
      const url = new URL(referrer);
      referrer = url.hostname; // Normalize to hostname (e.g. twitter.com)
    }
  } catch {
    referrer = 'Direct / None';
  }

  // Country detection via trusted proxy headers (e.g. Cloudflare or AWS CloudFront)
  const country = req.headers['cf-ipcountry'] || 
                  req.headers['x-country-code'] || 
                  req.headers['cloudfront-viewer-country'] || 
                  'Unknown';

  // Anonymized IP hash (prevents storing raw PII, enables unique visit counting)
  const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                req.socket?.remoteAddress || 
                '127.0.0.1';
  const ipHash = crypto.createHmac('sha256', IP_SALT).update(rawIp).digest('hex');

  return {
    device,
    browser,
    os,
    referrer,
    country,
    ipHash,
  };
};
