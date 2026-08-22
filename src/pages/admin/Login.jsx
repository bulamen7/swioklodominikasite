import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

export default function Login({ onLogin, onSwitch, onForgotPassword }) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);

  const t = language === 'pl' ? {
    title: 'Logowanie',
    subtitle: 'Zaloguj się do swojego konta',
    password: 'Hasło',
    loading: 'Logowanie...',
    submit: 'Zaloguj się',
    forgot: 'Nie pamiętam hasła',
    register: 'Zarejestruj się',
    errorAuth: 'Nieprawidłowy email lub hasło',
    errorConfirm: 'Potwierdź swój adres email przed zalogowaniem. Sprawdź skrzynkę pocztową.',
  } : {
    title: 'Log In',
    subtitle: 'Sign in to your account',
    password: 'Password',
    loading: 'Logging in...',
    submit: 'Log In',
    forgot: 'Forgot password',
    register: 'Sign up',
    errorAuth: 'Invalid email or password',
    errorConfirm: 'Please confirm your email address before logging in. Check your inbox.',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if locked
    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(language === 'pl'
        ? `Za dużo prób. Spróbuj za ${remaining}s.`
        : `Too many attempts. Try again in ${remaining}s.`);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 60000); // 1 minute lockout
        setError(language === 'pl'
          ? 'Za dużo prób. Konto zablokowane na 60 sekund.'
          : 'Too many attempts. Account locked for 60 seconds.');
        setTimeout(() => { setAttempts(0); setLockedUntil(null); }, 60000);
      } else {
        setError(t.errorAuth);
      }
      setLoading(false);
    } else if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setError(t.errorConfirm);
      setLoading(false);
    } else {
      setAttempts(0);
      onLogin();
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? t.loading : t.submit}</button>
        </form>
        <p className="auth-switch">
          <button onClick={() => onForgotPassword()} className="link-btn">{t.forgot}</button>
        </p>
        <p className="auth-switch">
          <button onClick={onSwitch} className="link-btn">{t.register}</button>
        </p>
      </div>
    </div>
  );
}
