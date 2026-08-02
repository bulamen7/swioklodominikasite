import { useState } from 'react';
import './Contact.css';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Wiadomość wysłana pomyślnie!' });
        e.target.reset();
      } else {
        setSubmitStatus({ type: 'error', message: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Kontakt</h1>
        <p>Chętnie odpowiem na wszelkie pytania i umówię dogodny termin spotkania</p>
      </div>
      
      <div className="container">
        <div className="contact-content">
          <div className="contact-info-section">
            <h2>Dane Kontaktowe</h2>
            <div className="contact-item">
              <i className="icon">📞</i>
              <div>
                <strong>Telefon</strong>
                <p><a href="tel:+48797194841">+48 797 194 841</a></p>
              </div>
            </div>
            <div className="contact-item">
              <i className="icon">📍</i>
              <div>
                <strong>Adres</strong>
                <p>Warszawa, ul. Odolańska 10</p>
              </div>
            </div>
            <div className="contact-item">
              <i className="icon">✉️</i>
              <div>
                <strong>Email</strong>
                <p><a href="mailto:dzienkiewicz2@gmail.com">dzienkiewicz2@gmail.com</a></p>
              </div>
            </div>
          </div>

          <div className="map-section">
            <h2>Jak Do Nas Trafić?</h2>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2445.290941238473!2d21.01928187685396!3d52.201760159742214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471eccdf9e71a545%3A0x2c364418ccd51224!2sGabinet%20Promyk%20-%20Psycholog%2C%20logopeda%2C%20fizjoterapeuta%20dzieci%C4%99cy!5e0!3m2!1spl!2spl!4v1758408434037!5m2!1spl!2spl" 
              className="map-iframe" 
              allowFullScreen 
              title="Mapa dojazdu do gabinetu Promyk"
            ></iframe>
          </div>

          <div className="contact-form-section">
            <h2>Wyślij Wiadomość</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" name="name" placeholder="Twoje imię i nazwisko" required />
              <input type="email" name="email" placeholder="Twój adres e-mail" required />
              <textarea name="message" rows="5" placeholder="Twoja wiadomość" required></textarea>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij Wiadomość'}
              </button>
              {submitStatus && <p className={`submit-status ${submitStatus.type}`}>{submitStatus.message}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
