import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './CookieBanner.css';

export default function CookieBanner() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  const t = language === 'pl' ? {
    text: 'Ta strona używa plików cookies do analizy ruchu. Czy wyrażasz zgodę?',
    accept: 'Akceptuję',
    reject: 'Odrzucam',
  } : {
    text: 'This site uses cookies for traffic analysis. Do you consent?',
    accept: 'Accept',
    reject: 'Reject',
  };

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
    if (window.loadGA) window.loadGA();
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <p>{t.text}</p>
      <div className="cookie-buttons">
        <button className="cookie-accept" onClick={handleAccept}>{t.accept}</button>
        <button className="cookie-reject" onClick={handleReject}>{t.reject}</button>
      </div>
    </div>
  );
}
