import validator from 'validator';

/**
 * Validates a destination URL strictly to prevent XSS / malicious scheme attacks.
 * Only HTTP and HTTPS schemes are permitted.
 */
export const validateDestinationUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, message: 'Destination URL is required and must be a string' };
  }

  const trimmed = url.trim();

  // Basic length check (URLs longer than 2048 chars are problematic for many browsers)
  if (trimmed.length > 2048) {
    return { valid: false, message: 'URL cannot exceed 2048 characters' };
  }

  // Parse protocol
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'http:' && protocol !== 'https:') {
      return {
        valid: false,
        message: `Disallowed URL protocol '${protocol}'. Only 'http:' and 'https:' are supported.`
      };
    }

    if (!parsed.hostname || parsed.hostname.length === 0) {
      return { valid: false, message: 'URL must contain a valid domain hostname' };
    }

    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, message: 'The provided URL is not a valid, well-formed URL' };
  }
};

/**
 * Middleware to sanitize inputs and prevent NoSQL injection via MongoDB operator objects.
 */
export const sanitizeInputs = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key of Object.keys(obj)) {
      // Disallow MongoDB operators like $gt, $ne, $where
      if (key.startsWith('$')) {
        delete obj[key];
        continue;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};
