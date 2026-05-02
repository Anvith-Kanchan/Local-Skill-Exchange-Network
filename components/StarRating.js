'use client';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, max = 5, onChange, size = 18, readonly = false }) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <button
        key={i}
        type="button"
        className={`star-btn ${i <= rating ? 'filled' : ''}`}
        onClick={() => !readonly && onChange?.(i)}
        disabled={readonly}
        style={{ cursor: readonly ? 'default' : 'pointer' }}
      >
        <Star size={size} fill={i <= rating ? '#f59e0b' : 'none'} stroke={i <= rating ? '#f59e0b' : '#64748b'} />
      </button>
    );
  }

  return (
    <div className="star-rating">
      {stars}
      <style jsx>{`
        .star-rating {
          display: inline-flex;
          gap: 2px;
          align-items: center;
        }
        .star-btn {
          border: none;
          background: none;
          padding: 2px;
          display: flex;
          transition: transform 150ms ease;
        }
        .star-btn:not(:disabled):hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
