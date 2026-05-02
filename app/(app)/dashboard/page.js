'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coins, ArrowUpRight, ArrowDownRight, TrendingUp, Users, Sparkles,
  Calendar, MessageCircle, ArrowLeftRight, Clock, ChevronRight,
  Plus, BookOpen, Star
} from 'lucide-react';
import TrustBadge from '@/components/TrustBadge';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([authData, dashData]) => {
      if (!authData?.user) { router.push('/login'); return; }
      setUser(authData.user);
      setData(dashData);
      setLoading(false);
    }).catch(() => router.push('/login'));
  }, [router]);

  if (loading || !data || !user) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: 200, marginBottom: 24 }} />
        <div className="grid grid-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="welcome-banner glass-card animate-fadeIn">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1>Welcome back, {user.fullName?.split(' ')[0]}! 👋</h1>
            <p>Here&apos;s what&apos;s happening in your skill exchange network</p>
          </div>
          <div className="welcome-actions">
            <Link href="/explore" className="btn btn-primary">
              <Sparkles size={16} /> Find Skills
            </Link>
            <Link href="/profile" className="btn btn-secondary">
              <Plus size={16} /> Add Skills
            </Link>
          </div>
        </div>
        <div className="welcome-trust">
          <TrustBadge level={user.trustLevel} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-4 stagger-children" style={{ marginTop: 24 }}>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Coins size={22} />
          </div>
          <div className="stat-value">{data.coinBalance?.toFixed(1)}</div>
          <div className="stat-label">SkillCoins</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <ArrowLeftRight size={22} />
          </div>
          <div className="stat-value">{data.exchangeStats?.active || 0}</div>
          <div className="stat-label">Active Exchanges</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value">{data.exchangeStats?.completed || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-value">{(data.skillStats?.offers || 0) + (data.skillStats?.requests || 0)}</div>
          <div className="stat-label">Skills Listed</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        {/* Left Column */}
        <div className="dashboard-main">
          {/* Pending Requests */}
          {data.exchangeStats?.pending_received > 0 && (
            <div className="glass-card dash-section animate-fadeIn">
              <div className="dash-section-header">
                <h3><Clock size={18} /> Pending Requests</h3>
                <span className="badge badge-warning">{data.exchangeStats.pending_received} new</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                You have exchange requests waiting for your response
              </p>
              <Link href="/exchanges" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                View Requests <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* Recent Exchanges */}
          <div className="glass-card dash-section animate-fadeIn">
            <div className="dash-section-header">
              <h3><ArrowLeftRight size={18} /> Recent Exchanges</h3>
              <Link href="/exchanges" className="btn btn-ghost btn-sm">View All <ChevronRight size={14} /></Link>
            </div>
            {data.recentExchanges?.length > 0 ? (
              <div className="exchange-list">
                {data.recentExchanges.map(ex => (
                  <div key={ex.id} className="exchange-item">
                    <div className="avatar avatar-sm">
                      {ex.partner_name?.[0] || '?'}
                    </div>
                    <div className="exchange-info">
                      <span className="exchange-partner">{ex.partner_name}</span>
                      <span className="exchange-skill">{ex.skill_name}</span>
                    </div>
                    <span className={`badge badge-${ex.status === 'completed' ? 'success' : ex.status === 'in_progress' ? 'primary' : ex.status === 'pending' ? 'warning' : 'danger'}`}>
                      {ex.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <p>No exchanges yet. Start by exploring available skills!</p>
                <Link href="/explore" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                  Explore Skills
                </Link>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="glass-card dash-section animate-fadeIn">
            <div className="dash-section-header">
              <h3><Coins size={18} /> Recent Transactions</h3>
            </div>
            {data.recentTransactions?.length > 0 ? (
              <div className="transaction-list">
                {data.recentTransactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <div className={`transaction-icon ${tx.type === 'escrow_release' || tx.type === 'bonus' || tx.type === 'refund' ? 'incoming' : 'outgoing'}`}>
                      {tx.type === 'escrow_release' || tx.type === 'bonus' || tx.type === 'refund'
                        ? <ArrowDownRight size={16} />
                        : <ArrowUpRight size={16} />}
                    </div>
                    <div className="transaction-info">
                      <span className="transaction-desc">{tx.description || tx.type.replace('_', ' ')}</span>
                      <span className="transaction-date">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`transaction-amount ${tx.type === 'escrow_release' || tx.type === 'bonus' || tx.type === 'refund' ? 'positive' : 'negative'}`}>
                      {tx.type === 'escrow_release' || tx.type === 'bonus' || tx.type === 'refund' ? '+' : '-'}{tx.amount.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', padding: '1rem 0' }}>No transactions yet</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-sidebar">
          {/* Quick Stats */}
          <div className="glass-card dash-section animate-fadeIn">
            <h3 style={{ marginBottom: 16 }}>Quick Links</h3>
            <div className="quick-links">
              <Link href="/matches" className="quick-link">
                <Sparkles size={18} /> <span>Find Matches</span> <ChevronRight size={14} />
              </Link>
              <Link href="/chat" className="quick-link">
                <MessageCircle size={18} />
                <span>Messages</span>
                {data.unreadMessages > 0 && <span className="badge badge-danger">{data.unreadMessages}</span>}
                <ChevronRight size={14} />
              </Link>
              <Link href="/calendar" className="quick-link">
                <Calendar size={18} /> <span>Calendar</span> <ChevronRight size={14} />
              </Link>
              <Link href="/profile" className="quick-link">
                <Users size={18} /> <span>My Profile</span> <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="glass-card dash-section animate-fadeIn">
            <div className="dash-section-header">
              <h3><Calendar size={18} /> Upcoming</h3>
            </div>
            {data.upcomingEvents?.length > 0 ? (
              <div className="event-list">
                {data.upcomingEvents.map(ev => (
                  <div key={ev.id} className="event-item">
                    <div className="event-date">
                      <span className="event-day">{new Date(ev.start_time).getDate()}</span>
                      <span className="event-month">{new Date(ev.start_time).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="event-info">
                      <span className="event-title">{ev.title}</span>
                      <span className="event-partner">with {ev.partner_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                No upcoming sessions
              </p>
            )}
          </div>

          {/* Your Reputation */}
          <div className="glass-card dash-section animate-fadeIn">
            <h3 style={{ marginBottom: 16 }}><Star size={18} /> Your Reputation</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <TrustBadge level={user.trustLevel} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {user.reputationScore > 0 ? `${user.reputationScore.toFixed(1)} / 5.0 avg rating` : 'No ratings yet'}
              </span>
            </div>
            <div className="rep-progress">
              <div className="rep-bar">
                <div className="rep-fill" style={{ width: `${Math.min(100, (user.totalExchanges / 20) * 100)}%` }} />
              </div>
              <span className="rep-text">{user.totalExchanges}/20 exchanges to next level</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .welcome-banner {
          padding: var(--space-xl) var(--space-2xl);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.05));
        }
        .welcome-content {
          display: flex;
          align-items: center;
          gap: var(--space-2xl);
        }
        .welcome-text h1 {
          font-size: 1.5rem;
          margin-bottom: 4px;
        }
        .welcome-text p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .welcome-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-xl);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-md);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--space-xl);
        }
        .dashboard-main {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .dashboard-sidebar {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .dash-section {
          padding: var(--space-xl);
        }
        .dash-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-md);
        }
        .dash-section-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.05rem;
        }

        .exchange-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .exchange-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--border);
        }
        .exchange-item:last-child {
          border-bottom: none;
        }
        .exchange-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .exchange-partner {
          font-weight: 500;
          font-size: 0.9rem;
        }
        .exchange-skill {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
        }
        .transaction-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .transaction-item:last-child { border-bottom: none; }
        .transaction-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .transaction-icon.incoming {
          background: var(--success-bg);
          color: var(--success);
        }
        .transaction-icon.outgoing {
          background: var(--danger-bg);
          color: var(--danger);
        }
        .transaction-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .transaction-desc {
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        .transaction-date {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
        .transaction-amount {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .transaction-amount.positive { color: var(--success); }
        .transaction-amount.negative { color: var(--danger); }

        .quick-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .quick-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-decoration: none;
          transition: all var(--transition-fast);
          font-size: 0.9rem;
        }
        .quick-link:hover {
          background: rgba(99, 102, 241, 0.08);
          color: var(--text-primary);
        }
        .quick-link span:first-of-type {
          flex: 1;
        }
        .quick-link :last-child {
          color: var(--text-tertiary);
        }

        .event-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .event-item {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .event-date {
          width: 48px;
          height: 48px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .event-day {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--accent-primary-hover);
          line-height: 1;
        }
        .event-month {
          font-size: 0.65rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .event-info {
          display: flex;
          flex-direction: column;
        }
        .event-title {
          font-size: 0.85rem;
          font-weight: 500;
        }
        .event-partner {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .rep-progress {
          margin-top: 8px;
        }
        .rep-bar {
          height: 6px;
          background: var(--bg-input);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .rep-fill {
          height: 100%;
          background: var(--accent-gradient);
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        .rep-text {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .welcome-content {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-md);
          }
          .welcome-banner {
            flex-direction: column;
            gap: var(--space-md);
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
