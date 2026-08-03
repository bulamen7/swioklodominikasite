import { useState } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function Register({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      if (error.message === 'User already registered') {
        setError('Ten email jest już zarejestrowany');
      } else {
        setError('Błąd rejestracji: ' + error.message);
      }
      setLoading(false);
    } else {
      // Update profile with full_name and phone
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          full_name: fullName,
          phone: phone,
        }).eq('id', user.id);
      }
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>Rejestracja udana!</h1>
          <p>Twoje konto zostało utworzone. Możesz się teraz zalogować.</p>
          <button onClick={onSwitch}>Przejdź do logowania</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>Rejestracja</h1>
        <p>Utwórz konto aby zarządzać swoimi wizytami</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Imię i nazwisko"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Telefon (opcjonalnie)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            placeholder="Hasło (min. 6 znaków)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>
        <p className="auth-switch">
          Masz już konto? <button onClick={onSwitch} className="link-btn">Zaloguj się</button>
        </p>
      </div>
    </div>
  );
}
