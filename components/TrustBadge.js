'use client';
import { Shield, Award, Crown, Gem } from 'lucide-react';

const TRUST_CONFIG = {
  bronze: { icon: Shield, label: 'Bronze', color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.12)' },
  silver: { icon: Award, label: 'Silver', color: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.12)' },
  gold: { icon: Crown, label: 'Gold', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.12)' },
  platinum: { icon: Gem, label: 'Platinum', color: '#e5e4e2', bg: 'rgba(229, 228, 226, 0.15)' },
};

export default function TrustBadge({ level = 'bronze', showLabel = true, size = 16 }) {
  const config = TRUST_CONFIG[level] || TRUST_CONFIG.bronze;
  const Icon = config.icon;

  return (
    <span className="trust-badge" style={{ background: config.bg, color: config.color, borderColor: `${config.color}33` }}>
      <Icon size={size} />
      {showLabel && <span>{config.label}</span>}
      <style jsx>{`
        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
          letter-spacing: 0.3px;
        }
      `}</style>
    </span>
  );
}
