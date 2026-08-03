import { useState } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function ForgotPassword({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/admin/reset-password`,
    });

    if (error) {
      setError('Nie udało się wysłać linku. Sprawdź adres email.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>Sprawdź email</h1>
          <p>Wysłaliśmy link do resetowania hasła na <strong>{email}</strong>. Sprawdź skrzynkę (i spam).</p>
          <button onClick={onSwitch}>Wróć do logowania</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>Resetowanie hasła</h1>
        <p>Podaj email powiązany z kontem</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
          </button>
        </form>
        <p className="auth-switch">
          <button onClick={onSwitch} className="link-btn">Wróć do logowania</button>
        </p>
      </div>
    </div>
  );
}
