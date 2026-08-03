import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import ProfileModal from './ProfileModal';
import './Admin.css';

export default function PatientDashboard({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchMyBookings();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data);
  };

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings`);
      const data = await response.json();
      // Filter to only show this user's bookings
      const myBookings = (data.data || []).filter(
        (b) => b.client_email === user.email
      );
      setBookings(myBookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');

    if (!currentPassword) {
      setPasswordMsg('Podaj aktualne hasło');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Nowe hasło musi mieć minimum 6 znaków');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Hasła nie są takie same');
      return;
    }

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordMsg('Aktualne hasło jest nieprawidłowe');
      return;
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg('Błąd: ' + error.message);
    } else {
      setPasswordMsg('Hasło zmienione!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePassword(false), 2000);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Czy na pewno chcesz anulować tę wizytę?')) return;

    const response = await fetch(`/api/bookings?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (response.ok) {
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    }
  };

  const statusLabels = {
    pending: 'Oczekująca',
    confirmed: 'Potwierdzona',
    cancelled: 'Anulowana',
    completed: 'Zakończona',
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Moje Wizyty</h1>
        <div className="header-right">
          <span className="user-email">{profile?.full_name || user.email}</span>
          <button className="change-password-btn" onClick={() => setShowProfile(true)}>Profil</button>
          <button className="change-password-btn" onClick={() => setShowChangePassword(true)}>Zmien haslo</button>
          <button className="logout-btn" onClick={handleLogout}>Wyloguj</button>
        </div>
      </header>

      <main className="admin-content">
        <div className="bookings-list">
          {loading ? (
            <p className="loading-text">Ładowanie...</p>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">Nie masz jeszcze żadnych rezerwacji</p>
              <p className="empty-subtext">Umów wizytę przez kalendarz na stronie głównej</p>
            </div>
          ) : (
            <div className="patient-bookings">
              {bookings.map((booking) => (
                <div key={booking.id} className={`patient-booking-card status-card-${booking.status}`}>
                  <div className="booking-date">
                    <strong>{booking.date}</strong>
                    <span>{booking.time_slot}</span>
                  </div>
                  <div className="booking-details">
                    <p className="booking-service">{booking.service || 'Wizyta'}</p>
                    <span className={`status-pill status-${booking.status}`}>
                      {statusLabels[booking.status] || booking.status}
                    </span>
                    {booking.status === 'pending' && (
                      <button className="cancel-btn" onClick={() => handleCancel(booking.id)}>
                        Anuluj
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <a href={`/api/invoice?id=${booking.id}`} className="invoice-btn" target="_blank" rel="noopener noreferrer">
                        Faktura
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {showChangePassword && (
        <div className="login-prompt-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Zmień hasło</h3>
            <form onSubmit={handleChangePassword}>
              <input
                type="password"
                placeholder="Aktualne hasło"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              />
              <input
                type="password"
                placeholder="Nowe hasło (min. 6 znaków)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              />
              <input
                type="password"
                placeholder="Powtórz nowe hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              />
              {passwordMsg && <p style={{ color: passwordMsg.includes('zmienione') ? '#28a745' : '#dc3545', fontSize: '0.9rem' }}>{passwordMsg}</p>}
              <button type="submit" className="login-prompt-btn" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>Zmień hasło</button>
            </form>
            <button className="login-prompt-close" onClick={() => setShowChangePassword(false)}>Zamknij</button>
          </div>
        </div>
      )}

      {showProfile && (
        <ProfileModal user={user} onClose={() => { setShowProfile(false); fetchProfile(); }} />
      )}
    </div>
  );
}
