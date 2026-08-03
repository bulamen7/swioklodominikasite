import { useState } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są takie same');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError('Nie udało się zmienić hasła: ' + error.message);
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
          <h1>Hasło zmienione!</h1>
          <p>Możesz się teraz zalogować nowym hasłem.</p>
          <a href="/#/admin" className="login-card-btn">Przejdź do logowania</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>Ustaw nowe hasło</h1>
        <p>Wpisz nowe hasło dla swojego konta</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nowe hasło (min. 6 znaków)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Potwierdź nowe hasło"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zmień hasło'}
          </button>
        </form>
      </div>
    </div>
  );
}
