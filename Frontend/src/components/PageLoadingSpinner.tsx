import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface PageLoadingSpinnerProps {
  label?: string;
  fullscreen?: boolean;
}

export const PageLoadingSpinner: React.FC<PageLoadingSpinnerProps> = ({
  label = 'Loading statutory portal...',
  fullscreen = true
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary, #0B1120)',
        color: 'var(--text-primary, #F8FAFC)',
        userSelect: 'none',
        minHeight: fullscreen ? '100vh' : '300px',
        width: '100%',
        position: fullscreen ? 'fixed' : 'relative',
        inset: fullscreen ? 0 : undefined,
        zIndex: fullscreen ? 9999 : 1
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            filter: 'blur(16px)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />

        {/* Outer spinning ring */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            border: '2px solid rgba(59, 130, 246, 0.15)',
            borderTopColor: 'var(--accent-blue, #2563EB)',
            borderRightColor: 'var(--accent-blue-light, #60A5FA)',
            animation: 'spin 0.9s linear infinite'
          }}
        />

        {/* Inner pulsing shield icon */}
        <div
          style={{
            position: 'absolute',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'rgba(30, 64, 175, 0.4)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60A5FA'
          }}
        >
          <ShieldCheck size={16} />
        </div>
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          fontSize: '0.85rem'
        }}
      >
        <span style={{ color: 'var(--text-secondary, #94A3B8)', fontWeight: 500 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--accent-blue-light, #60A5FA)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
        >
          GovEaseAI
        </span>
      </div>
    </div>
  );
};

export default PageLoadingSpinner;
