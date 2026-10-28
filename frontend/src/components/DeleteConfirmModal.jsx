import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { deleteShortUrl } from '../api/urls.js';
import { useToast } from '../hooks/useToast.js';

export const DeleteConfirmModal = ({ isOpen, onClose, url, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen || !url) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteShortUrl(url._id || url.id);
      if (res.success) {
        addToast('Link deleted successfully', 'info');
        onSuccess?.(url._id || url.id);
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete URL', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-md)',
              background: 'var(--danger-bg)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={18} />
            </div>
            <h3>Delete Short Link?</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '0.925rem' }}>
            Are you sure you want to permanently delete the short link:
          </p>
          <div style={{
            background: 'var(--bg-input)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            fontFamily: 'monospace',
            color: 'var(--accent-cyan)'
          }}>
            /{url.shortCode}
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-subtle)' }}>
            This will immediately remove the URL, evict it from Redis cache, and delete all associated analytics records. This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger"
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};
