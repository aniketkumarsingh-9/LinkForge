import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Link2, LogOut, LayoutDashboard, PlusCircle, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';

export const Navbar = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Signed out successfully', 'info');
      navigate('/');
    } catch {
      addToast('Error signing out', 'error');
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="nav-brand">
          <div className="nav-brand-icon">
            <Link2 size={20} />
          </div>
          <span>LinkForge</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-user">
          {isAuthenticated ? (
            <>
              {onOpenCreateModal && (
                <button onClick={onOpenCreateModal} className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                  <PlusCircle size={16} />
                  <span>Shorten</span>
                </button>
              )}
              <div className="user-badge" title={user?.email}>
                <User size={15} color="#38bdf8" />
                <span>{user?.name || user?.email?.split('@')[0]}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-icon" title="Sign Out">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
