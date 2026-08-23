import { useState } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Detect language from localStorage (LanguageProvider may not be available here)
  const lang = localStorage.getItem('preferredLanguage') || (navigator.language.startsWith('pl') ? 'pl' : 'en');

  const t = lang === 'pl' ? {
    title: 'Ustaw nowe hasło',
    subtitle: 'Wpisz nowe hasło dla swojego konta',
    newPassword: 'Nowe hasło (min. 6 znaków)',
    confirm: 'Potwierdź nowe hasło',
    loading: 'Zapisywanie...',
    submit: 'Zmień hasło',
    successTitle: 'Hasło zmienione!',
    successMsg: 'Możesz się teraz zalogować nowym hasłem.',
    goToLogin: 'Przejdź do logowania',
    errorShort: 'Hasło musi mieć minimum 6 znaków',
    errorMatch: 'Hasła nie są takie same',
    errorGeneric: 'Nie udało się zmienić hasła: ',
  } : {
    title: 'Set New Password',
    subtitle: 'Enter a new password for your account',
    newPassword: 'New password (min. 6 characters)',
    confirm: 'Confirm new password',
    loading: 'Saving...',
    submit: 'Change Password',
    successTitle: 'Password changed!',
    successMsg: 'You can now log in with your new password.',
    goToLogin: 'Go to login',
    errorShort: 'Password must be at least 6 characters',
    errorMatch: 'Passwords do not match',
    errorGeneric: 'Failed to change password: ',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) { setError(t.errorShort); return; }
    if (password !== confirmPassword) { setError(t.errorMatch); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(t.errorGeneric + error.message);
    } else {
      localStorage.removeItem('password_recovery');
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>{t.successTitle}</h1>
          <p>{t.successMsg}</p>
          <button onClick={onDone || (() => { window.location.href = '/admin'; })} className="login-card-btn" style={{ border: 'none', cursor: 'pointer' }}>
            {t.goToLogin}
          </button>
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
          <input type="password" placeholder={t.newPassword} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="password" placeholder={t.confirm} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? t.loading : t.submit}</button>
        </form>
      </div>
    </div>
  );
}
