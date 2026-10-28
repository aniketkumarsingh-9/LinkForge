import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Copy, ExternalLink, QrCode, Edit2, Trash2,
  Calendar, Check, Globe, Monitor, Clock, ShieldAlert, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { fetchUrlAnalytics } from '../api/analytics.js';
import { formatDate, formatDateTime, formatNumber } from '../utils/formatters.js';
import { useToast } from '../hooks/useToast.js';
import { QrCodeModal } from '../components/QrCodeModal.jsx';
import { EditUrlModal } from '../components/EditUrlModal.jsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.jsx';

export const UrlDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Modals
  const [qrOpen, setQrOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchUrlAnalytics(id, days);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load URL analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [id, days]);

  const url = data?.url;
  const fullShortUrl = url ? `${window.location.origin}/${url.shortCode}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShortUrl);
      setCopied(true);
      addToast('Copied short URL to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy to clipboard', 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading URL analytics...</p>
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>URL Not Found</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>{error || 'This URL record does not exist or you do not have permission to view it.'}</p>
        <Link to="/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
      {/* Top Breadcrumb & Actions */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 0.9rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setQrOpen(true)} className="btn btn-secondary">
            <QrCode size={16} />
            <span>QR Code</span>
          </button>
          <button onClick={() => setEditOpen(true)} className="btn btn-secondary">
            <Edit2 size={16} />
            <span>Edit</span>
          </button>
          <button onClick={() => setDeleteOpen(true)} className="btn btn-danger">
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Details Header Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', color: '#fff', margin: 0 }}>
                {url.title || `/${url.shortCode}`}
              </h1>
              <span className={`badge ${url.isActive ? 'badge-active' : 'badge-expired'}`}>
                {url.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {fullShortUrl}
              </span>
              <button onClick={handleCopy} className="btn btn-icon" title="Copy Short URL">
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>Original Destination: </span>
              <a
                href={url.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--text-muted)', fontSize: '0.85rem', wordBreak: 'break-all' }}
              >
                {url.originalUrl} <ExternalLink size={12} style={{ display: 'inline', marginLeft: 4 }} />
              </a>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-input)',
            padding: '1.25rem 1.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>All-Time Clicks</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
              {formatNumber(url.totalClicks)}
            </div>
          </div>
        </div>
      </div>

      {/* Clicks Timeline Chart */}
      <div className="glass-panel analytics-chart-card" style={{ marginBottom: '2rem' }}>
        <div className="chart-header">
          <div>
            <h3 style={{ margin: 0 }}>Click Traffic Over Time</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>Past {days} days activity</span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`btn ${days === d ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#475569" fontSize={11} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="clicks" stroke="#06b6d4" strokeWidth={2} fill="url(#detailGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="chart-header">
            <h4>Device Categories</h4>
            <Monitor size={18} color="#38bdf8" />
          </div>
          <div className="breakdown-list">
            {(data?.devices || []).length === 0 ? (
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No device data recorded yet.</p>
            ) : (
              data.devices.map((d) => (
                <div key={d.name} className="breakdown-item">
                  <span style={{ textTransform: 'capitalize' }}>{d.name}</span>
                  <strong>{d.value} clicks</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="chart-header">
            <h4>Top Referrers</h4>
            <Globe size={18} color="#10b981" />
          </div>
          <div className="breakdown-list">
            {(data?.referrers || []).length === 0 ? (
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No referrer data recorded yet.</p>
            ) : (
              data.referrers.map((r) => (
                <div key={r.name} className="breakdown-item">
                  <span>{r.name}</span>
                  <strong>{r.value} clicks</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <QrCodeModal isOpen={qrOpen} onClose={() => setQrOpen(false)} url={url} />
      <EditUrlModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        url={url}
        onSuccess={() => loadAnalytics()}
      />
      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        url={url}
        onSuccess={() => navigate('/dashboard')}
      />
    </div>
  );
};
