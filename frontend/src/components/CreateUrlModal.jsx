import React, { useState } from 'react';
import { X, Link2, Sparkles, Calendar, Tag, AlertCircle } from 'lucide-react';
import { createShortUrl } from '../api/urls.js';
import { validateUrl, validateAlias } from '../utils/validators.js';
import { useToast } from '../hooks/useToast.js';

export const CreateUrlModal = ({ isOpen, onClose, onSuccess }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const urlCheck = validateUrl(originalUrl);
    if (!urlCheck.valid) {
      setError(urlCheck.message);
      return;
    }

    if (customAlias) {
      const aliasCheck = validateAlias(customAlias);
      if (!aliasCheck.valid) {
        setError(aliasCheck.message);
        return;
      }
    }

    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (expDate <= new Date()) {
        setError('Expiration date must be set in the future');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await createShortUrl({
        originalUrl: urlCheck.value,
        customAlias: customAlias.trim() || undefined,
        title: title.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });

      if (res.success) {
        addToast('Short link created successfully!', 'success');
        setOriginalUrl('');
        setCustomAlias('');
        setTitle('');
        setExpiresAt('');
        onSuccess?.(res.data.url);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create short link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="nav-brand-icon" style={{ width: 28, height: 28 }}>
              <Link2 size={16} />
            </div>
            <h3>Create New Short Link</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: '#f87171',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Destination URL *</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/very-long-path-to-shorten"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} color="#38bdf8" /> Custom Alias (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.875rem' }}>/</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. spring-sale-2026"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>
              <small style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                Letters, numbers, dashes, and underscores (3-30 chars).
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={14} /> Title or Tag (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Twitter Campaign Banner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <small style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                Link will automatically return 410 Expired after this time.
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Short Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
