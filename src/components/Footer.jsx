import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

export default function Footer() {
  const { language } = useLanguage();

  const text = {
    en: {
      about: 'About',
      links: 'Quick Links',
      contact: 'Contact',
      home: 'Home',
      prices: 'Prices',
      aboutPage: 'About Me',
      contactPage: 'Contact',
      appointment: 'Book Appointment',
      address: 'Warsaw, ul. Odolańska 10',
      rights: 'All rights reserved.',
    },
    pl: {
      about: 'O Gabinecie',
      links: 'Nawigacja',
      contact: 'Kontakt',
      home: 'Strona Główna',
      prices: 'Cennik',
      aboutPage: 'O Mnie',
      contactPage: 'Kontakt',
      appointment: 'Umów Wizytę',
      address: 'Warszawa, ul. Odolańska 10',
      rights: 'Wszelkie prawa zastrzeżone.',
    },
  };

  const t = text[language];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Dominika Świokło</h3>
          <p>{t.address}</p>
          <p><a href="tel:+48797194841">+48 797 194 841</a></p>
          <p><a href="mailto:dzienkiewicz2@gmail.com">dzienkiewicz2@gmail.com</a></p>
        </div>

        <div className="footer-section">
          <h3>{t.links}</h3>
          <Link to="/">{t.home}</Link>
          <Link to="/prices">{t.prices}</Link>
          <Link to="/about">{t.aboutPage}</Link>
          <Link to="/contact">{t.contactPage}</Link>
          <Link to="/prices">{t.appointment}</Link>
        </div>

        <div className="footer-section">
          <h3>{t.contact}</h3>
          <p>{t.address}</p>
          <p><a href="tel:+48797194841">+48 797 194 841</a></p>
          <p><a href="mailto:dzienkiewicz2@gmail.com">dzienkiewicz2@gmail.com</a></p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Dominika Świokło. {t.rights}</p>
        <Link to="/admin" className="admin-link">Admin</Link>
      </div>
    </footer>
  );
}
