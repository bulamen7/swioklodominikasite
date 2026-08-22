import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function ServicesTab() {
  const { language } = useLanguage();
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name_pl: '', name_en: '', duration: '50 minut', price: 150, description_pl: '', description_en: '' });

  const t = language === 'pl' ? {
    namePL: 'Nazwa (PL)', nameEN: 'Nazwa (EN)', duration: 'Czas', price: 'Cena (zł)',
    descPL: 'Opis (PL)', descEN: 'Opis (EN)', save: 'Zapisz', cancel: 'Anuluj',
    add: 'Dodaj usługę', edit: 'Edytuj', delete: 'Usuń', active: 'Aktywna', inactive: 'Nieaktywna',
    noServices: 'Brak usług', confirmDelete: 'Czy na pewno chcesz usunąć tę usługę?',
  } : {
    namePL: 'Name (PL)', nameEN: 'Name (EN)', duration: 'Duration', price: 'Price (zł)',
    descPL: 'Description (PL)', descEN: 'Description (EN)', save: 'Save', cancel: 'Cancel',
    add: 'Add service', edit: 'Edit', delete: 'Delete', active: 'Active', inactive: 'Inactive',
    noServices: 'No services', confirmDelete: 'Are you sure you want to delete this service?',
  };

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    const res = await fetch('/api/services?all=true');
    const data = await res.json();
    setServices(data.data || []);
  };

  const handleSave = async () => {
    if (!form.name_pl || !form.name_en || !form.price) return;

    if (editing) {
      await fetch(`/api/services?id=${editing}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setEditing(null);
    setForm({ name_pl: '', name_en: '', duration: '50 minut', price: 150, description_pl: '', description_en: '' });
    fetchServices();
  };

  const handleEdit = (s) => {
    setEditing(s.id);
    setForm({
      name_pl: s.name_pl, name_en: s.name_en, duration: s.duration,
      price: s.price, description_pl: s.description_pl || '', description_en: s.description_en || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
    fetchServices();
  };

  const handleToggleActive = async (s) => {
    await fetch(`/api/services?id=${s.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, is_active: !s.is_active }),
    });
    fetchServices();
  };

  return (
    <div>
      <div className="admin-form-card">
        <h3>{editing ? t.edit : t.add}</h3>
        <div className="admin-form-grid">
          <input placeholder={t.namePL} value={form.name_pl} onChange={e => setForm({ ...form, name_pl: e.target.value })} />
          <input placeholder={t.nameEN} value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
          <input placeholder={t.duration} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
          <input type="number" placeholder={t.price} value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} />
          <input placeholder={t.descPL} value={form.description_pl} onChange={e => setForm({ ...form, description_pl: e.target.value })} />
          <input placeholder={t.descEN} value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} />
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button className="mark-read-btn" onClick={handleSave}>{t.save}</button>
          {editing && <button className="cancel-btn" onClick={() => { setEditing(null); setForm({ name_pl: '', name_en: '', duration: '50 minut', price: 150, description_pl: '', description_en: '' }); }}>{t.cancel}</button>}
        </div>
      </div>

      {services.length === 0 ? (
        <p className="empty-text">{t.noServices}</p>
      ) : (
        <div className="messages-cards">
          {services.map(s => (
            <div key={s.id} className={`message-card ${s.is_active ? 'read' : 'unread'}`}>
              <div className="message-header">
                <strong>{language === 'pl' ? s.name_pl : s.name_en}</strong>
                <span className="message-email">{s.duration} | {s.price} zł</span>
                <span className="message-date">{s.is_active ? t.active : t.inactive}</span>
              </div>
              <p className="message-body">{language === 'pl' ? (s.description_pl || '') : (s.description_en || '')}</p>
              <div className="message-actions">
                <button className="mark-read-btn" onClick={() => handleEdit(s)}>{t.edit}</button>
                <button className="cancel-btn" onClick={() => handleToggleActive(s)}>{s.is_active ? t.inactive : t.active}</button>
                <button className="delete-btn" onClick={() => handleDelete(s.id)}>{t.delete}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
