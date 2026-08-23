import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

export default function Register({ onSwitch }) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = language === 'pl' ? {
    title: 'Rejestracja',
    subtitle: 'Utwórz konto aby zarządzać swoimi wizytami',
    firstName: 'Imię',
    lastName: 'Nazwisko',
    phone: 'Telefon (opcjonalnie)',
    password: 'Hasło (min. 6 znaków)',
    loading: 'Rejestracja...',
    submit: 'Zarejestruj się',
    hasAccount: 'Masz już konto?',
    login: 'Zaloguj się',
    successTitle: 'Rejestracja udana!',
    successMsg: 'Sprawdź email i potwierdź konto aby się zalogować.',
    goToLogin: 'Przejdź do logowania',
    errorShort: 'Hasło musi mieć minimum 6 znaków',
    errorName: 'Imię i nazwisko są wymagane',
    errorExists: 'Ten email jest już zarejestrowany',
    errorGeneric: 'Błąd rejestracji: ',
  } : {
    title: 'Register',
    subtitle: 'Create an account to manage your appointments',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone (optional)',
    password: 'Password (min. 6 characters)',
    loading: 'Registering...',
    submit: 'Sign Up',
    hasAccount: 'Already have an account?',
    login: 'Log in',
    successTitle: 'Registration successful!',
    successMsg: 'Check your email and confirm your account to log in.',
    goToLogin: 'Go to login',
    errorShort: 'Password must be at least 6 characters',
    errorName: 'First and last name are required',
    errorExists: 'This email is already registered',
    errorGeneric: 'Registration error: ',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!firstName || !lastName) {
      setError(t.errorName);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t.errorShort);
      setLoading(false);
      return;
    }

    const fullName = `${firstName} ${lastName}`;

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, first_name: firstName, last_name: lastName, phone } },
    });

    if (error) {
      setError(error.message === 'User already registered' ? t.errorExists : t.errorGeneric + error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>{t.successTitle}</h1>
          <p>{t.successMsg}</p>
          <button onClick={onSwitch}>{t.goToLogin}</button>
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
          <input type="text" placeholder={t.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <input type="text" placeholder={t.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="tel" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? t.loading : t.submit}</button>
        </form>
        <p className="auth-switch">
          {t.hasAccount} <button onClick={onSwitch} className="link-btn">{t.login}</button>
        </p>
      </div>
    </div>
  );
}
