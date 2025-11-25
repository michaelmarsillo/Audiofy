'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'correct' | 'wrong';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 1200 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 scale-in">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border-2 ${
          type === 'correct'
            ? 'bg-[var(--accent-success)]/90 border-[var(--accent-success)] text-white'
            : 'bg-[var(--accent-danger)]/90 border-[var(--accent-danger)] text-white'
        }`}
      >
        {type === 'correct' ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        )}
        <span className="text-lg font-semibold">{message}</span>
      </div>
    </div>
  );
}

