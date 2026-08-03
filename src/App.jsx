import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminApp from './pages/admin/AdminApp';
import ResetPassword from './pages/admin/ResetPassword';
import { supabase } from './config/supabase';
import HomeEN from './pages_en/Home';
import PricesEN from './pages_en/Prices';
import AboutEN from './pages_en/About';
import ContactEN from './pages_en/Contact';
import AppointmentEN from './pages_en/Appointment';
import HomePL from './pages_pl/Home';
import PricesPL from './pages_pl/Prices';
import AboutPL from './pages_pl/About';
import ContactPL from './pages_pl/Contact';
import AppointmentPL from './pages_pl/Appointment';

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

function AppContent() {
  const { language } = useLanguage();
  
  const Home = language === 'en' ? HomeEN : HomePL;
  const Prices = language === 'en' ? PricesEN : PricesPL;
  const About = language === 'en' ? AboutEN : AboutPL;
  const Contact = language === 'en' ? ContactEN : ContactPL;
  const Appointment = language === 'en' ? AppointmentEN : AppointmentPL;
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    // Detect recovery token in URL
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

    // Give Supabase a moment to process the token
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
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}
