import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BookingModal from '../components/booking/BookingModal';
import { supabase } from '../config/supabase';
import './Prices.css';

export default function Prices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [bookingService, setBookingService] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const handleBookClick = (serviceName) => {
    if (isLoggedIn) {
      setBookingService(serviceName);
      setIsModalOpen(true);
    } else {
      setShowLoginPrompt(true);
    }
  };
  
  const services = [
    {
      title: "Terapia NDT Bobath",
      duration: "50 minut",
      price: "150 zł",
      description: "Terapia neurodewelopmentalna wspierająca rozwój motoryczny dzieci.",
      features: ["Indywidualny plan terapii", "Wsparcie rozwoju", "Techniki oparte na dowodach"]
    },
    {
      title: "Fizjoterapia",
      duration: "50 minut",
      price: "150 zł",
      description: "Kompleksowa fizjoterapia dostosowana do potrzeb dziecka.",
      features: ["Ocena funkcjonalna", "Ćwiczenia terapeutyczne", "Wsparcie rozwoju"]
    },
    {
      title: "Terapia Wad Postawy",
      duration: "50 minut",
      price: "150 zł",
      description: "Korekcja i terapia wad postawy u dzieci.",
      features: ["Analiza postawy", "Ćwiczenia korekcyjne", "Edukacja rodziców"]
    },
    {
      title: "Terapia Integracji Sensorycznej",
      duration: "50 minut",
      price: "150 zł",
      description: "Wsparcie dzieci w odkrywaniu świata zmysłów i pokonywaniu codziennych trudności.",
      features: ["Diagnoza sensoryczna", "Terapia SI", "Wsparcie rozwoju"]
    },
    {
      title: "Terapia Ręki",
      duration: "50 minut",
      price: "150 zł",
      description: "Specjalistyczna terapia usprawniająca funkcje ręki.",
      features: ["Ćwiczenia precyzji", "Rozwój motoryki małej", "Funkcjonalne podejście"]
    },
    {
      title: "Kinesiotaping",
      duration: "30 minut",
      price: "80 zł",
      description: "Aplikacja taśm kinesiotapingowych wspierających terapię.",
      features: ["Wsparcie mięśni", "Redukcja bólu", "Poprawa funkcji"]
    }
  ];

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
              <ul className="price-features">
                {service.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
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
