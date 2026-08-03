import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import './Admin.css';

export default function Dashboard({ onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [invoiceMonth, setInvoiceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę rezerwację?')) return;

    const response = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      setBookings(bookings.filter((b) => b.id !== id));
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const response = await fetch(`/api/bookings?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) {
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Panel Administracyjny</h1>
        <button className="logout-btn" onClick={handleLogout}>Wyloguj</button>
      </header>

      <nav className="admin-tabs">
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          Rezerwacje ({bookings.length})
        </button>
      </nav>

      <div className="admin-invoice-bar">
        <label>Faktura zbiorcza za miesiąc: </label>
        <input
          type="month"
          value={invoiceMonth}
          onChange={(e) => setInvoiceMonth(e.target.value)}
        />
        <a
          href={`/api/invoice?month=${invoiceMonth}`}
          className="invoice-monthly-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pobierz PDF
        </a>
      </div>

      <main className="admin-content">
        {activeTab === 'bookings' && (
          <div className="bookings-list">
            {loading ? (
              <p className="loading-text">Ładowanie...</p>
            ) : bookings.length === 0 ? (
              <p className="empty-text">Brak rezerwacji</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Godzina</th>
                    <th>Klient</th>
                    <th>Email</th>
                    <th>Usługa</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className={`row-${booking.status}`}>
                      <td>{booking.date}</td>
                      <td>{booking.time_slot}</td>
                      <td>{booking.client_name}</td>
                      <td>{booking.client_email}</td>
                      <td>{booking.service || '-'}</td>
                      <td>
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className={`status-badge status-${booking.status}`}
                        >
                          <option value="pending">Oczekująca</option>
                          <option value="confirmed">Potwierdzona</option>
                          <option value="cancelled">Anulowana</option>
                          <option value="completed">Zakończona</option>
                        </select>
                      </td>
                      <td>
                        {booking.status === 'completed' && (
                          <a href={`/api/invoice?id=${booking.id}`} className="invoice-btn" target="_blank" rel="noopener noreferrer">
                            Faktura
                          </a>
                        )}
                        <button className="delete-btn" onClick={() => handleDelete(booking.id)}>
                          Usuń
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
