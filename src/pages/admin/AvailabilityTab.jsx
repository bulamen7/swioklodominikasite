import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AvailabilityTab() {
  const { language } = useLanguage();
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, time_slot: '09:00' });

  const t = language === 'pl' ? {
    title: 'Zarządzaj dostępnością',
    day: 'Dzień', time: 'Godzina', available: 'Dostępna', unavailable: 'Niedostępna',
    add: 'Dodaj slot', delete: 'Usuń',
    days: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
  } : {
    title: 'Manage Availability',
    day: 'Day', time: 'Time', available: 'Available', unavailable: 'Unavailable',
    add: 'Add slot', delete: 'Delete',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  };

  useEffect(() => { fetchSlots(); }, []);

  const fetchSlots = async () => {
    const res = await fetch('/api/availability');
    const data = await res.json();
    setSlots(data.data || []);
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
    </div>
  );
}
