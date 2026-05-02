'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Compass, Users, MessageCircle, Calendar, User, LogOut, 
  Bell, Coins, Menu, X, ArrowLeftRight, Sparkles
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setUser(data.user); })
      .catch(() => {});

    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setNotifications(data.unreadCount); })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (!user) return null;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/matches', label: 'Matches', icon: Sparkles },
    { href: '/exchanges', label: 'Exchanges', icon: ArrowLeftRight },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/dashboard" className="navbar-brand">
          <div className="navbar-logo">
            <ArrowLeftRight size={20} />
          </div>
          <span className="navbar-title">SkillXchange</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`navbar-link ${pathname === href ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <div className="navbar-coins" title="SkillCoins">
            <Coins size={16} />
            <span>{user.skillCoins?.toFixed(1)}</span>
          </div>

          <button 
            className="navbar-icon-btn"
            onClick={() => router.push('/dashboard')}
            title="Notifications"
          >
            <Bell size={18} />
            {notifications > 0 && <span className="navbar-badge">{notifications}</span>}
          </button>

          <div className="navbar-profile-wrap">
            <button 
              className="navbar-avatar" 
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="avatar avatar-sm">
                {user.fullName?.[0] || 'U'}
              </div>
            </button>
            
            {profileOpen && (
              <>
                <div className="navbar-dropdown-overlay" onClick={() => setProfileOpen(false)} />
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <p className="navbar-dropdown-name">{user.fullName}</p>
                    <p className="navbar-dropdown-email">{user.email}</p>
                  </div>
                  <div className="navbar-dropdown-divider" />
                  <Link href="/profile" className="navbar-dropdown-item" onClick={() => setProfileOpen(false)}>
                    <User size={16} /> My Profile
                  </Link>
                  <button className="navbar-dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>

          <button className="navbar-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(6, 8, 15, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          z-index: 100;
        }
        .navbar-inner {
          max-width: 1380px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 var(--space-xl);
          gap: var(--space-xl);
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          flex-shrink: 0;
        }
        .navbar-logo {
          width: 36px;
          height: 36px;
          background: var(--accent-gradient);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .navbar-title {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
        }
        .navbar-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .navbar-link:hover {
          color: var(--text-primary);
          background: rgba(99, 102, 241, 0.08);
        }
        .navbar-link.active {
          color: var(--accent-primary-hover);
          background: rgba(99, 102, 241, 0.12);
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-shrink: 0;
        }
        .navbar-coins {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.35rem 0.75rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: var(--radius-full);
          color: var(--accent-warm);
          font-size: 0.8rem;
          font-weight: 600;
        }
        .navbar-icon-btn {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .navbar-icon-btn:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        .navbar-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          background: var(--danger);
          border-radius: var(--radius-full);
          font-size: 0.625rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .navbar-profile-wrap {
          position: relative;
        }
        .navbar-avatar {
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
        }
        .navbar-dropdown-overlay {
          position: fixed;
          inset: 0;
          z-index: 99;
        }
        .navbar-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm);
          z-index: 100;
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.15s ease-out;
        }
        .navbar-dropdown-header {
          padding: var(--space-sm) var(--space-md);
        }
        .navbar-dropdown-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .navbar-dropdown-email {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
        .navbar-dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: var(--space-xs) 0;
        }
        .navbar-dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          width: 100%;
          padding: 0.5rem var(--space-md);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .navbar-dropdown-item:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        .navbar-menu-toggle {
          display: none;
          border: none;
          background: none;
          color: var(--text-secondary);
          cursor: pointer;
        }
        @media (max-width: 900px) {
          .navbar-links {
            display: none;
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            flex-direction: column;
            padding: var(--space-md);
            gap: var(--space-xs);
          }
          .navbar-links.open {
            display: flex;
          }
          .navbar-link {
            width: 100%;
            padding: 0.75rem;
          }
          .navbar-menu-toggle {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
}
