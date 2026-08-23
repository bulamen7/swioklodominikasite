import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Newsletter() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const t = language === 'pl' ? {
    title: 'Newsletter',
    subtitle: 'Zapisz się aby otrzymywać porady i nowości',
    placeholder: 'Twój adres email',
    button: 'Zapisz się',
    success: 'Zapisano! Dziękujemy.',
    error: 'Nie udało się zapisać. Spróbuj ponownie.',
  } : {
    title: 'Newsletter',
    subtitle: 'Subscribe to receive tips and updates',
    placeholder: 'Your email address',
    button: 'Subscribe',
    success: 'Subscribed! Thank you.',
    error: 'Failed to subscribe. Try again.',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="newsletter-section">
      <h3>{t.title}</h3>
      <p>{t.subtitle}</p>
      <form onSubmit={handleSubmit} className="newsletter-form">
        <input
          type="email"
          placeholder={t.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">{t.button}</button>
      </form>
      {status === 'success' && <p className="newsletter-msg success">{t.success}</p>}
      {status === 'error' && <p className="newsletter-msg error">{t.error}</p>}
    </div>
  );
}
