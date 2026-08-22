import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { authFetch } from '../../config/api';
import './Admin.css';

export default function ClientProfileView({ clientEmail, clientName, onBack }) {
  const { language } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteMsg, setNoteMsg] = useState('');

  const t = language === 'pl' ? {
    back: '← Wróć do rezerwacji',
    title: 'Profil pacjenta',
    email: 'Email',
    visits: 'Historia wizyt',
    date: 'Data',
    time: 'Godzina',
    service: 'Usługa',
    status: 'Status',
    note: 'Notatka',
    noVisits: 'Brak wizyt tego pacjenta',
    addNote: 'Dodaj notatkę',
    editNote: 'Edytuj notatkę',
    saveNote: 'Zapisz',
    cancel: 'Anuluj',
    saved: 'Zapisano!',
    noNote: 'Brak notatki',
    pending: 'Oczekująca',
    confirmed: 'Potwierdzona',
    cancelled: 'Anulowana',
    completed: 'Zakończona',
  } : {
    back: '← Back to bookings',
    title: 'Client Profile',
    email: 'Email',
    visits: 'Visit History',
    date: 'Date',
    time: 'Time',
    service: 'Service',
    status: 'Status',
    note: 'Note',
    noVisits: 'No visits for this client',
    addNote: 'Add note',
    editNote: 'Edit note',
    saveNote: 'Save',
    cancel: 'Cancel',
    saved: 'Saved!',
    noNote: 'No note',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };

  const statusLabels = {
    pending: t.pending,
    confirmed: t.confirmed,
    cancelled: t.cancelled,
    completed: t.completed,
  };

  useEffect(() => {
    fetchClientData();
  }, [clientEmail]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await authFetch('/api/bookings');
      const bookingsData = await bookingsRes.json();
      const clientBookings = (bookingsData.data || []).filter(
        b => b.client_email.toLowerCase() === clientEmail.toLowerCase()
      );
      setBookings(clientBookings);

      // Fetch all notes
      const notesRes = await fetch('/api/notes');
      const notesData = await notesRes.json();
      const notesMap = {};
      (notesData.data || []).forEach(n => {
        notesMap[n.booking_id] = n.note;
      });
      setNotes(notesMap);
    } catch (err) {
      console.error('Failed to fetch client data:', err);
    }
    setLoading(false);
  };

  const handleSaveNote = async (bookingId) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, note: noteText }),
    });
    if (res.ok) {
      setNotes({ ...notes, [bookingId]: noteText });
      setEditingNote(null);
      setNoteText('');
      setNoteMsg(t.saved);
      setTimeout(() => setNoteMsg(''), 2000);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>{t.title}</h1>
        <button className="logout-btn" onClick={onBack}>{t.back}</button>
      </header>

      <main className="admin-content">
        <div className="client-profile-info">
          <h2>{clientName}</h2>
          <p>{t.email}: <strong>{clientEmail}</strong></p>
        </div>

        <h3 className="section-title">{t.visits} ({bookings.length})</h3>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="empty-text">{t.noVisits}</p>
        ) : (
          <div className="client-visits-list">
            {bookings.map(booking => (
              <div key={booking.id} className={`client-visit-item status-card-${booking.status}`}>
                <div className="visit-top">
                  <div className="visit-date-time">
                    <strong>{booking.date}</strong>
                    <span>{booking.time_slot}</span>
                  </div>
                  <div className="visit-service">{booking.service || '-'}</div>
                  <span className={`status-pill status-${booking.status}`}>
                    {statusLabels[booking.status] || booking.status}
                  </span>
                </div>

                <div className="visit-note-section">
                  {editingNote === booking.id ? (
                    <div className="note-editor">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={4}
                        placeholder={language === 'pl' ? 'Wpisz notatkę o wizycie...' : 'Enter visit note...'}
                      />
                      <div className="note-actions">
                        <button className="mark-read-btn" onClick={() => handleSaveNote(booking.id)}>{t.saveNote}</button>
                        <button className="cancel-btn" onClick={() => setEditingNote(null)}>{t.cancel}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="note-display">
                      <p className={notes[booking.id] ? 'note-text' : 'note-empty'}>
                        <strong>{t.note}:</strong> {notes[booking.id] || t.noNote}
                      </p>
                      <button className="mark-read-btn" onClick={() => { setEditingNote(booking.id); setNoteText(notes[booking.id] || ''); }}>
                        {notes[booking.id] ? t.editNote : t.addNote}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {noteMsg && <p style={{ color: '#28a745', textAlign: 'center', marginTop: '1rem', fontWeight: 500 }}>{noteMsg}</p>}
      </main>
    </div>
  );
}
