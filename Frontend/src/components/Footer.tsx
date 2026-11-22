import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="platform-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link
              to="/"
              className="footer-brand-link"
            >
              <div className="footer-brand-icon">
                <ShieldCheck size={20} color="#FFFFFF" />
              </div>
              <span className="footer-brand-title">
                GovEase<span style={{ color: 'var(--accent-cyan-light)' }}>AI</span>
              </span>
            </Link>

            <p className="footer-brand-desc">
              AI-Powered Government Service Automation Platform. Simplifying citizen applications through guided workflows and human-reviewed AI assistance.
            </p>

            <div className="footer-prototype-pill">
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
          <div className="footer-copyright">
            © {currentYear} GovEaseAI. Final Year Academic Research Project Prototype.
          </div>

          <div className="footer-trust-tags">
            <span>AI-assisted</span>
            <span>•</span>
            <span>Human-reviewed</span>
            <span>•</span>
            <span>Transparent</span>
          </div>
        </div>
      </div>

      <style>{`
        .platform-footer {
          position: relative;
          z-index: 10;
          background-color: #050D18;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          padding: 4.5rem 0 2.5rem 0;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }

        .footer-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          margin-bottom: 1rem;
        }

        .footer-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-brand-title {
          font-family: var(--font-display);
          font-weight: 800;
          fontSize: 1.25rem;
          letterSpacing: -0.03em;
          color: #FFFFFF;
        }

        .footer-brand-desc {
          font-size: 0.925rem;
          color: #94A3B8;
          max-width: 320px;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }

        .footer-prototype-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: #38BDF8;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-pill);
        }

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

        .footer-copyright {
          font-size: 0.825rem;
          color: #64748B;
        }

        .footer-trust-tags {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: #94A3B8;
        }

        /* Light Mode Specific Overrides */
        [data-theme="light"] .platform-footer {
          background-color: #FFFFFF !important;
          border-top-color: #E2E8F0 !important;
        }

        [data-theme="light"] .footer-brand-title {
          color: #0F172A !important;
        }

        [data-theme="light"] .footer-brand-desc {
          color: #475569 !important;
        }

        [data-theme="light"] .footer-heading {
          color: #0F172A !important;
        }

        [data-theme="light"] .footer-links a {
          color: #475569 !important;
        }

        [data-theme="light"] .footer-links a:hover {
          color: #0284C7 !important;
        }

        [data-theme="light"] .footer-prototype-pill {
          background: #EFF6FF !important;
          border-color: #BFDBFE !important;
          color: #2563EB !important;
        }

        [data-theme="light"] .footer-bottom-strip {
          border-top-color: #E2E8F0 !important;
        }

        [data-theme="light"] .footer-copyright {
          color: #64748B !important;
        }

        [data-theme="light"] .footer-trust-tags {
          color: #475569 !important;
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
