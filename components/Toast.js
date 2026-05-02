'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
  error: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
  warning: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
  info: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => {
          const Icon = ICONS[toast.type];
          const colors = COLORS[toast.type];
          return (
            <div
              key={toast.id}
              className="toast-item"
              style={{
                background: colors.bg,
                borderColor: colors.border,
              }}
            >
              <Icon size={18} color={colors.color} />
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 400px;
        }
        .toast-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid;
          backdrop-filter: blur(20px);
          animation: slideInRight 0.3s ease-out;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .toast-message {
          flex: 1;
        }
        .toast-close {
          border: none;
          background: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 2px;
          display: flex;
        }
        .toast-close:hover {
          color: var(--text-primary);
        }
      `}</style>
    </ToastContext.Provider>
  );
}
