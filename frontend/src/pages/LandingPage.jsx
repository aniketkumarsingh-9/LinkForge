import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Link2, Sparkles, Copy, Check, ArrowRight, Zap, ShieldCheck,
  BarChart3, Database, ChevronDown, ChevronUp, Calendar, QrCode
} from 'lucide-react';
import { createShortUrl } from '../api/urls.js';
import { validateUrl, validateAlias } from '../utils/validators.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { QrCodeModal } from '../components/QrCodeModal.jsx';

export const LandingPage = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);

  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const handleShorten = async (e) => {
    e.preventDefault();

    const urlCheck = validateUrl(originalUrl);
    if (!urlCheck.valid) {
      addToast(urlCheck.message, 'error');
      return;
    }

    if (customAlias) {
      const aliasCheck = validateAlias(customAlias);
      if (!aliasCheck.valid) {
        addToast(aliasCheck.message, 'error');
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await createShortUrl({
        originalUrl: urlCheck.value,
        customAlias: customAlias.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });

      if (res.success) {
        setResult(res.data.url);
        addToast('Link shortened successfully!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to shorten URL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const fullUrl = result.shortUrl || `${window.location.origin}/${result.shortCode}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      addToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>High-Performance URL Infrastructure</span>
          </div>

          <h1 className="hero-title">
            Forge Fast, Resilient Links with{' '}
            <span className="hero-gradient-text">Sub-Millisecond Speed</span>
          </h1>

          <p className="hero-subtitle">
            Transform lengthy, cumbersome URLs into clean, branded short links. Powered by a Redis cache-aside engine, MongoDB indexes, and privacy-first real-time analytics.
          </p>

          {/* Interactive URL Shortener Box */}
          <div className="glass-panel shortener-box">
            <form onSubmit={handleShorten}>
              <div className="shortener-form">
                <div className="shortener-input-wrap">
                  <Link2 size={18} />
                  <input
                    type="url"
                    className="shortener-input"
                    placeholder="Paste a long destination URL here (e.g. https://...)"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ minWidth: '140px' }}
                >
                  {loading ? 'Forging...' : 'Shorten Link'}
                </button>
              </div>

              {/* Accordion for advanced alias/expiration */}
              <button
                type="button"
                className="shortener-options-toggle"
                onClick={() => setShowOptions(!showOptions)}
              >
                <span>{showOptions ? 'Hide custom options' : 'Customize alias & expiration'}</span>
                {showOptions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showOptions && (
                <div className="shortener-extra-options">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Custom Alias</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. launch-2026"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Expiration (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Result Panel */}
            {result && (
              <div className="result-card">
                <div className="result-url-wrap">
                  <span className="result-label">Your Shortened URL</span>
                  <a
                    href={result.shortUrl || `${window.location.origin}/${result.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result-short-url"
                  >
                    {result.shortUrl || `${window.location.origin}/${result.shortCode}`}
                  </a>
                </div>

                <div className="result-actions">
                  <button
                    type="button"
                    onClick={() => setQrUrl(result)}
                    className="btn btn-secondary"
                    title="View QR Code"
                  >
                    <QrCode size={16} />
                    <span>QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn btn-primary"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '-1.5rem', marginBottom: '3rem' }}>
              <Link to="/register" className="btn btn-secondary">
                <span>Create free account to track clicks</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Feature Architecture Grid */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built for Production & Scale</h2>
            <p>Engineered according to modern system design principles and distributed best practices.</p>
          </div>

          <div className="features-grid">
            <div className="glass-panel feature-card glass-panel-hover">
              <div className="feature-icon">
                <Zap size={24} />
              </div>
              <h3 className="feature-title">Redis Cache-Aside Engine</h3>
              <p className="feature-desc">
                High-frequency URL resolutions are cached in in-memory Redis keys with configurable TTLs, delivering sub-millisecond redirect latency while protecting primary MongoDB storage.
              </p>
            </div>

            <div className="glass-panel feature-card glass-panel-hover">
              <div className="feature-icon">
                <ShieldCheck size={24} />
              </div>
              <h3 className="feature-title">Enterprise Security First</h3>
              <p className="feature-desc">
                Strict URL scheme validation (only HTTP/HTTPS), XSS and NoSQL injection sanitization, rate-limiting on endpoints, and bcrypt password hashing with 12 salt rounds.
              </p>
            </div>

            <div className="glass-panel feature-card glass-panel-hover">
              <div className="feature-icon">
                <BarChart3 size={24} />
              </div>
              <h3 className="feature-title">Granular Click Analytics</h3>
              <p className="feature-desc">
                Tracks referrers, device types, and daily click time-series without inflating the main URL document. Analytics are aggregated with MongoDB pipelines for O(1) reads.
              </p>
            </div>

            <div className="glass-panel feature-card glass-panel-hover">
              <div className="feature-icon">
                <Database size={24} />
              </div>
              <h3 className="feature-title">Collision-Resistant IDs</h3>
              <p className="feature-desc">
                Generates 62^7 (~3.5 trillion) URL-safe codes using cryptographically secure random bytes with an automatic collision retry strategy and reserved route protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Modal for Result */}
      {qrUrl && (
        <QrCodeModal
          isOpen={Boolean(qrUrl)}
          onClose={() => setQrUrl(null)}
          url={qrUrl}
        />
      )}
    </div>
  );
};
