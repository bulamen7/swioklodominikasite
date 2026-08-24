import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BookingModal from '../components/booking/BookingModal';
import { supabase } from '../config/supabase';
import './Prices.css';

export default function Prices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [bookingService, setBookingService] = useState('');
  const [services, setServices] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);

      // Auto-open booking if ?book= param present
      const bookParam = searchParams.get('book');
      if (bookParam) {
        if (session) {
          setBookingService(decodeURIComponent(bookParam));
          setIsModalOpen(true);
        } else {
          setShowLoginPrompt(true);
        }
        setSearchParams({});
      }
    });
    // Fetch services from API
    fetch('/api/services').then(r => r.json()).then(data => {
      setServices((data.data || []).map(s => ({
        title: s.name_pl,
        duration: s.duration,
        price: s.price + ' zł',
        description: s.description_pl || '',
      })));
    }).catch(() => {});
  }, []);

  const handleBookClick = (serviceName) => {
    if (isLoggedIn) {
      setBookingService(serviceName);
      setIsModalOpen(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <div className="prices-page">
      <div className="prices-header">
        <h1>Oferta i Cennik</h1>
        <p>Wybierz usługę najlepiej dopasowaną do Twoich potrzeb. Wszystkie wizyty wymagają wcześniejszego umówienia.</p>
      </div>
      
      <div className="container">
        <div className="prices-grid">
          {services.map((service, index) => (
            <div key={index} className="price-card">
              <div className="price-card-header">
                <h3>{service.title}</h3>
                <span className="duration">{service.duration}</span>
              </div>
              <div className="price-amount">{service.price}</div>
              <p className="price-description">{service.description}</p>
              <button className="book-button" onClick={() => handleBookClick(service.title)}>Umów Wizytę</button>
            </div>
          ))}
        </div>
        
        <div className="pricing-note">
          <h3>Płatności i Ubezpieczenia</h3>
          <p>Akceptujemy większość głównych planów ubezpieczeniowych. Skontaktuj się z nami, aby zweryfikować swoje ubezpieczenie. Dostępne opcje płatności prywatnej i ruchoma skala opłat na życzenie.</p>
        </div>
      </div>
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} language="pl" preselectedService={bookingService} />
      {showLoginPrompt && (
        <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Zaloguj się aby umówić wizytę</h3>
            <p>Musisz mieć konto, aby zarezerwować termin.</p>
            <Link to="/admin" className="login-prompt-btn">Zaloguj się / Zarejestruj</Link>
            <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>Zamknij</button>
          </div>
        </div>
      )}
    </div>
  );
}
