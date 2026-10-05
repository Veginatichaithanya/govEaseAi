import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.history.pushState(null, '', `#${sectionId}`);
      const el = document.getElementById(sectionId);
      if (el) {
        const navHeight = 72;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementPosition - navHeight - 16),
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <header
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-height)',
        zIndex: 50,
        transition: 'all 0.25s ease',
        backgroundColor: scrolled ? 'var(--nav-bg)' : 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid var(--nav-border)' : '1px solid var(--border-subtle)'
      }}
    >
      <div
        className="container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand Logo & Prototype Badge */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none'
          }}
          aria-label="GovEaseAI Home"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <ShieldCheck size={22} color="#FFFFFF" strokeWidth={2.2} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)'
                }}
              >
                GovEase<span style={{ color: 'var(--accent-cyan-light)' }}>AI</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#38BDF8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px'
                }}
              >
                <Sparkles size={10} />
                AI ASSISTANT
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }}
          className="desktop-nav"
        >
          <Link
            to="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.925rem',
              fontWeight: 500,
              color: location.pathname === '/' ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
              transition: 'color 0.15s ease'
            }}
          >
            Home
          </Link>
          <a
            href="/#services"
            onClick={(e) => scrollToSection(e, 'services')}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.925rem',
              fontWeight: 500,
              color: location.hash === '#services' ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
              transition: 'color 0.15s ease',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            Services
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.925rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              transition: 'color 0.15s ease'
            }}
          >
            How It Works
          </a>
          <a
            href="/#about"
            onClick={(e) => scrollToSection(e, 'about')}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.925rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              transition: 'color 0.15s ease'
            }}
          >
            About
          </a>
        </nav>

        {/* Right Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
          className="desktop-actions"
        >
          <ThemeToggle />
          <Link
            to="/login"
            className="btn btn-ghost"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}
          >
            Login
          </Link>
          <Link
            to="/login"
            className="btn btn-primary"
            style={{
              fontSize: '0.875rem',
              padding: '0.55rem 1.15rem'
            }}
          >
            Get Started <ArrowRight size={15} />
          </Link>
        </div>

        {/* Mobile Header Actions: Quick ThemeToggle + Hamburger */}
        <div
          className="mobile-header-actions"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <ThemeToggle />
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            style={{
              display: 'flex',
              color: 'var(--text-primary)',
              padding: '0.5rem',
              borderRadius: '6px',
              background: 'var(--bg-accent-subtle)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--nav-height)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--nav-bg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--nav-border)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-dropdown)'
          }}
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#FFFFFF',
              padding: '0.5rem 0'
            }}
          >
            Home
          </Link>
          <a
            href="/#services"
            onClick={(e) => {
              scrollToSection(e, 'services');
              setMobileMenuOpen(false);
            }}
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              padding: '0.5rem 0',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            Government Services
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => {
              scrollToSection(e, 'how-it-works');
              setMobileMenuOpen(false);
            }}
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              padding: '0.5rem 0'
            }}
          >
            How It Works
          </a>
          <a
            href="/#about"
            onClick={(e) => {
              scrollToSection(e, 'about');
              setMobileMenuOpen(false);
            }}
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              padding: '0.5rem 0'
            }}
          >
            About & Final-Year Research
          </a>

          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border-subtle)',
              margin: '0.5rem 0'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <ThemeToggle showLabel={true} style={{ width: '100%', justifyContent: 'center' }} />
            <Link
              to="/login"
              className="btn btn-secondary"
              onClick={() => setMobileMenuOpen(false)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="btn btn-primary"
              onClick={() => setMobileMenuOpen(false)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Style for responsive navbar switches */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-nav, .desktop-actions {
            display: none !important;
          }
          .mobile-header-actions {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
export default Navbar;
