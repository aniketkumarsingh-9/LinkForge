import React, { useState } from 'react';
import {
  Copy, ExternalLink, QrCode, BarChart2, Edit2, Trash2,
  Calendar, Check, ArrowUpDown, Clock
} from 'lucide-react';
import { formatDate, formatNumber, truncateString } from '../utils/formatters.js';
import { useToast } from '../hooks/useToast.js';

export const UrlTable = ({
  urls,
  loading,
  onOpenEdit,
  onOpenDelete,
  onOpenQr,
  onOpenAnalytics,
  sortBy,
  order,
  onToggleSort,
}) => {
  const [copiedId, setCopiedId] = useState(null);
  const { addToast } = useToast();

  const handleCopy = async (url) => {
    const fullUrl = url.shortUrl || `${window.location.origin}/${url.shortCode}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(url._id || url.id);
      addToast('Copied short URL to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast('Could not copy to clipboard', 'error');
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading URL records...</p>
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: '#38bdf8'
        }}>
          <Calendar size={26} />
        </div>
        <h3 style={{ marginBottom: '0.5rem' }}>No URLs Found</h3>
        <p style={{ maxWidth: 400, margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
          You have not created any links yet or your search filter did not match any existing URLs.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Link Details</th>
            <th>Short Code</th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onToggleSort?.('clickCount')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Clicks</span>
                <ArrowUpDown size={14} color={sortBy === 'clickCount' ? '#38bdf8' : '#64748b'} />
              </div>
            </th>
            <th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onToggleSort?.('createdAt')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Created</span>
                <ArrowUpDown size={14} color={sortBy === 'createdAt' ? '#38bdf8' : '#64748b'} />
              </div>
            </th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => {
            const id = url._id || url.id;
            const fullShortUrl = url.shortUrl || `${window.location.origin}/${url.shortCode}`;
            const isExpired = url.expiresAt && new Date(url.expiresAt) <= new Date();

            return (
              <tr key={id}>
                {/* Original URL & Title */}
                <td>
                  <div>
                    {url.title && (
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                        {url.title}
                      </div>
                    )}
                    <a
                      href={url.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-original-url"
                      title={url.originalUrl}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>{truncateString(url.originalUrl, 42)}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </td>

                {/* Short Code */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="table-short-url">/{url.shortCode}</span>
                    {url.isCustom && <span className="badge badge-custom">custom</span>}
                  </div>
                </td>

                {/* Clicks */}
                <td>
                  <span style={{ fontWeight: 700, color: '#fff' }}>
                    {formatNumber(url.clickCount)}
                  </span>
                </td>

                {/* Created Date */}
                <td>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {formatDate(url.createdAt)}
                  </span>
                </td>

                {/* Status */}
                <td>
                  {isExpired ? (
                    <span className="badge badge-expired">Expired</span>
                  ) : !url.isActive ? (
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>Disabled</span>
                  ) : (
                    <span className="badge badge-active">Active</span>
                  )}
                </td>

                {/* Actions */}
                <td>
                  <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleCopy(url)}
                      className="btn-icon"
                      title="Copy Short Link"
                    >
                      {copiedId === id ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    </button>

                    <button
                      onClick={() => onOpenQr?.(url)}
                      className="btn-icon"
                      title="Generate QR Code"
                    >
                      <QrCode size={16} />
                    </button>

                    <button
                      onClick={() => onOpenAnalytics?.(id)}
                      className="btn-icon"
                      title="View Click Analytics"
                    >
                      <BarChart2 size={16} color="#38bdf8" />
                    </button>

                    <button
                      onClick={() => onOpenEdit?.(url)}
                      className="btn-icon"
                      title="Edit Link Details"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => onOpenDelete?.(url)}
                      className="btn-icon"
                      title="Delete Link"
                    >
                      <Trash2 size={16} color="#f87171" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
