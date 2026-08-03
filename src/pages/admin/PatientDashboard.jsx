import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function PatientDashboard({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
