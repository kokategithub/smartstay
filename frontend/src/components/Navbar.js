import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isHome = location.pathname === '/';

  return (
    <nav className={`navbar ${scrolled || !isHome ? 'navbar-solid' : 'navbar-transparent'}`}>
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">Smart<span className="logo-accent">Stay</span></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Home size={16} /> Home
          </Link>
          <Link to="/rooms" className="nav-link" onClick={() => setMenuOpen(false)}>
            <Search size={16} /> Find Rooms
          </Link>
          {user?.role === 'owner' && (
            <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}
          {user?.role === 'user' && (
            <Link to="/student-dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} /> My Dashboard
            </Link>
          )}
          {user ? (
            <div className="nav-user">
              <NotificationBell />
              <Link to="/profile" className="nav-username" onClick={() => setMenuOpen(false)}>
                <User size={14} /> {user.name}
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-nav-login" onClick={() => setMenuOpen(false)}>
              Login / Register
            </Link>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}
