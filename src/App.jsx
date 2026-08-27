import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TopBar from './components/TopBar';
import ScrollToTop from './components/ScrollToTop';
import CookieBanner from './components/CookieBanner';
import WhatsAppButton from './components/WhatsAppButton';
import { ToastProvider } from './components/Toast';
import ResetPassword from './pages/admin/ResetPassword';
import { supabase } from './config/supabase';

// Lazy load pages — only downloaded when user navigates to them
const HomeEN = lazy(() => import('./pages_en/Home'));
const PricesEN = lazy(() => import('./pages_en/Prices'));
const AboutEN = lazy(() => import('./pages_en/About'));
const ContactEN = lazy(() => import('./pages_en/Contact'));
const HomePL = lazy(() => import('./pages_pl/Home'));
const PricesPL = lazy(() => import('./pages_pl/Prices'));
const AboutPL = lazy(() => import('./pages_pl/About'));
const ContactPL = lazy(() => import('./pages_pl/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));

const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function NotFound() {
  const { language } = useLanguage();
  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-light)',
    }}>
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none" style={{ marginBottom: '2rem', opacity: 0.8 }}>
        <circle cx="100" cy="80" r="60" fill="var(--primary-color)" opacity="0.1"/>
        <path d="M60 95 L80 55 L100 95 Z" fill="var(--primary-color)" opacity="0.3"/>
        <path d="M100 95 L120 55 L140 95 Z" fill="var(--secondary-color)" opacity="0.3"/>
        <circle cx="100" cy="50" r="8" fill="var(--accent-color)" opacity="0.6"/>
        <path d="M70 110 Q100 130 130 110" stroke="var(--primary-color)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <text x="100" y="85" textAnchor="middle" fontSize="36" fontWeight="700" fill="var(--primary-color)" fontFamily="var(--font-heading)">404</text>
      </svg>
      <h1 style={{
        fontFamily: 'var(--font-heading)',
        color: 'var(--primary-color)',
        fontSize: '1.8rem',
        marginBottom: '0.75rem',
      }}>
        {language === 'pl' ? 'Ups! Strona nie istnieje' : 'Oops! Page not found'}
      </h1>
      <p style={{
        color: 'var(--text-light)',
        fontSize: '1.05rem',
        marginBottom: '2rem',
        maxWidth: '400px',
        lineHeight: '1.6',
      }}>
        {language === 'pl'
          ? 'Wygląda na to, że ta strona nie istnieje lub została przeniesiona.'
          : 'It looks like this page doesn\'t exist or has been moved.'}
      </p>
      <a href="/" style={{
        display: 'inline-block',
        background: 'var(--primary-color)',
        color: 'var(--white)',
        padding: '0.8rem 2rem',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'background 0.2s, transform 0.2s',
      }}>
        {language === 'pl' ? '← Wróć na stronę główną' : '← Back to homepage'}
      </a>
    </div>
  );
}

function PageLoader() {
  return <div style={{ textAlign: 'center', padding: '4rem' }}></div>;
}

function AppContent() {
  const { language } = useLanguage();
  
  const Home = language === 'en' ? HomeEN : HomePL;
  const Prices = language === 'en' ? PricesEN : PricesPL;
  const About = language === 'en' ? AboutEN : AboutPL;
  const Contact = language === 'en' ? ContactEN : ContactPL;
  
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/service" element={<ServiceDetail />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
      <TopBar />
      <WhatsAppButton />
      <CookieBanner />
    </>
  );
}

export default function App() {
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    const fullUrl = window.location.href;
    if (fullUrl.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setRecoveryReady(true);
      }
    });

    if (fullUrl.includes('type=recovery')) {
      setTimeout(() => setRecoveryReady(true), 1500);
    }

    return () => subscription.unsubscribe();
  }, []);

  if (isRecovery && recoveryReady) {
    return <ResetPassword onDone={() => { setIsRecovery(false); window.location.hash = '/admin'; }} />;
  }

  if (isRecovery && !recoveryReady) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  }

  return (
    <LanguageProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}
