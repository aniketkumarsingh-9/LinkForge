import crypto from 'crypto';
import { Url } from '../models/Url.js';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_CODE_LENGTH = 7;
const MAX_COLLISION_RETRIES = 5;

// System reserved keywords that cannot be used as short codes or custom aliases
export const RESERVED_WORDS = new Set([
  'api',
  'auth',
  'admin',
  'dashboard',
  'login',
  'register',
  'urls',
  'analytics',
  'health',
  'metrics',
  'static',
  'assets',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  '404',
  '500',
  'terms',
  'privacy',
  'about',
  'pricing',
  'help',
  'support'
]);

/**
 * Generate a cryptographically secure random short code using base62.
 */
export const generateSecureCode = (length = DEFAULT_CODE_LENGTH) => {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
};

/**
 * Validates whether a custom alias complies with length, character, and reservation rules.
 */
export const validateCustomAlias = (alias) => {
  if (!alias || typeof alias !== 'string') {
    return { valid: false, message: 'Alias must be a non-empty string' };
  }

  const trimmed = alias.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { valid: false, message: 'Alias must be between 3 and 30 characters long' };
  }

  const validRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validRegex.test(trimmed)) {
    return { valid: false, message: 'Alias can only contain letters, numbers, hyphens, and underscores' };
  }

  if (RESERVED_WORDS.has(trimmed.toLowerCase())) {
    return { valid: false, message: `The alias "${trimmed}" is a reserved system keyword and cannot be used` };
  }

  return { valid: true, alias: trimmed };
};

/**
 * Generate a unique short code, automatically resolving any collisions.
 */
export const generateUniqueCode = async (length = DEFAULT_CODE_LENGTH) => {
  for (let attempt = 1; attempt <= MAX_COLLISION_RETRIES; attempt++) {
    const code = generateSecureCode(length);

    if (RESERVED_WORDS.has(code.toLowerCase())) {
      continue;
    }

    const query = Url.findOne({ shortCode: code });
    const existing = query && typeof query.select === 'function' 
      ? await query.select('_id').lean() 
      : await query;
    if (!existing) {
      return code;
    }
  }

  // If collision occurs repeatedly, increase code length
  return generateSecureCode(length + 1);
};
