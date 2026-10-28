import React from 'react';
import { Link } from 'react-router-dom';
import { Link2, ArrowLeft, AlertCircle } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      textAlign: 'center'
    }}>
      <div className="glass-panel" style={{ maxWidth: 480, padding: '3rem 2rem', width: '100%' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--danger-bg)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          border: '1px solid var(--danger-border)'
        }}>
          <AlertCircle size={28} />
        </div>

        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>404 - Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          The page you are looking for does not exist, has been removed, or has moved to an alternate destination.
        </p>

        <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
};
