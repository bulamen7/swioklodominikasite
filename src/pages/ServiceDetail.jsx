import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../config/supabase';
import BookingModal from '../components/booking/BookingModal';
import './ServiceDetail.css';

export default function ServiceDetail() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [service, setService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const serviceId = searchParams.get('id');

  const t = language === 'pl' ? {
    back: '← Powrót do cennika',
    duration: 'Czas trwania',
    price: 'Cena',
    book: 'Umów wizytę',
    variants: 'Warianty',
    login: 'Zaloguj się aby umówić wizytę',
    loginBtn: 'Zaloguj się / Zarejestruj',
    close: 'Zamknij',
  } : {
    back: '← Back to pricing',
    duration: 'Duration',
    price: 'Price',
    book: 'Book appointment',
    variants: 'Options',
    login: 'Log in to book an appointment',
    loginBtn: 'Log in / Register',
    close: 'Close',
  };

  useEffect(() => {
    if (serviceId) {
      fetch('/api/services').then(r => r.json()).then(data => {
        const found = (data.data || []).find(s => s.id === serviceId);
        setService(found);
      });
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, [serviceId]);

  const handleBook = (variant) => {
    if (isLoggedIn) {
      setSelectedVariant(variant);
      setIsModalOpen(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  if (!service) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;

  const title = language === 'pl' ? service.name_pl : service.name_en;
  const description = language === 'pl' ? service.description_pl : service.description_en;

  return (
    <div className="service-detail-page">
      <div className="service-detail-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">{language === 'pl' ? 'Strona główna' : 'Home'}</Link>
          <span>›</span>
          <Link to="/prices">{language === 'pl' ? 'Cennik' : 'Prices'}</Link>
          <span>›</span>
          <span className="breadcrumb-current">{title}</span>
        </nav>

        <h1 className="service-detail-title">{title}</h1>

        {description && (
          <p className="service-detail-description">{description}</p>
        )}

        {service.variants && service.variants.length > 0 ? (
          <div className="service-variants">
            <h3>{t.variants}</h3>
            <div className="variants-list">
              {service.variants.map(v => (
                <div key={v.id} className="variant-card">
                  <div className="variant-info">
                    <span className="variant-duration">{v.duration}</span>
                    <span className="variant-price">{v.price} zł</span>
                  </div>
                  <button className="variant-book-btn" onClick={() => handleBook(`${title} (${v.duration})`)}>
                    {t.book}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="service-single-option">
            <div className="single-option-info">
              <span>{t.duration}: <strong>{service.duration}</strong></span>
              <span>{t.price}: <strong>{service.price} zł</strong></span>
            </div>
            <button className="variant-book-btn" onClick={() => handleBook(title)}>
              {t.book}
            </button>
          </div>
        )}
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        language={language}
        preselectedService={selectedVariant || title}
      />

      {showLoginPrompt && (
        <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>{t.login}</h3>
            <a href="/admin" className="login-prompt-btn">{t.loginBtn}</a>
            <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}
