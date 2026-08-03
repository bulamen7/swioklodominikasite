import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function ProfileModal({ user, onClose }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();
    if (data) {
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: phone })
      .eq('id', user.id);

    if (error) {
      setMessage('Nie udalo sie zapisac: ' + error.message);
    } else {
      setMessage('Dane zapisane!');
      setTimeout(() => onClose(), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
        <h3 style={{ textAlign: 'center' }}>Moj profil</h3>
        <form onSubmit={handleSubmit}>
          <label className="profile-label">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="profile-input disabled"
          />
          <label className="profile-label">Imie i nazwisko</label>
          <input
            type="text"
            placeholder="Imie i nazwisko"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="profile-input"
          />
          <label className="profile-label">Telefon</label>
          <input
            type="tel"
            placeholder="Numer telefonu"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="profile-input"
          />
          {message && (
            <p style={{ color: message.includes('Nie') ? '#dc3545' : '#28a745', fontSize: '0.9rem', textAlign: 'center' }}>
              {message}
            </p>
          )}
          <button type="submit" className="login-prompt-btn" style={{ width: '100%', border: 'none', cursor: 'pointer', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </form>
        <button className="login-prompt-close" onClick={onClose}>Zamknij</button>
      </div>
    </div>
  );
}
