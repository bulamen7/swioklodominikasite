import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TopBar from './components/TopBar';
import CookieBanner from './components/CookieBanner';
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

const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function NotFound() {
  const { language } = useLanguage();
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1>404</h1>
      <p>{language === 'pl' ? 'Strona nie została znaleziona.' : 'Page not found.'}</p>
      <a href="/">{language === 'pl' ? 'Wróć na stronę główną' : 'Go back home'}</a>
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
      <TopBar />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
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
