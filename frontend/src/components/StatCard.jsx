import React from 'react';

export const StatCard = ({ title, value, icon: Icon, meta, color = 'blue' }) => {
  const colorStyles = {
    blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.25)', text: '#60a5fa' },
    green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', text: '#34d399' },
    yellow: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', text: '#fbbf24' },
    red: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', text: '#f87171' },
    cyan: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.25)', text: '#22d3ee' },
  }[color] || { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.25)', text: '#60a5fa' };

  return (
    <div className="glass-panel stat-card glass-panel-hover">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div
          className="stat-icon"
          style={{
            background: colorStyles.bg,
            borderColor: colorStyles.border,
            color: colorStyles.text,
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  );
};
