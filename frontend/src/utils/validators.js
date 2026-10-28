export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, message: 'URL is required' };
  }

  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      return { valid: false, message: 'URL scheme must be http:// or https://' };
    }
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return { valid: false, message: 'URL must contain a valid domain' };
    }
    return { valid: true, value: trimmed };
  } catch {
    return { valid: false, message: 'Please enter a valid URL (e.g. https://example.com)' };
  }
};

export const validateAlias = (alias) => {
  if (!alias) return { valid: true, value: '' };

  const trimmed = alias.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { valid: false, message: 'Alias must be 3-30 characters' };
  }

  const regex = /^[a-zA-Z0-9_-]+$/;
  if (!regex.test(trimmed)) {
    return { valid: false, message: 'Only letters, numbers, hyphens, and underscores allowed' };
  }

  return { valid: true, value: trimmed };
};

export const validateEmail = (email) => {
  if (!email) return { valid: false, message: 'Email address is required' };
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true, value: trimmed.toLowerCase() };
};

export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  return { valid: true, value: password };
};
