import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../context/LanguageContext';
import ServicesTab from './ServicesTab';
import AvailabilityTab from './AvailabilityTab';
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
    messages: 'Wiadomości',
    noMessages: 'Brak wiadomości',
    from: 'Od',
    markRead: 'Oznacz jako przeczytane',
    deleteMsg: 'Usuń',
    confirmDeleteMsg: 'Czy na pewno chcesz usunąć tę wiadomość?',
    reviews: 'Opinie',
    noReviews: 'Brak opinii',
    approve: 'Zatwierdź',
    reject: 'Odrzuć',
    approved: 'Zatwierdzona',
    pendingReview: 'Oczekuje',
    services: 'Cennik',
    availability: 'Dostępność',
    exportCSV: 'Eksport CSV',
    notes: 'Notatki',
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
    messages: 'Messages',
    noMessages: 'No messages',
    from: 'From',
    markRead: 'Mark as read',
    deleteMsg: 'Delete',
    confirmDeleteMsg: 'Are you sure you want to delete this message?',
    reviews: 'Reviews',
    noReviews: 'No reviews',
    approve: 'Approve',
    reject: 'Reject',
    approved: 'Approved',
    pendingReview: 'Pending',
    services: 'Pricing',
    availability: 'Availability',
    exportCSV: 'Export CSV',
    notes: 'Notes',
  };

  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteMsg, setNoteMsg] = useState('');
  const [invoiceMonth, setInvoiceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchBookings();
    fetchMessages();
    fetchReviews();
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

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleMarkRead = async (id) => {
    await fetch(`/api/messages?id=${id}`, { method: 'PUT' });
    setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm(t.confirmDeleteMsg)) return;
    const response = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      setMessages(messages.filter(m => m.id !== id));
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews?all=true');
      const data = await response.json();
      setReviews(data.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleApproveReview = async (id) => {
    await fetch(`/api/reviews?id=${id}&action=approve`, { method: 'PUT' });
    setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: true } : r));
  };

  const handleRejectReview = async (id) => {
    await fetch(`/api/reviews?id=${id}&action=reject`, { method: 'PUT' });
    setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: false } : r));
  };

  const handleDeleteReview = async (id) => {
    await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
    setReviews(reviews.filter(r => r.id !== id));
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

  const exportCSV = () => {
    if (bookings.length === 0) return;
    const headers = ['Date', 'Time', 'Client', 'Email', 'Service', 'Status'];
    const rows = bookings.map(b => [b.date, b.time_slot, b.client_name, b.client_email, b.service || '-', b.status]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openNoteModal = async (bookingId) => {
    setNoteModal(bookingId);
    setNoteText('');
    setNoteMsg('');
    try {
      const res = await fetch(`/api/notes?booking_id=${bookingId}`);
      const data = await res.json();
      if (data.data && data.data.note) setNoteText(data.data.note);
    } catch (err) {}
  };

  const saveNote = async () => {
    if (!noteModal || !noteText) return;
    const res = await fetch('/api/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: noteModal, note: noteText }),
    });
    if (res.ok) setNoteMsg(language === 'pl' ? 'Zapisano!' : 'Saved!');
    else setNoteMsg(language === 'pl' ? 'Błąd zapisu' : 'Save failed');
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
        <button
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => setActiveTab('messages')}
        >
          {t.messages} ({messages.filter(m => !m.is_read).length})
        </button>
        <button
          className={activeTab === 'reviews' ? 'active' : ''}
          onClick={() => setActiveTab('reviews')}
        >
          {t.reviews} ({reviews.filter(r => !r.is_approved).length})
        </button>
        <button
          className={activeTab === 'services' ? 'active' : ''}
          onClick={() => setActiveTab('services')}
        >
          {t.services}
        </button>
        <button
          className={activeTab === 'availability' ? 'active' : ''}
          onClick={() => setActiveTab('availability')}
        >
          {t.availability}
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
                        <button className="mark-read-btn" onClick={() => openNoteModal(booking.id)} style={{ marginRight: '0.3rem' }}>
                          {t.notes}
                        </button>
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

        {activeTab === 'messages' && (
          <div className="messages-list">
            {messages.length === 0 ? (
              <p className="empty-text">{t.noMessages}</p>
            ) : (
              <div className="messages-cards">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-card ${msg.is_read ? 'read' : 'unread'}`}>
                    <div className="message-header">
                      <strong>{msg.name}</strong>
                      <span className="message-email">{msg.email}</span>
                      <span className="message-date">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="message-body">{msg.message}</p>
                    <div className="message-actions">
                      {!msg.is_read && (
                        <button className="mark-read-btn" onClick={() => handleMarkRead(msg.id)}>{t.markRead}</button>
                      )}
                      <button className="delete-btn" onClick={() => handleDeleteMessage(msg.id)}>{t.deleteMsg}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="messages-list">
            {reviews.length === 0 ? (
              <p className="empty-text">{t.noReviews}</p>
            ) : (
              <div className="messages-cards">
                {reviews.map((review) => (
                  <div key={review.id} className={`message-card ${review.is_approved ? 'read' : 'unread'}`}>
                    <div className="message-header">
                      <strong>{review.client_name}</strong>
                      <span className="message-email">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className="message-date">
                        {review.is_approved ? t.approved : t.pendingReview}
                      </span>
                    </div>
                    <p className="message-body">{review.content}</p>
                    <div className="message-actions">
                      {!review.is_approved && (
                        <button className="mark-read-btn" onClick={() => handleApproveReview(review.id)}>{t.approve}</button>
                      )}
                      {review.is_approved && (
                        <button className="cancel-btn" onClick={() => handleRejectReview(review.id)}>{t.reject}</button>
                      )}
                      <button className="delete-btn" onClick={() => handleDeleteReview(review.id)}>{t.delete}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && <ServicesTab />}

        {activeTab === 'availability' && <AvailabilityTab />}
      </main>

      <div className="admin-invoice-bar">
        <button className="invoice-monthly-btn" onClick={exportCSV}>{t.exportCSV}</button>
      </div>

      {noteModal && (
        <div className="login-prompt-overlay" onClick={() => setNoteModal(null)}>
          <div className="login-prompt" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h3>{t.notes}</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={language === 'pl' ? 'Notatka terapeuty...' : 'Therapist note...'}
              rows={6}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', marginBottom: '1rem' }}
            />
            {noteMsg && <p style={{ color: noteMsg.includes('!') ? '#28a745' : '#dc3545', fontSize: '0.9rem' }}>{noteMsg}</p>}
            <button className="login-prompt-btn" onClick={saveNote} style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
              {language === 'pl' ? 'Zapisz notatkę' : 'Save note'}
            </button>
            <button className="login-prompt-close" onClick={() => setNoteModal(null)}>
              {language === 'pl' ? 'Zamknij' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
