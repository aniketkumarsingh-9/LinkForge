import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  X, BarChart3, Calendar, Globe, Monitor, Smartphone,
  ExternalLink, Clock, ShieldAlert, RefreshCw
} from 'lucide-react';
import { fetchUrlAnalytics } from '../api/analytics.js';
import { formatDate, formatDateTime, formatNumber } from '../utils/formatters.js';

const DEVICE_COLORS = {
  desktop: '#3b82f6',
  mobile: '#10b981',
  tablet: '#f59e0b',
  unknown: '#64748b'
};

const PIE_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const AnalyticsModal = ({ isOpen, onClose, urlId }) => {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!urlId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchUrlAnalytics(urlId, days);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && urlId) {
      loadData();
    }
  }, [isOpen, urlId, days]);

  if (!isOpen) return null;

  const urlInfo = data?.url;
  const timeline = data?.timeline || [];
  const devices = data?.devices || [];
  const browsers = data?.browsers || [];
  const referrers = data?.referrers || [];
  const recentClicks = data?.recentClicks || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 840, width: '95%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="nav-brand-icon" style={{ width: 30, height: 30 }}>
              <BarChart3 size={18} />
            </div>
            <div>
              <h3>URL Performance & Analytics</h3>
              {urlInfo && (
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                  /{urlInfo.shortCode}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`btn ${days === d ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button onClick={loadData} className="btn-icon" title="Refresh">
              <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
            </button>
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '82vh' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: '#f87171',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {loading && !data && (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading performance metrics...
            </div>
          )}

          {data && (
            <>
              {/* Summary Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Clicks</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>{formatNumber(urlInfo?.totalClicks)}</div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created Date</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                    {formatDate(urlInfo?.createdAt)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className={`badge ${urlInfo?.isActive ? 'badge-active' : 'badge-expired'}`}>
                      {urlInfo?.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiration</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.4rem' }}>
                    {urlInfo?.expiresAt ? formatDate(urlInfo.expiresAt) : 'Perpetual'}
                  </div>
                </div>
              </div>

              {/* Time Series Area Chart */}
              <div className="glass-panel analytics-chart-card">
                <div className="chart-header">
                  <h4>Clicks Over Time (Past {days} Days)</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Daily count</span>
                </div>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="clickColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={11}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.85rem',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#clickColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Breakdown Grid: Devices & Referrers */}
              <div className="analytics-breakdown-grid">
                {/* Devices */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div className="chart-header">
                    <h4>Device Category</h4>
                    <Monitor size={16} color="#38bdf8" />
                  </div>
                  {devices.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '1rem 0' }}>
                      No device data recorded yet.
                    </p>
                  ) : (
                    <div className="breakdown-list">
                      {devices.map((d) => {
                        const total = devices.reduce((sum, item) => sum + item.value, 0) || 1;
                        const pct = Math.round((d.value / total) * 100);
                        return (
                          <div key={d.name}>
                            <div className="breakdown-item">
                              <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{d.name}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{d.value} ({pct}%)</span>
                            </div>
                            <div className="breakdown-bar-bg">
                              <div
                                className="breakdown-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: DEVICE_COLORS[d.name] || '#3b82f6'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top Referrers */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div className="chart-header">
                    <h4>Top Referrers</h4>
                    <Globe size={16} color="#10b981" />
                  </div>
                  {referrers.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '1rem 0' }}>
                      No referrer data recorded yet.
                    </p>
                  ) : (
                    <div className="breakdown-list">
                      {referrers.map((r) => {
                        const total = referrers.reduce((sum, item) => sum + item.value, 0) || 1;
                        const pct = Math.round((r.value / total) * 100);
                        return (
                          <div key={r.name}>
                            <div className="breakdown-item">
                              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                {r.name}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>{r.value} ({pct}%)</span>
                            </div>
                            <div className="breakdown-bar-bg">
                              <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Click Log */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div className="chart-header">
                  <h4>Recent Click Activity</h4>
                  <Clock size={16} color="#a855f7" />
                </div>
                {recentClicks.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '1rem 0' }}>
                    No clicks recorded for this URL yet.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table" style={{ fontSize: '0.825rem' }}>
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Device</th>
                          <th>Browser</th>
                          <th>Referrer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClicks.slice(0, 10).map((click, i) => (
                          <tr key={i}>
                            <td>{formatDateTime(click.timestamp)}</td>
                            <td style={{ textTransform: 'capitalize' }}>{click.device || 'unknown'}</td>
                            <td>{click.browser || 'Unknown'}</td>
                            <td>{click.referrer || 'Direct'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <div style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.775rem',
                color: 'var(--text-subtle)'
              }}>
                <ShieldAlert size={14} color="#f59e0b" />
                <span>
                  Privacy compliance: IP addresses are salted and hashed cryptographically. No personal identifiable information is retained. Referrer headers may be withheld by modern privacy-protecting browsers.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
