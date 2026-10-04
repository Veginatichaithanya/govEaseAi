import React, { useEffect } from 'react';
import Lightfall from '../components/Lightfall';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ScrollExpandSection from '../components/ScrollExpandSection';
import TrustStrip from '../components/TrustStrip';
import ServicePreview from '../components/ServicePreview';
import HowItWorks from '../components/HowItWorks';
import AIAssistance from '../components/AIAssistance';
import DocumentProcessing from '../components/DocumentProcessing';
import CitizenExperience from '../components/CitizenExperience';
import OfficerExperience from '../components/OfficerExperience';
import TrackingPreview from '../components/TrackingPreview';
import ResearchSection from '../components/ResearchSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="landing-page-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        overflowX: 'hidden'
      }}
    >
      {/* Lightfall Single WebGL Ambient Canvas behind Hero and upper sections */}
      <div
        className="lightfall-background-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1400px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 1
        }}
        aria-hidden="true"
      >
        <Lightfall
          colors={isLight ? ['#2563EB', '#0891B2', '#3B82F6'] : ['#3B82F6', '#06B6D4', '#60A5FA']}
          backgroundColor={isLight ? '#F1F5F9' : '#07111F'}
          speed={0.35}
          streakCount={3}
          streakWidth={1}
          streakLength={1.2}
          glow={0.8}
          density={0.55}
          twinkle={0.6}
          zoom={3}
          backgroundGlow={0.35}
          opacity={isLight ? 0.35 : 0.55}
          mouseInteraction={true}
          mouseStrength={0.35}
          mouseRadius={0.8}
          lightMode={isLight}
        />

        {/* Readability Gradient Vignette Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isLight
              ? 'radial-gradient(circle at 50% 30%, rgba(241, 245, 249, 0.35) 0%, rgba(241, 245, 249, 0.88) 70%, #F1F5F9 100%)'
              : 'radial-gradient(circle at 50% 30%, rgba(7, 17, 31, 0.25) 0%, rgba(7, 17, 31, 0.78) 70%, #07111F 100%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Fixed Navigation Bar */}
      <Navbar />

      {/* Main Landing Page Flow */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. ScrollExpand Interactive Workflow Presentation */}
        <ScrollExpandSection />

        {/* 3. Trust Strip */}
        <TrustStrip />

        {/* 3. Government Services Directory Preview */}
        <ServicePreview />

        {/* 4. 6-Step End-to-End Workflow */}
        <HowItWorks />

        {/* 5. AI That Assists — Not Decides */}
        <AIAssistance />

        {/* 6. Document Processing OCR & Verification Demonstration */}
        <DocumentProcessing />

        {/* 7. Citizen Experience Journey */}
        <CitizenExperience />

        {/* 8. Officer Experience & Discretionary Review */}
        <OfficerExperience />

        {/* 9. Application Tracking Timeline Preview */}
        <TrackingPreview />

        {/* 10. Final-Year Academic Research Scope */}
        <ResearchSection />

        {/* 11. Closing Call-to-Action */}
        <CTASection />
      </main>

      {/* Platform Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
