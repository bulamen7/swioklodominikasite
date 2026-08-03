import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

export default function Dashboard({ onLogout }) {
  const { language } = useLanguage();
  const t = language === 'pl' ? {
    title: 'Panel Administracyjny',
    logout: 'Wyloguj',
    bookings: 'Rezerwacje',
    invoiceLabel: 'Faktura zbiorcza za miesiąc:',
    downloadPdf: 'Pobierz PDF',
    loading: 'Ładowanie...',
    noBookings: 'Brak rezerwacji',
    date: 'Data',
    time: 'Godzina',
    client: 'Klient',
    email: 'Email',
    service: 'Usługa',
    status: 'Status',
    actions: 'Akcje',
    pending: 'Oczekująca',
    confirmed: 'Potwierdzona',
    cancelled: 'Anulowana',
    completed: 'Zakończona',
    invoice: 'Faktura',
    delete: 'Usuń',
    confirmDelete: 'Czy na pewno chcesz usunąć tę rezerwację?',
  } : {
    title: 'Admin Panel',
    logout: 'Log out',
    bookings: 'Bookings',
    invoiceLabel: 'Monthly invoice for:',
    downloadPdf: 'Download PDF',
    loading: 'Loading...',
    noBookings: 'No bookings',
    date: 'Date',
    time: 'Time',
    client: 'Client',
    email: 'Email',
    service: 'Service',
    status: 'Status',
    actions: 'Actions',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    invoice: 'Invoice',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this booking?',
  };

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
    if (!window.confirm(t.confirmDelete)) return;

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
        <h1>{t.title}</h1>
        <button className="logout-btn" onClick={handleLogout}>{t.logout}</button>
      </header>

      <nav className="admin-tabs">
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          {t.bookings} ({bookings.length})
        </button>
      </nav>

      <div className="admin-invoice-bar">
        <label>{t.invoiceLabel} </label>
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
          {t.downloadPdf}
        </a>
      </div>

      <main className="admin-content">
        {activeTab === 'bookings' && (
          <div className="bookings-list">
            {loading ? (
              <p className="loading-text">{t.loading}</p>
            ) : bookings.length === 0 ? (
              <p className="empty-text">{t.noBookings}</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t.date}</th>
                    <th>{t.time}</th>
                    <th>{t.client}</th>
                    <th>{t.email}</th>
                    <th>{t.service}</th>
                    <th>{t.status}</th>
                    <th>{t.actions}</th>
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
                          <option value="pending">{t.pending}</option>
                          <option value="confirmed">{t.confirmed}</option>
                          <option value="cancelled">{t.cancelled}</option>
                          <option value="completed">{t.completed}</option>
                        </select>
                      </td>
                      <td>
                        {booking.status === 'completed' && (
                          <a href={`/api/invoice?id=${booking.id}`} className="invoice-btn" target="_blank" rel="noopener noreferrer">
                            {t.invoice}
                          </a>
                        )}
                        <button className="delete-btn" onClick={() => handleDelete(booking.id)}>
                          {t.delete}
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
