import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Download, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/useToast.js';

export const QrCodeModal = ({ isOpen, onClose, url }) => {
  const canvasRef = useRef(null);
  const { addToast } = useToast();

  const shortUrl = url?.shortUrl || `${window.location.origin}/${url?.shortCode}`;

  useEffect(() => {
    if (isOpen && url && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        shortUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Failed to generate QR code', error);
        }
      );
    }
  }, [isOpen, url, shortUrl]);

  if (!isOpen || !url) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      addToast('Short link copied to clipboard!', 'success');
    } catch {
      addToast('Could not copy link to clipboard', 'error');
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `linkforge-${url.shortCode}-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    addToast('QR Code downloaded', 'info');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="nav-brand-icon" style={{ width: 28, height: 28 }}>
              <QrCode size={16} />
            </div>
            <h3>QR Code Generator</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: '#ffffff',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '1.25rem',
            display: 'inline-block'
          }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
          </div>

          <div style={{ marginBottom: '1.5rem', width: '100%' }}>
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              color: 'var(--accent-cyan)',
              wordBreak: 'break-all',
              marginBottom: '0.5rem'
            }}>
              {shortUrl}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              Scan to test instant redirection on your mobile device.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1 }}>
              <Copy size={16} />
              <span>Copy</span>
            </button>
            <button onClick={handleDownload} className="btn btn-primary" style={{ flex: 1 }}>
              <Download size={16} />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
