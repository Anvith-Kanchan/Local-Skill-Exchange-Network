'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftRight, Users, Shield, Sparkles, ArrowRight, 
  Code, Music, Dumbbell, Palette, ChefHat, Globe, 
  Star, Coins, Calendar, MessageCircle, TrendingUp, Zap
} from 'lucide-react';

const CATEGORIES = [
  { icon: Code, name: 'Technology', color: '#6366f1' },
  { icon: Music, name: 'Music', color: '#ec4899' },
  { icon: Dumbbell, name: 'Fitness', color: '#10b981' },
  { icon: Palette, name: 'Art & Design', color: '#f59e0b' },
  { icon: ChefHat, name: 'Cooking', color: '#ef4444' },
  { icon: Globe, name: 'Languages', color: '#06b6d4' },
];

const STEPS = [
  { icon: Users, title: 'List Your Skills', desc: 'Share what you can teach and what you want to learn' },
  { icon: Sparkles, title: 'Get Matched', desc: 'Our algorithm finds perfect skill exchange partners' },
  { icon: ArrowLeftRight, title: 'Exchange & Grow', desc: 'Trade skills, earn SkillCoins, and build your reputation' },
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);

  if (isLoggedIn) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            <span>The Future of Learning is Here</span>
          </div>
          <h1 className="hero-title">
            Trade Skills,<br />
            <span className="hero-gradient">Not Money</span>
          </h1>
          <p className="hero-subtitle">
            Join your local skill exchange network. Teach Python, learn guitar. 
            Design logos, get gym training. Build community through the power of shared knowledge.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">10</span>
              <span className="hero-stat-label">Free SkillCoins</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">∞</span>
              <span className="hero-stat-label">Skills to Learn</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">0</span>
              <span className="hero-stat-label">Dollars Needed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Exchange Skills Across Categories</h2>
          <p className="section-subtitle">From coding to cooking — there's a skill for everyone</p>
          <div className="categories-grid">
            {CATEGORIES.map(({ icon: Icon, name, color }) => (
              <div key={name} className="category-card glass-card" style={{ '--glow': color }}>
                <div className="category-icon" style={{ background: `${color}18`, color }}>
                  <Icon size={28} />
                </div>
                <h3>{name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section-alt">
        <div className="section-inner">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to start exchanging skills</p>
          <div className="steps-grid">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="step-card glass-card animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">
                  <Icon size={32} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">Built for Trust & Fairness</h2>
          <p className="section-subtitle">Real mechanisms to prevent abuse and ensure quality exchanges</p>
          <div className="features-grid">
            {[
              { icon: Coins, title: 'SkillCoin Economy', desc: 'Earn coins by teaching, spend them to learn. Fair, transparent, and self-balancing.' },
              { icon: Shield, title: 'Escrow Protection', desc: 'Coins held safely until both parties confirm a successful exchange.' },
              { icon: Star, title: 'Reputation System', desc: 'Build trust through reviews. Rise from Bronze to Platinum status.' },
              { icon: Sparkles, title: 'Smart Matching', desc: 'Multi-factor algorithm considers skills, availability, trust, and reciprocity.' },
              { icon: Calendar, title: 'Scheduling', desc: 'Built-in calendar to coordinate sessions without the back-and-forth.' },
              { icon: MessageCircle, title: 'Integrated Chat', desc: 'Discuss details, share resources, and coordinate directly in-app.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="feature-card glass-card">
                <div className="feature-icon">
                  <Icon size={24} />
                </div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-cta">
        <div className="section-inner text-center">
          <h2 className="cta-title">Ready to Start Trading Skills?</h2>
          <p className="section-subtitle">Join the community. Your first 10 SkillCoins are on us.</p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Create Your Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <ArrowLeftRight size={20} />
            <span>SkillXchange</span>
          </div>
          <p>© 2026 SkillXchange. Trade skills, grow together.</p>
        </div>
      </footer>

      <style jsx>{`
        .landing {
          position: relative;
          z-index: 1;
        }

        /* Hero */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }
        .hero-orb-1 {
          width: 500px;
          height: 500px;
          background: rgba(99, 102, 241, 0.2);
          top: 10%;
          left: 15%;
          animation: float 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 400px;
          height: 400px;
          background: rgba(6, 182, 212, 0.15);
          top: 40%;
          right: 10%;
          animation: float 10s ease-in-out infinite 2s;
        }
        .hero-orb-3 {
          width: 300px;
          height: 300px;
          background: rgba(245, 158, 11, 0.1);
          bottom: 10%;
          left: 40%;
          animation: float 7s ease-in-out infinite 4s;
        }
        .hero-content {
          text-align: center;
          max-width: 720px;
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.4rem 1rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--accent-primary-hover);
          margin-bottom: var(--space-xl);
          animation: fadeInUp 0.6s ease-out;
        }
        .hero-title {
          font-family: var(--font-heading);
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: var(--space-xl);
          animation: fadeInUp 0.6s ease-out 0.1s backwards;
        }
        .hero-gradient {
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto var(--space-2xl);
          animation: fadeInUp 0.6s ease-out 0.2s backwards;
        }
        .hero-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-3xl);
          animation: fadeInUp 0.6s ease-out 0.3s backwards;
        }
        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-xl);
          animation: fadeInUp 0.6s ease-out 0.4s backwards;
        }
        .hero-stat {
          text-align: center;
        }
        .hero-stat-value {
          display: block;
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .hero-stat-label {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }
        .hero-stat-divider {
          width: 1px;
          height: 40px;
          background: var(--border);
        }

        /* Sections */
        .section {
          padding: var(--space-3xl) var(--space-2xl);
        }
        .section-alt {
          background: rgba(15, 23, 42, 0.3);
        }
        .section-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .section-title {
          font-size: 2.25rem;
          text-align: center;
          margin-bottom: var(--space-sm);
        }
        .section-subtitle {
          text-align: center;
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin-bottom: var(--space-2xl);
        }

        /* Categories */
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }
        .category-card {
          padding: var(--space-xl);
          text-align: center;
          cursor: default;
        }
        .category-card:hover {
          box-shadow: 0 0 30px color-mix(in srgb, var(--glow) 15%, transparent);
        }
        .category-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-md);
        }
        .category-card h3 {
          font-size: 1.1rem;
          font-weight: 600;
        }

        /* Steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xl);
        }
        .step-card {
          padding: var(--space-2xl) var(--space-xl);
          text-align: center;
          position: relative;
        }
        .step-number {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          width: 28px;
          height: 28px;
          background: var(--accent-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          color: #fff;
        }
        .step-icon {
          color: var(--accent-primary);
          margin-bottom: var(--space-md);
        }
        .step-card h3 {
          font-size: 1.15rem;
          margin-bottom: var(--space-sm);
        }
        .step-card p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        /* Features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }
        .feature-card {
          padding: var(--space-xl);
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary);
          margin-bottom: var(--space-md);
        }
        .feature-card h4 {
          font-size: 1.05rem;
          margin-bottom: var(--space-sm);
        }
        .feature-card p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        /* CTA */
        .section-cta {
          padding: var(--space-3xl) var(--space-2xl) calc(var(--space-3xl) + 2rem);
        }
        .cta-title {
          font-size: 2.5rem;
          margin-bottom: var(--space-md);
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Footer */
        .footer {
          border-top: 1px solid var(--border);
          padding: var(--space-xl) var(--space-2xl);
        }
        .footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        .footer p {
          color: var(--text-tertiary);
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .categories-grid, .steps-grid, .features-grid {
            grid-template-columns: 1fr;
          }
          .hero-stats {
            flex-direction: column;
            gap: var(--space-md);
          }
          .hero-stat-divider {
            width: 40px;
            height: 1px;
          }
          .footer-inner {
            flex-direction: column;
            gap: var(--space-md);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
