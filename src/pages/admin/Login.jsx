import { useState } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function Login({ onLogin, onSwitch, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Nieprawidłowy email lub hasło');
      setLoading(false);
    } else if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setError('Potwierdź swój adres email przed zalogowaniem. Sprawdź skrzynkę pocztową.');
      setLoading(false);
    } else {
      onLogin();
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>Logowanie</h1>
        <p>Zaloguj się do swojego konta</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        <p className="auth-switch">
          <button onClick={() => onForgotPassword()} className="link-btn">Nie pamiętam hasła</button>
        </p>
        <p className="auth-switch">
           <button onClick={onSwitch} className="link-btn">Zarejestruj się</button>
        </p>
      </div>
    </div>
  );
}
