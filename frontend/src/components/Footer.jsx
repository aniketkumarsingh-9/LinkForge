import React from 'react';
import { Link2, ShieldCheck, Zap, Database } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-top">
          <div>
            <div className="nav-brand" style={{ marginBottom: '0.5rem' }}>
              <div className="nav-brand-icon" style={{ width: 28, height: 28 }}>
                <Link2 size={16} />
              </div>
              <span style={{ fontSize: '1.15rem' }}>LinkForge</span>
            </div>
            <p style={{ maxWidth: 420, fontSize: '0.875rem' }}>
              Engineered with sub-millisecond Redis caching, collision-resistant code generation, and granular privacy-first analytics.
            </p>
          </div>

          <div className="tech-tags">
            <span className="tech-tag">Node.js ES Modules</span>
            <span className="tech-tag">Express REST</span>
            <span className="tech-tag">MongoDB & Mongoose</span>
            <span className="tech-tag">Redis Cache-Aside</span>
            <span className="tech-tag">React 18 & Vite</span>
            <span className="tech-tag">JWT Auth</span>
            <span className="tech-tag">Docker</span>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} LinkForge. Open source under the MIT License.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={14} color="#38bdf8" /> Sub-millisecond redirects
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} color="#10b981" /> SSRF & XSS protected
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={14} color="#a855f7" /> Scalable click events
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
