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
    });
    // Fetch services (includes variants)
    fetch('/api/services').then(r => r.json()).then(data => {
      setServices((data.data || []).map(s => ({
        id: s.id,
        title: s.name_en,
        duration: s.duration,
        price: s.price + ' zł',
        description: s.description_en || '',
        variants: s.variants || [],
      })));
    }).catch(() => {});
  }, []);

  // Watch for ?book= param (from navbar dropdown)
  useEffect(() => {
    const bookParam = searchParams.get('book');
    if (bookParam) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setBookingService(decodeURIComponent(bookParam));
          setIsModalOpen(true);
        } else {
          setShowLoginPrompt(true);
        }
        setSearchParams({});
      });
    }
  }, [searchParams]);

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
        <h1>Our Services & Pricing</h1>
        <p>Choose the service that best fits your needs. All sessions are by appointment only.</p>
      </div>
      
      <div className="container">
        <div className="prices-grid">
          {services.map((service, index) => (
            <div key={index} className="price-card">
              <div className="price-card-header">
                <h3>{service.title}</h3>
                <span className="duration">{service.duration}</span>
              </div>
              {service.variants && service.variants.length > 0 ? (
                <div className="price-variants">
                  {service.variants.map(v => (
                    <div key={v.id} className="variant-row">
                      <span className="variant-duration">{v.duration}</span>
                      <span className="variant-price">{v.price} zł</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="price-amount">{service.price}</div>
              )}
              <p className="price-description">{service.description}</p>
              <button className="book-button book-button-pulse" onClick={() => handleBookClick(service.title)}>Book Now</button>
            </div>
          ))}
        </div>
        
        <div className="pricing-note">
          <h3>Payment & Insurance</h3>
          <p>We accept most major insurance plans. Please contact us to verify your coverage. Self-pay options and sliding scale fees available upon request.</p>
        </div>
      </div>
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} language="en" preselectedService={bookingService} />
      {showLoginPrompt && (
        <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Log in to book an appointment</h3>
            <p>You need an account to reserve a time slot.</p>
            <Link to="/admin" className="login-prompt-btn">Log in / Register</Link>
            <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
