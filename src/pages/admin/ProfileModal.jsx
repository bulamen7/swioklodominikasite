import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

export default function ProfileModal({ user, onClose }) {
  const { language } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const t = language === 'pl' ? {
    title: 'Mój profil',
    firstName: 'Imię',
    lastName: 'Nazwisko',
    phone: 'Numer telefonu',
    loading: 'Zapisywanie...',
    submit: 'Zapisz zmiany',
    close: 'Zamknij',
    success: 'Dane zapisane!',
    error: 'Nie udało się zapisać: ',
  } : {
    title: 'My Profile',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone number',
    loading: 'Saving...',
    submit: 'Save changes',
    close: 'Close',
    success: 'Data saved!',
    error: 'Failed to save: ',
  };

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('first_name, last_name, full_name, phone').eq('id', user.id).single();
    if (data) {
      if (data.first_name) {
        setFirstName(data.first_name);
        setLastName(data.last_name || '');
      } else if (data.full_name) {
        const parts = data.full_name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      setPhone(data.phone || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const fullName = `${firstName} ${lastName}`.trim();
    const { error } = await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone,
    }).eq('id', user.id);
    if (error) { setMessage(t.error + error.message); }
    else { setMessage(t.success); setTimeout(() => onClose(), 1500); }
    setLoading(false);
  };

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
        <h3 style={{ textAlign: 'center' }}>{t.title}</h3>
        <form onSubmit={handleSubmit}>
          <label className="profile-label">Email</label>
          <input type="email" value={user.email} disabled className="profile-input disabled" />
          <label className="profile-label">{t.firstName}</label>
          <input type="text" placeholder={t.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="profile-input" />
          <label className="profile-label">{t.lastName}</label>
          <input type="text" placeholder={t.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} className="profile-input" />
          <label className="profile-label">{language === 'pl' ? 'Telefon' : 'Phone'}</label>
          <input type="tel" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} className="profile-input" />
          {message && (
            <p style={{ color: message === t.success ? '#28a745' : '#dc3545', fontSize: '0.9rem', textAlign: 'center' }}>{message}</p>
          )}
          <button type="submit" className="login-prompt-btn" style={{ width: '100%', border: 'none', cursor: 'pointer', marginTop: '1rem' }} disabled={loading}>
            {loading ? t.loading : t.submit}
          </button>
        </form>
        <button className="login-prompt-close" onClick={onClose}>{t.close}</button>
      </div>
    </div>
  );
}
