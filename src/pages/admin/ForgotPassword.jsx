import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

export default function ForgotPassword({ onSwitch }) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const t = language === 'pl' ? {
    title: 'Resetowanie hasła',
    subtitle: 'Podaj email powiązany z kontem',
    loading: 'Wysyłanie...',
    submit: 'Wyślij link resetujący',
    back: 'Wróć do logowania',
    sentTitle: 'Sprawdź email',
    sentMsg: 'Wysłaliśmy link do resetowania hasła na',
    sentNote: 'Sprawdź skrzynkę (i spam).',
    error: 'Nie udało się wysłać linku. Sprawdź adres email.',
  } : {
    title: 'Reset Password',
    subtitle: 'Enter the email associated with your account',
    loading: 'Sending...',
    submit: 'Send reset link',
    back: 'Back to login',
    sentTitle: 'Check your email',
    sentMsg: 'We sent a password reset link to',
    sentNote: 'Check your inbox (and spam).',
    error: 'Failed to send link. Check the email address.',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/admin`,
    });

    if (error) {
      setError(t.error);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>{t.sentTitle}</h1>
          <p>{t.sentMsg} <strong>{email}</strong>. {t.sentNote}</p>
          <button onClick={onSwitch}>{t.back}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? t.loading : t.submit}</button>
        </form>
        <p className="auth-switch">
          <button onClick={onSwitch} className="link-btn">{t.back}</button>
        </p>
      </div>
    </div>
  );
}
