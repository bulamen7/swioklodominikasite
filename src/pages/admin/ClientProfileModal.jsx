import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

export default function ClientProfileModal({ clientEmail, clientName, onClose }) {
  const { language } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteMsg, setNoteMsg] = useState('');

  const t = language === 'pl' ? {
    title: 'Profil pacjenta',
    email: 'Email',
    phone: 'Telefon',
    visits: 'Historia wizyt',
    date: 'Data',
    time: 'Godzina',
    service: 'Usługa',
    status: 'Status',
    note: 'Notatka',
    noVisits: 'Brak wizyt',
    addNote: 'Dodaj notatkę',
    editNote: 'Edytuj',
    saveNote: 'Zapisz',
    close: 'Zamknij',
    saved: 'Zapisano!',
    pending: 'Oczekująca',
    confirmed: 'Potwierdzona',
    cancelled: 'Anulowana',
    completed: 'Zakończona',
  } : {
    title: 'Client Profile',
    email: 'Email',
    phone: 'Phone',
    visits: 'Visit History',
    date: 'Date',
    time: 'Time',
    service: 'Service',
    status: 'Status',
    note: 'Note',
    noVisits: 'No visits',
    addNote: 'Add note',
    editNote: 'Edit',
    saveNote: 'Save',
    close: 'Close',
    saved: 'Saved!',
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
  }, []);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings and filter by client email
      const bookingsRes = await fetch('/api/bookings');
      const bookingsData = await bookingsRes.json();
      const clientBookings = (bookingsData.data || []).filter(
        b => b.client_email === clientEmail
      );
      setBookings(clientBookings);

      // Fetch notes for each booking
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
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="client-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={onClose}>×</button>

        <h2>{t.title}</h2>

        <div className="client-info">
          <p><strong>{clientName}</strong></p>
          <p>{t.email}: {clientEmail}</p>
        </div>

        <h3>{t.visits} ({bookings.length})</h3>

        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="empty-text">{t.noVisits}</p>
        ) : (
          <div className="client-visits">
            {bookings.map(booking => (
              <div key={booking.id} className={`client-visit-card status-card-${booking.status}`}>
                <div className="client-visit-header">
                  <strong>{booking.date}</strong>
                  <span>{booking.time_slot}</span>
                  <span>{booking.service || '-'}</span>
                  <span className={`status-pill status-${booking.status}`}>
                    {statusLabels[booking.status] || booking.status}
                  </span>
                </div>

                <div className="client-visit-note">
                  {editingNote === booking.id ? (
                    <div>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                      />
                      <button className="mark-read-btn" onClick={() => handleSaveNote(booking.id)} style={{ marginTop: '0.5rem' }}>
                        {t.saveNote}
                      </button>
                      <button className="cancel-btn" onClick={() => setEditingNote(null)} style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                        {t.close}
                      </button>
                    </div>
                  ) : (
                    <div>
                      {notes[booking.id] ? (
                        <p className="note-content">{notes[booking.id]}</p>
                      ) : (
                        <p className="note-empty">{t.note}: —</p>
                      )}
                      <button className="mark-read-btn" onClick={() => { setEditingNote(booking.id); setNoteText(notes[booking.id] || ''); }} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        {notes[booking.id] ? t.editNote : t.addNote}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {noteMsg && <p style={{ color: '#28a745', textAlign: 'center', marginTop: '1rem' }}>{noteMsg}</p>}
      </div>
    </div>
  );
}
