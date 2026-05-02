'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, User, Mail, Lock, MapPin, ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>
      <div className="auth-card glass-card animate-fadeInUp">
        <Link href="/" className="auth-brand">
          <div className="auth-logo"><ArrowLeftRight size={20} /></div>
          <span>SkillXchange</span>
        </Link>
        
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join the skill exchange community — get 10 free SkillCoins!</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Full Name</label>
              <div className="input-wrap">
                <User size={18} className="input-icon" />
                <input type="text" className="input input-with-icon" placeholder="Jane Doe"
                  value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Username</label>
              <div className="input-wrap">
                <span className="input-icon" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>@</span>
                <input type="text" className="input input-with-icon" placeholder="janedoe"
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} required />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <div className="input-wrap">
              <Mail size={18} className="input-icon" />
              <input type="email" className="input input-with-icon" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <div className="input-wrap">
              <Lock size={18} className="input-icon" />
              <input type="password" className="input input-with-icon" placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">City</label>
            <div className="input-wrap">
              <MapPin size={18} className="input-icon" />
              <input type="text" className="input input-with-icon" placeholder="e.g. Bangalore"
                value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <><span>Create Account</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl);
          position: relative;
          z-index: 1;
        }
        .auth-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
        }
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
        }
        .auth-orb-1 {
          width: 400px;
          height: 400px;
          background: rgba(99, 102, 241, 0.25);
          top: 20%;
          right: 25%;
          animation: float 8s ease-in-out infinite;
        }
        .auth-orb-2 {
          width: 350px;
          height: 350px;
          background: rgba(6, 182, 212, 0.2);
          bottom: 15%;
          left: 25%;
          animation: float 10s ease-in-out infinite 3s;
        }
        .auth-card {
          width: 100%;
          max-width: 520px;
          padding: var(--space-2xl);
          position: relative;
          z-index: 1;
        }
        .auth-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--text-primary);
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: var(--space-2xl);
        }
        .auth-logo {
          width: 36px;
          height: 36px;
          background: var(--accent-gradient);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .auth-card h1 {
          font-size: 1.75rem;
          margin-bottom: var(--space-xs);
        }
        .auth-subtitle {
          color: var(--text-secondary);
          margin-bottom: var(--space-xl);
        }
        .auth-error {
          padding: 0.75rem 1rem;
          background: var(--danger-bg);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--danger);
          font-size: 0.875rem;
          margin-bottom: var(--space-lg);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }
        .input-wrap {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          pointer-events: none;
        }
        .input-with-icon {
          padding-left: 40px;
        }
        .auth-footer {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-top: var(--space-xl);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
