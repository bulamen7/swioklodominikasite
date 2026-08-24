import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../config/supabase';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

export default function Navbar() {
  const { language, toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [services, setServices] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Fetch services for dropdown
    fetch('/api/services').then(r => r.json()).then(data => {
      setServices(data.data || []);
    }).catch(() => {});

    // Fetch posts for dropdown
    fetch('/api/posts').then(r => r.json()).then(data => {
      setPosts(data.data || []);
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const text = {
    en: {
      home: 'Home',
      about: 'About',
      prices: 'Prices',
      contact: 'Contact',
      appointment: 'Book Appointment',
      login: 'Log in',
      myAccount: 'My Account',
    },
    pl: {
      home: 'Home',
      about: 'O Mnie',
      prices: 'Cennik',
      contact: 'Kontakt',
      appointment: 'Umów Wizytę',
      login: 'Zaloguj się',
      myAccount: 'Moje Konto',
    }
  };

  const closeMenu = () => setMenuOpen(false);
  
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>Dominika Świokło</Link>
        <button
          className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-menu ${menuOpen ? 'nav-menu--open' : ''}`}>
          <li><Link to="/" onClick={closeMenu}>{text[language].home}</Link></li>
          <li><Link to="/about" onClick={closeMenu}>{text[language].about}</Link></li>
          <li className="nav-dropdown">
            <Link to="/blog" onClick={closeMenu}>Blog</Link>
            {posts.length > 0 && (
              <ul className="dropdown-menu">
                {posts.slice(0, 5).map(p => (
                  <li key={p.id}>
                    <Link to="/blog" onClick={closeMenu}>
                      {language === 'pl' ? p.title_pl : p.title_en}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className="nav-dropdown">
            <Link to="/prices" onClick={closeMenu}>{text[language].prices}</Link>
            {services.length > 0 && (
              <ul className="dropdown-menu">
                {services.map(s => (
                  <li key={s.id}>
                    <Link to={`/prices?book=${encodeURIComponent(language === 'pl' ? s.name_pl : s.name_en)}`} onClick={closeMenu}>
                      <span>{language === 'pl' ? s.name_pl : s.name_en}</span>
                      <span className="dropdown-price">{s.price} zł</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className="nav-dropdown">
            <Link to="/contact" onClick={closeMenu}>{text[language].contact}</Link>
            <ul className="dropdown-menu">
              <li><a href="tel:+48797194841">📞 +48 797 194 841</a></li>
              <li><a href="mailto:dzienkiewicz2@gmail.com">✉️ dzienkiewicz2@gmail.com</a></li>
              <li><span>📍 Warszawa, ul. Odolańska 10</span></li>
            </ul>
          </li>
          <li><Link to="/prices" className="nav-cta" onClick={closeMenu}>{text[language].appointment}</Link></li>
          <li className="lang-switcher">
            <button 
              onClick={() => toggleLanguage('en')} 
              className={language === 'en' ? 'active' : ''}
            >
              EN
            </button>
            <span>|</span>
            <button 
              onClick={() => toggleLanguage('pl')} 
              className={language === 'pl' ? 'active' : ''}
            >
             PL
            </button>
          </li>
          <li><ThemeToggle /></li>
          <li>
            <Link to="/admin" className="nav-login" onClick={closeMenu}>
              {isLoggedIn ? text[language].myAccount : text[language].login}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
