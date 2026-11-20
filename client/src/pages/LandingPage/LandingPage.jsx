import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DASHBOARD_URL } from '../../config/constants';
import HeroSection from '../../components/Hero/HeroSection';
import LiveCityOverview from '../../components/Statistics/LiveCityOverview';
import HowItWorks from '../../components/HowItWorks/HowItWorks';
import IssuesPreview from '../../components/IssuesPreview/IssuesPreview';
import EventsPreview from '../../components/EventsPreview/EventsPreview';
import WhyUrbanPulse from '../../components/Features/WhyUrbanPulse';
import CTASection from '../../components/CallToAction/CTASection';
import Modal from '../../components/Common/Modal';

export default function LandingPage({ onNavigate, onOpenLoginModal }) {
  const { user, isAuthenticated } = useAuth();
  const [modalType, setModalType] = useState(null); // 'terms' | 'privacy' | null

  return (
    <div className="up-landing-page">
      {/* Authenticated Dashboard Notification Banner */}
      {isAuthenticated && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.25), rgba(34, 211, 238, 0.25))',
          borderBottom: '1px solid rgba(34, 211, 238, 0.3)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="up-pulse-dot up-pulse-dot--green"></span>
            <span style={{ fontSize: '0.9rem', color: '#FFF' }}>
              Logged in as <strong>{user?.name}</strong> ({user?.role || 'Citizen'}).
            </span>
          </div>
          <a
            href={DASHBOARD_URL}
            className="up-btn up-btn--cyan"
            style={{ padding: '6px 16px', fontSize: '0.82rem' }}
          >
            Go to Live Dashboard ➔
          </a>
        </div>
      )}

      {/* 1. Hero */}
      <HeroSection
        onExploreMap={() => onNavigate('map')}
        onReportIssue={() => onNavigate('map')}
        onOpenLoginModal={onOpenLoginModal}
      />

      {/* 2. Live City Overview */}
      <LiveCityOverview />

      {/* 3. How UrbanPulse Works */}
      <HowItWorks />

      {/* 4. Explore Nearby Issues */}
      <IssuesPreview onExploreMap={() => onNavigate('map')} />

      {/* 5. Community Events */}
      <EventsPreview />

      {/* 6. Why UrbanPulse? */}
      <WhyUrbanPulse />

      {/* 7. Call To Action */}
      <CTASection
        onRegister={() => onNavigate('register')}
        onExplore={() => onNavigate('map')}
      />

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={modalType === 'privacy'}
        onClose={() => setModalType(null)}
        title="Privacy Policy — UrbanPulse"
      >
        <p style={{ marginBottom: '12px' }}>
          UrbanPulse respects civic privacy. Location coordinates submitted with civic reports are exclusively
          utilized to route grievance dispatches to the corresponding municipal departments.
        </p>
        <p style={{ marginBottom: '12px' }}>
          Personal identifying details are protected and never sold or shared with commercial advertising entities.
          Authentication credentials use salted cryptographic hashing.
        </p>
        <p>
          For privacy inquiries, contact your municipal data protection cell.
        </p>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        isOpen={modalType === 'terms'}
        onClose={() => setModalType(null)}
        title="Terms & Conditions — UrbanPulse"
      >
        <p style={{ marginBottom: '12px' }}>
          By accessing UrbanPulse, you agree to submit genuine civic reports and truthful information.
          Misuse of public emergency categories or falsified incident images is prohibited.
        </p>
        <p style={{ marginBottom: '12px' }}>
          Users are responsible for maintaining the confidentiality of their credentials and account access.
        </p>
        <p>
          Municipal response SLAs are managed by local administrative authorities according to ward priorities.
        </p>
      </Modal>
    </div>
  );
}
