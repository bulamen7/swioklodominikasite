import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AvailabilityTab() {
  const { language } = useLanguage();
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, time_slot: '09:00' });
  const [exceptions, setExceptions] = useState([]);
  const [newException, setNewException] = useState({ date: '', is_blocked: true, reason: '' });

  const t = language === 'pl' ? {
    title: 'Zarządzaj dostępnością',
    day: 'Dzień', time: 'Godzina', available: 'Dostępna', unavailable: 'Niedostępna',
    add: 'Dodaj slot', delete: 'Usuń',
    days: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
    exceptions: 'Wyjątki (blokady dni)',
    addException: 'Zablokuj dzień',
    date: 'Data',
    reason: 'Powód (opcjonalnie)',
    blocked: 'Zablokowany',
    noExceptions: 'Brak wyjątków',
  } : {
    title: 'Manage Availability',
    day: 'Day', time: 'Time', available: 'Available', unavailable: 'Unavailable',
    add: 'Add slot', delete: 'Delete',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    exceptions: 'Exceptions (blocked days)',
    addException: 'Block day',
    date: 'Date',
    reason: 'Reason (optional)',
    blocked: 'Blocked',
    noExceptions: 'No exceptions',
  };

  useEffect(() => { fetchSlots(); fetchExceptions(); }, []);

  const fetchSlots = async () => {
    const res = await fetch('/api/availability');
    const data = await res.json();
    setSlots(data.data || []);
  };

  const fetchExceptions = async () => {
    const res = await fetch('/api/exceptions');
    const data = await res.json();
    setExceptions(data.data || []);
  };

  const handleAddException = async () => {
    if (!newException.date) return;
    await fetch('/api/exceptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newException),
    });
    setNewException({ date: '', is_blocked: true, reason: '' });
    fetchExceptions();
  };

  const handleDeleteException = async (id) => {
    setExceptions(exceptions.filter(e => e.id !== id));
    await fetch(`/api/exceptions?id=${id}`, { method: 'DELETE' });
  };

  const handleToggle = async (slot) => {
    setSlots(slots.map(s => s.id === slot.id ? { ...s, is_available: !s.is_available } : s));
    await fetch(`/api/availability?id=${slot.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !slot.is_available }),
    });
  };

  const handleAdd = async () => {
    await fetch('/api/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSlot),
    });
    fetchSlots();
  };

  const handleDelete = async (id) => {
    setSlots(slots.filter(s => s.id !== id));
    await fetch(`/api/availability?id=${id}`, { method: 'DELETE' });
  };

  // Group by day
  const grouped = {};
  slots.forEach(s => {
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week].push(s);
  });

  return (
    <div>
      <div className="admin-form-card">
        <h3>{t.add}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={newSlot.day_of_week} onChange={e => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6, 0].map(d => <option key={d} value={d}>{t.days[d]}</option>)}
          </select>
          <input type="time" value={newSlot.time_slot} onChange={e => setNewSlot({ ...newSlot, time_slot: e.target.value })} />
          <button className="mark-read-btn" onClick={handleAdd}>{t.add}</button>
        </div>
      </div>

      {[1, 2, 3, 4, 5, 6, 0].map(day => {
        const daySlots = grouped[day];
        if (!daySlots || daySlots.length === 0) return null;
        return (
          <div key={day} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{t.days[day]}</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {daySlots.map(slot => (
                <div key={slot.id} style={{
                  padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem',
                  background: slot.is_available ? '#d4edda' : '#f8d7da',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <span onClick={() => handleToggle(slot)}>{slot.time_slot}</span>
                  <button onClick={() => handleDelete(slot.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="admin-form-card" style={{ marginTop: '2rem' }}>
        <h3>{t.exceptions}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input type="date" value={newException.date} onChange={e => setNewException({ ...newException, date: e.target.value })} />
          <input type="text" placeholder={t.reason} value={newException.reason} onChange={e => setNewException({ ...newException, reason: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          <button className="mark-read-btn" onClick={handleAddException}>{t.addException}</button>
        </div>

        {exceptions.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{t.noExceptions}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {exceptions.map(ex => (
              <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', background: '#f8d7da', borderRadius: '6px' }}>
                <strong>{ex.date}</strong>
                <span style={{ color: '#721c24' }}>{t.blocked}</span>
                {ex.reason && <span style={{ color: '#666' }}>({ex.reason})</span>}
                <button onClick={() => handleDeleteException(ex.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
