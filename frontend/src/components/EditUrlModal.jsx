import React, { useState, useEffect } from 'react';
import { X, Edit2, AlertCircle, Sparkles, Tag, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { updateShortUrl } from '../api/urls.js';
import { validateAlias } from '../utils/validators.js';
import { useToast } from '../hooks/useToast.js';

export const EditUrlModal = ({ isOpen, onClose, url, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addToast } = useToast();

  useEffect(() => {
    if (url) {
      setTitle(url.title || '');
      setCustomAlias(url.shortCode || '');
      setIsActive(url.isActive ?? true);
      if (url.expiresAt) {
        // Format ISO date for datetime-local input (YYYY-MM-DDTHH:mm)
        const d = new Date(url.expiresAt);
        const pad = (n) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setExpiresAt(formatted);
      } else {
        setExpiresAt('');
      }
      setError('');
    }
  }, [url]);

  if (!isOpen || !url) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (customAlias && customAlias !== url.shortCode) {
      const aliasCheck = validateAlias(customAlias);
      if (!aliasCheck.valid) {
        setError(aliasCheck.message);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await updateShortUrl(url._id || url.id, {
        title: title.trim(),
        customAlias: customAlias.trim(),
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      if (res.success) {
        addToast('Link updated successfully', 'success');
        onSuccess?.(res.data.url);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update URL');
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
              <Edit2 size={16} />
            </div>
            <h3>Edit Short Link</h3>
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
              <label className="form-label">Destination URL (Read-only)</label>
              <input
                type="text"
                className="form-input"
                value={url.originalUrl}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} color="#38bdf8" /> Short Code / Alias
              </label>
              <input
                type="text"
                className="form-input"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={14} /> Title
              </label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> Expiration Date
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              {expiresAt && (
                <button
                  type="button"
                  onClick={() => setExpiresAt('')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', marginTop: '0.25rem' }}
                >
                  Clear expiration date (make perpetual)
                </button>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="form-label">Active Redirection</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#10b981' : '#64748b' }}
                >
                  {isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
              <small style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                {isActive ? 'Link is active and redirecting visitors.' : 'Link is disabled and will return 404.'}
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
