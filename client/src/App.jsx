import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import MapPage from './pages/MapPage/MapPage';
import LoginModal from './components/Auth/LoginModal';
import AuthGate from './components/Auth/AuthGate';
import OperationsConsole from './components/Console/OperationsConsole';
import './landing.css';
import './App.css';

/**
 * Route resolution helper from window.location.pathname
 */
function getInitialPage() {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  if (path === '/app' || path === '/dashboard') return 'app';
  if (path === '/login') return 'login';
  if (path === '/register') return 'register';
  if (path === '/map') return 'map';
  if (path === '/events') return 'events';
  if (path === '/features') return 'features';
  if (path === '/about') return 'about';
  return 'home';
}

function UrbanPulseRouter() {
  const { user, isAuthenticated, loading, logout, updateUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync route with browser History API (pushState)
  const navigate = useCallback((page) => {
    if (page === 'loginModal') {
      setIsLoginModalOpen(true);
      return;
    }

    let path = '/';
    if (page === 'app' || page === 'dashboard') path = '/app';
    else if (page === 'login') path = '/login';
    else if (page === 'register') path = '/register';
    else if (page === 'map') path = '/map';
    else if (page === 'events') path = '/events';
    else if (page === 'features') path = '/features';
    else if (page === 'about') path = '/about';

    if (window.location.pathname !== path) {
      window.history.pushState({ page }, '', path);
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle in-page anchors on home
    if (page === 'events') {
      setTimeout(() => {
        const el = document.getElementById('events');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (page === 'features') {
      setTimeout(() => {
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (page === 'about') {
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Protected Route: Operations Console (/app) ──
  if (currentPage === 'app') {
    if (loading) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080B18',
          color: '#22D3EE',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '38px',
              height: '38px',
              border: '3px solid rgba(34, 211, 238, 0.2)',
              borderTopColor: '#22D3EE',
              borderRadius: '50%',
              animation: 'upSpin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <style>{`@keyframes upSpin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>Verifying Security Clearance...</p>
          </div>
        </div>
      );
    }

    // Authorization Guard: Only open main app when user is authorized
    if (!isAuthenticated) {
      return (
        <div className="up-app-auth-wrapper">
          <AuthGate
            onLoginSuccess={(authedUser) => {
              navigate('app');
            }}
          />
        </div>
      );
    }

    // Authorized User: Render full 3-panel Operations Console
    return (
      <OperationsConsole
        user={user}
        onLogout={() => {
          logout();
          navigate('home');
        }}
        onExitToLanding={() => navigate('home')}
        onUpdateUser={updateUser}
      />
    );
  }

  // ── Public Routes: Landing Page, Map, Login, Register ──
  return (
    <div className="up-app-root">
      {/* Sticky Glass Navbar */}
      <Navbar
        onNavigate={navigate}
        activePage={currentPage}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Dynamic View */}
      <main>
        {(currentPage === 'home' || currentPage === 'events' || currentPage === 'features' || currentPage === 'about') && (
          <LandingPage
            onNavigate={navigate}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {currentPage === 'map' && (
          <MapPage onBackToHome={() => navigate('home')} />
        )}

        {currentPage === 'login' && (
          <LoginPage onNavigate={navigate} />
        )}

        {currentPage === 'register' && (
          <RegisterPage onNavigate={navigate} />
        )}
      </main>

      {/* Global Footer (hidden on dedicated full map page) */}
      {currentPage !== 'map' && (
        <Footer onNavigate={navigate} />
      )}

      {/* Quick Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          navigate('register');
        }}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          navigate('app');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UrbanPulseRouter />
    </AuthProvider>
  );
}
