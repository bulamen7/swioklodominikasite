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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t.errorAuth);
      setLoading(false);
    } else if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setError(t.errorConfirm);
      setLoading(false);
    } else {
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
