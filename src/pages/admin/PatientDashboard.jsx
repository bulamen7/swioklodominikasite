import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { authFetch } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';
import ProfileModal from './ProfileModal';
import './Admin.css';

export default function PatientDashboard({ user, onLogout }) {
  const { language } = useLanguage();
  const t = language === 'pl' ? {
    myVisits: 'Moje Wizyty',
    profile: 'Profil',
    changePassword: 'Zmien haslo',
    logout: 'Wyloguj',
    loading: 'Ładowanie...',
    noBookings: 'Nie masz jeszcze żadnych rezerwacji',
    noBookingsHint: 'Umów wizytę przez kalendarz na stronie głównej',
    visit: 'Wizyta',
    cancel: 'Anuluj',
    invoice: 'Faktura',
    addReview: 'Dodaj opinię',
    reviewTitle: 'Dodaj opinię',
    reviewPlaceholder: 'Napisz swoją opinię...',
    reviewRating: 'Ocena',
    reviewSubmit: 'Wyślij opinię',
    reviewSent: 'Opinia wysłana do akceptacji!',
    reviewClose: 'Zamknij',
    pending: 'Oczekująca',
    confirmed: 'Potwierdzona',
    cancelled: 'Anulowana',
    completed: 'Zakończona',
    changePasswordTitle: 'Zmień hasło',
    currentPassword: 'Aktualne hasło',
    newPassword: 'Nowe hasło (min. 6 znaków)',
    confirmNewPassword: 'Powtórz nowe hasło',
    changePasswordBtn: 'Zmień hasło',
    close: 'Zamknij',
    confirmCancel: 'Czy na pewno chcesz anulować tę wizytę?',
    errorCurrentRequired: 'Podaj aktualne hasło',
    errorMinLength: 'Nowe hasło musi mieć minimum 6 znaków',
    errorMismatch: 'Hasła nie są takie same',
    errorCurrentIncorrect: 'Aktualne hasło jest nieprawidłowe',
    errorGeneric: 'Błąd: ',
    passwordChanged: 'Hasło zmienione!',
  } : {
    myVisits: 'My Appointments',
    profile: 'Profile',
    changePassword: 'Change password',
    logout: 'Log out',
    loading: 'Loading...',
    noBookings: 'You don\'t have any bookings yet',
    noBookingsHint: 'Book an appointment via the calendar on the homepage',
    visit: 'Appointment',
    cancel: 'Cancel',
    invoice: 'Invoice',
    addReview: 'Add review',
    reviewTitle: 'Add a review',
    reviewPlaceholder: 'Write your review...',
    reviewRating: 'Rating',
    reviewSubmit: 'Submit review',
    reviewSent: 'Review submitted for approval!',
    reviewClose: 'Close',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    changePasswordTitle: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password (min. 6 characters)',
    confirmNewPassword: 'Repeat new password',
    changePasswordBtn: 'Change password',
    close: 'Close',
    confirmCancel: 'Are you sure you want to cancel this appointment?',
    errorCurrentRequired: 'Enter your current password',
    errorMinLength: 'New password must be at least 6 characters',
    errorMismatch: 'Passwords do not match',
    errorCurrentIncorrect: 'Current password is incorrect',
    errorGeneric: 'Error: ',
    passwordChanged: 'Password changed!',
  };

  const statusLabels = {
    pending: t.pending,
    confirmed: t.confirmed,
    cancelled: t.cancelled,
    completed: t.completed,
  };

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchMyBookings();
    fetchMyReviews();
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
      const response = await authFetch('/api/bookings');
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

  const fetchMyReviews = async () => {
    try {
      const response = await fetch('/api/reviews?all=true');
      const data = await response.json();
      const myReviewBookingIds = (data.data || [])
        .filter(r => r.booking_id)
        .map(r => r.booking_id);
      setReviewedBookings(myReviewBookingIds);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');

    if (!currentPassword) {
      setPasswordMsg(t.errorCurrentRequired);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg(t.errorMinLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg(t.errorMismatch);
      return;
    }

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordMsg(t.errorCurrentIncorrect);
      return;
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg(t.errorGeneric + error.message);
    } else {
      setPasswordMsg(t.passwordChanged);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePassword(false), 2000);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(t.confirmCancel)) return;

    const response = await authFetch(`/api/bookings?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (response.ok) {
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: profile?.full_name || user.email,
        user_id: user.id,
        booking_id: reviewBookingId,
        rating: reviewRating,
        content: reviewContent,
      }),
    });
    if (response.ok) {
      setReviewMsg(t.reviewSent);
      setReviewContent('');
      setReviewRating(5);
      setReviewedBookings([...reviewedBookings, reviewBookingId]);
    } else {
      const data = await response.json();
      setReviewMsg(data.error || 'Error');
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>{t.myVisits}</h1>
        <div className="header-right">
          <span className="user-email">{profile?.full_name || user.email}</span>
          <button className="change-password-btn" onClick={() => setShowProfile(true)}>{t.profile}</button>
          <button className="change-password-btn" onClick={() => setShowChangePassword(true)}>{t.changePassword}</button>
          <button className="logout-btn" onClick={handleLogout}>{t.logout}</button>
        </div>
      </header>

      <main className="admin-content">
        <div className="bookings-list">
          {loading ? (
            <p className="loading-text">{t.loading}</p>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">{t.noBookings}</p>
              <p className="empty-subtext">{t.noBookingsHint}</p>
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
                    <p className="booking-service">{booking.service || t.visit}</p>
                    <span className={`status-pill status-${booking.status}`}>
                      {statusLabels[booking.status] || booking.status}
                    </span>
                    {booking.status === 'pending' && (
                      <button className="cancel-btn" onClick={() => handleCancel(booking.id)}>
                        {t.cancel}
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <a href={`/api/invoice?id=${booking.id}`} className="invoice-btn" target="_blank" rel="noopener noreferrer">
                        {t.invoice}
                      </a>
                    )}
                    {booking.status === 'completed' && !reviewedBookings.includes(booking.id) && (
                      <button className="mark-read-btn" onClick={() => { setReviewBookingId(booking.id); setShowReview(true); }}>
                        {t.addReview}
                      </button>
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
            <h3>{t.changePasswordTitle}</h3>
            <form onSubmit={handleChangePassword}>
              <input
                type="password"
                placeholder={t.currentPassword}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              />
              <input
                type="password"
                placeholder={t.newPassword}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              />
              <input
                type="password"
                placeholder={t.confirmNewPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              />
              {passwordMsg && <p style={{ color: passwordMsg.includes(t.passwordChanged) ? '#28a745' : '#dc3545', fontSize: '0.9rem' }}>{passwordMsg}</p>}
              <button type="submit" className="login-prompt-btn" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>{t.changePasswordBtn}</button>
            </form>
            <button className="login-prompt-close" onClick={() => setShowChangePassword(false)}>{t.close}</button>
          </div>
        </div>
      )}

      {showProfile && (
        <ProfileModal user={user} onClose={() => { setShowProfile(false); fetchProfile(); }} />
      )}

      {showReview && (
        <div className="login-prompt-overlay" onClick={() => setShowReview(false)}>
          <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>{t.reviewTitle}</h3>
            {reviewMsg ? (
              <p style={{ color: '#28a745', textAlign: 'center' }}>{reviewMsg}</p>
            ) : (
              <form onSubmit={handleSubmitReview}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t.reviewRating}</label>
                <div style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} onClick={() => setReviewRating(star)} style={{ cursor: 'pointer', color: star <= reviewRating ? '#f5a623' : '#ddd' }}>★</span>
                  ))}
                </div>
                <textarea
                  placeholder={t.reviewPlaceholder}
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  required
                  rows={4}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem', fontFamily: 'inherit' }}
                />
                <button type="submit" className="login-prompt-btn" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>{t.reviewSubmit}</button>
              </form>
            )}
            <button className="login-prompt-close" onClick={() => { setShowReview(false); setReviewMsg(''); }}>{t.reviewClose}</button>
          </div>
        </div>
      )}
    </div>
  );
}
