import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle, Search, Link2, MousePointerClick, CheckCircle,
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight, BarChart2
} from 'lucide-react';
import { fetchUserUrls } from '../api/urls.js';
import { fetchOverviewAnalytics } from '../api/analytics.js';
import { StatCard } from '../components/StatCard.jsx';
import { UrlTable } from '../components/UrlTable.jsx';
import { CreateUrlModal } from '../components/CreateUrlModal.jsx';
import { EditUrlModal } from '../components/EditUrlModal.jsx';
import { QrCodeModal } from '../components/QrCodeModal.jsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.jsx';
import { AnalyticsModal } from '../components/AnalyticsModal.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useToast } from '../hooks/useToast.js';

export const DashboardPage = () => {
  // URLs State
  const [urls, setUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

  // Filtering & Sorting
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState('all'); // all, active, expired
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Overview Analytics State
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUrl, setEditUrl] = useState(null);
  const [deleteUrl, setDeleteUrl] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [analyticsUrlId, setAnalyticsUrlId] = useState(null);

  const { addToast } = useToast();

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await fetchOverviewAnalytics();
      if (res.success) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Failed to load overview', err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // Load URLs with current filters
  const loadUrls = useCallback(async (page = 1) => {
    setLoadingUrls(true);
    try {
      const res = await fetchUserUrls({
        page,
        limit: 10,
        search: debouncedSearch,
        filter,
        sortBy,
        order,
      });

      if (res.success) {
        setUrls(res.data.urls);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load URLs', 'error');
    } finally {
      setLoadingUrls(false);
    }
  }, [debouncedSearch, filter, sortBy, order, addToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadUrls(1);
  }, [loadUrls]);

  const handleToggleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const handleUrlCreated = (newUrl) => {
    loadUrls(1);
    loadOverview();
  };

  const handleUrlUpdated = (updatedUrl) => {
    loadUrls(pagination.page);
    loadOverview();
  };

  const handleUrlDeleted = (deletedId) => {
    loadUrls(pagination.page);
    loadOverview();
  };

  const summary = overview?.summary || {
    totalUrls: pagination.total || 0,
    totalClicks: 0,
    activeUrls: 0,
    expiredUrls: 0,
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header with Title and Create Button */}
        <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Link Management Dashboard</h1>
            <p style={{ fontSize: '0.9rem' }}>Monitor, configure, and analyze all your shortened links.</p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <PlusCircle size={18} />
            <span>Shorten New URL</span>
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="stats-grid">
          <StatCard
            title="Total Links"
            value={summary.totalUrls}
            icon={Link2}
            color="blue"
            meta="Created short URLs"
          />
          <StatCard
            title="Total Clicks"
            value={summary.totalClicks}
            icon={MousePointerClick}
            color="cyan"
            meta="All-time recorded redirects"
          />
          <StatCard
            title="Active Links"
            value={summary.activeUrls}
            icon={CheckCircle}
            color="green"
            meta="Currently redirecting"
          />
          <StatCard
            title="Expired / Disabled"
            value={summary.expiredUrls}
            icon={AlertCircle}
            color="yellow"
            meta="No longer resolving"
          />
        </div>

        {/* Search, Filter & Actions Toolbar */}
        <div className="dashboard-toolbar">
          <div className="dashboard-search-wrap">
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search by title, original URL, or alias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="filter-pills">
              <button
                className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Links
              </button>
              <button
                className={`filter-pill ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button
                className={`filter-pill ${filter === 'expired' ? 'active' : ''}`}
                onClick={() => setFilter('expired')}
              >
                Expired
              </button>
            </div>

            <button
              onClick={() => { loadUrls(pagination.page); loadOverview(); }}
              className="btn-icon"
              title="Refresh Records"
            >
              <RefreshCw size={16} className={loadingUrls ? 'spin-animation' : ''} />
            </button>
          </div>
        </div>

        {/* URLs Table */}
        <UrlTable
          urls={urls}
          loading={loadingUrls}
          onOpenEdit={(url) => setEditUrl(url)}
          onOpenDelete={(url) => setDeleteUrl(url)}
          onOpenQr={(url) => setQrUrl(url)}
          onOpenAnalytics={(id) => setAnalyticsUrlId(id)}
          sortBy={sortBy}
          order={order}
          onToggleSort={handleToggleSort}
        />

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="pagination-controls glass-panel" style={{ marginTop: '1rem' }}>
            <div>
              Showing page <strong style={{ color: '#fff' }}>{pagination.page}</strong> of{' '}
              <strong style={{ color: '#fff' }}>{pagination.totalPages}</strong> ({pagination.total} total links)
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadUrls(pagination.page - 1)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadUrls(pagination.page + 1)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <CreateUrlModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleUrlCreated}
        />

        <EditUrlModal
          isOpen={Boolean(editUrl)}
          onClose={() => setEditUrl(null)}
          url={editUrl}
          onSuccess={handleUrlUpdated}
        />

        <DeleteConfirmModal
          isOpen={Boolean(deleteUrl)}
          onClose={() => setDeleteUrl(null)}
          url={deleteUrl}
          onSuccess={handleUrlDeleted}
        />

        <QrCodeModal
          isOpen={Boolean(qrUrl)}
          onClose={() => setQrUrl(null)}
          url={qrUrl}
        />

        <AnalyticsModal
          isOpen={Boolean(analyticsUrlId)}
          onClose={() => setAnalyticsUrlId(null)}
          urlId={analyticsUrlId}
        />
      </div>
    </div>
  );
};
