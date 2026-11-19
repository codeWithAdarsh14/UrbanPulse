import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import MapPage from './pages/MapPage/MapPage';
import LoginModal from './components/Auth/LoginModal';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'map' | 'events' | 'features' | 'about' | 'login' | 'register'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Scroll to top on navigation
  const handleNavigate = (page) => {
    if (page === 'login') {
      setIsLoginModalOpen(true);
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle in-page anchors if on home
    if (page === 'events') {
      const el = document.getElementById('events');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (page === 'features') {
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (page === 'about') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AuthProvider>
      <div className="up-app-root">
        {/* Sticky Glass Navbar */}
        <Navbar
          onNavigate={handleNavigate}
          activePage={currentPage}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* Dynamic Route View */}
        <main>
          {currentPage === 'home' && (
            <LandingPage
              onNavigate={handleNavigate}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
            />
          )}

          {currentPage === 'map' && (
            <MapPage onBackToHome={() => handleNavigate('home')} />
          )}

          {currentPage === 'login' && (
            <LoginPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'register' && (
            <RegisterPage onNavigate={handleNavigate} />
          )}

          {(currentPage === 'events' || currentPage === 'features' || currentPage === 'about') && (
            <LandingPage
              onNavigate={handleNavigate}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
            />
          )}
        </main>

        {/* Global Footer (hidden on dedicated full map page) */}
        {currentPage !== 'map' && (
          <Footer
            onNavigate={handleNavigate}
            onOpenModal={(type) => {
              // Could trigger modal from footer
            }}
          />
        )}

        {/* Quick Login Modal — Immediate Redirect to Dashboard */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToRegister={() => {
            setIsLoginModalOpen(false);
            setCurrentPage('register');
          }}
        />
      </div>
    </AuthProvider>
  );
}
