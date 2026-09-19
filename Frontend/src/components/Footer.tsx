import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: '#050D18',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '4.5rem 0 2.5rem 0'
      }}
    >
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldCheck size={20} color="#FFFFFF" />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF'
                }}
              >
                GovEase<span style={{ color: 'var(--accent-cyan-light)' }}>AI</span>
              </span>
            </Link>

            <p style={{ fontSize: '0.925rem', color: '#94A3B8', maxWidth: '320px', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              AI-Powered Government Service Automation Platform. Simplifying citizen applications through guided workflows and human-reviewed AI assistance.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-pill)'
              }}
            >
              <GraduationCap size={13} />
              Final Year Project Prototype
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/services">Government Services</Link>
              </li>
              <li>
                <a href="/#how-it-works">How It Works</a>
              </li>
              <li>
                <a href="/#about">About & Research</a>
              </li>
            </ul>
          </div>

          {/* Core Services Links */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Services</h4>
            <ul className="footer-links">
              <li>
                <Link to="/services/trade-license">Trade License</Link>
              </li>
              <li>
                <Link to="/services/shop-registration">Shop Registration</Link>
              </li>
              <li>
                <Link to="/services/business-license">Business License</Link>
              </li>
              <li>
                <Link to="/services/building-permission">Building Permission</Link>
              </li>
              <li>
                <Link to="/services/factory-registration">Factory Registration</Link>
              </li>
              <li>
                <Link to="/services/pollution-certificate">Pollution Certificate</Link>
              </li>
            </ul>
          </div>

          {/* Portals & Sign In */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Access Portals</h4>
            <ul className="footer-links">
              <li>
                <Link to="/login">Citizen Portal Login</Link>
              </li>
              <li>
                <Link to="/officer/login">Government Officer Portal</Link>
              </li>
              <li>
                <Link to="/services">Application Status Tracker</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Prototype Disclaimer Strip */}
        <div className="footer-bottom-strip">
          <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
            © {currentYear} GovEaseAI. Final Year Academic Research Project Prototype.
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: '#94A3B8'
            }}
          >
            <span>AI-assisted</span>
            <span>•</span>
            <span>Human-reviewed</span>
            <span>•</span>
            <span>Transparent</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1.25fr 1fr;
          gap: 3rem;
          margin-bottom: 3.5rem;
        }

        .footer-heading {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 1.15rem;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .footer-links a {
          font-size: 0.88rem;
          color: #94A3B8;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .footer-links a:hover {
          color: #38BDF8;
          transform: translateX(2px);
        }

        .footer-bottom-strip {
          border-top: 1px solid rgba(148, 163, 184, 0.08);
          padding-top: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        @media (max-width: 960px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
        }

        @media (max-width: 580px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
