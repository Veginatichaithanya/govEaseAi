import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
  style = {}
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const actionLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const currentLabel = isDark ? 'Dark Mode' : 'Light Mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      aria-label={actionLabel}
      title={actionLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        height: '38px',
        padding: showLabel ? '0 0.95rem' : '0',
        width: showLabel ? 'auto' : '38px',
        borderRadius: 'var(--radius-md)',
        background: isDark ? 'var(--bg-secondary)' : 'rgba(241, 245, 249, 0.9)',
        border: isDark ? '1px solid var(--border-subtle)' : '1px solid #CBD5E1',
        color: isDark ? '#F59E0B' : '#0284C7',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(2, 132, 199, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = isDark ? 'var(--border-subtle)' : '#CBD5E1';
      }}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
      ) : (
        <Moon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
      )}

      {showLabel && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: isDark ? '#E2E8F0' : '#0F172A',
            whiteSpace: 'nowrap'
          }}
        >
          {currentLabel}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
