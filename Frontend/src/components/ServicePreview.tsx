import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Layers
} from 'lucide-react';
import { MOCK_SERVICES } from '../mock/services';

const iconMap = {
  Building,
  Store,
  Briefcase,
  Hammer,
  Factory,
  ShieldCheck
};

export const ServicePreview: React.FC = () => {
  return (
    <section id="services" className="section-wrapper" style={{ position: 'relative', zIndex: 10 }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Layers size={13} />
            SERVICE DIRECTORY
          </div>
          <h2>Government Services</h2>
          <p className="section-subtitle">
            Explore common services and understand what you need before starting an application.
          </p>
        </div>

        {/* 6 Service Cards Grid */}
        <div className="grid-3" style={{ marginBottom: '3rem' }}>
          {MOCK_SERVICES.map((service) => {
            const IconComponent = iconMap[service.iconName] || Building;

            return (
              <div
                key={service.id}
                className="glass-panel service-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '2rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top Subtle Accent Bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 100%)',
                    opacity: 0.8
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-blue-light)'
                      }}
                    >
                      <IconComponent size={22} strokeWidth={2} />
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: '#64748B',
                        background: 'rgba(148, 163, 184, 0.08)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px'
                      }}
                    >
                      {service.category}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.25rem',
                      marginBottom: '0.35rem',
                      color: '#FFFFFF'
                    }}
                  >
                    {service.name}
                  </h3>

                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-cyan-light)',
                      marginBottom: '0.9rem'
                    }}
                  >
                    {service.department}
                  </div>

                  <p
                    style={{
                      fontSize: '0.925rem',
                      color: '#94A3B8',
                      lineHeight: 1.55,
                      marginBottom: '1.5rem'
                    }}
                  >
                    {service.shortDescription}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                    paddingTop: '1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: '#64748B'
                    }}
                  >
                    Est. {service.processingTime || service.estimatedTime}
                  </span>

                  <Link
                    to={`/services/${service.id}`}
                    className="service-link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--accent-blue-light)',
                      transition: 'gap 0.2s ease, color 0.2s ease'
                    }}
                  >
                    View Details <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Services CTA Button */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/services"
            className="btn btn-secondary"
            style={{
              padding: '0.85rem 2rem',
              fontSize: '1rem',
              gap: '0.65rem'
            }}
          >
            View All Services <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <style>{`
        .service-card:hover .service-link {
          gap: 0.6rem !important;
          color: var(--accent-cyan-light) !important;
        }
      `}</style>
    </section>
  );
};

export default ServicePreview;
