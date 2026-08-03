import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

export default function Navbar() {
  const { language, toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const text = {
    en: {
      home: 'Home',
      prices: 'Prices',
      about: 'About',
      contact: 'Contact',
      appointment: 'Book Appointment'
    },
    pl: {
      home: 'Strona Główna',
      prices: 'Cennik',
      about: 'O Mnie',
      contact: 'Kontakt',
      appointment: 'Umów Wizytę'
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
          <li><Link to="/prices" onClick={closeMenu}>{text[language].prices}</Link></li>
          <li><Link to="/about" onClick={closeMenu}>{text[language].about}</Link></li>
          <li><Link to="/contact" onClick={closeMenu}>{text[language].contact}</Link></li>
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
          <li><Link to="/admin" className="nav-login" onClick={closeMenu}>{language === 'pl' ? 'Zaloguj się' : 'Log in'}</Link></li>
        </ul>
      </div>
    </nav>
  );
}
