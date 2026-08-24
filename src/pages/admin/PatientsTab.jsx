import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { authFetch } from '../../config/api';

export default function PatientsTab({ onViewProfile }) {
  const { language } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const t = language === 'pl' ? {
    title: 'Pacjenci',
    search: 'Szukaj pacjenta...',
    name: 'Imię',
    email: 'Email',
    visits: 'Wizyty',
    lastVisit: 'Ostatnia wizyta',
    viewProfile: 'Profil',
    noPatients: 'Brak pacjentów',
    exportCSV: 'Eksport CSV',
  } : {
    title: 'Patients',
    search: 'Search patient...',
    name: 'Name',
    email: 'Email',
    visits: 'Visits',
    lastVisit: 'Last visit',
    viewProfile: 'Profile',
    noPatients: 'No patients',
    exportCSV: 'Export CSV',
  };

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      const res = await authFetch('/api/bookings');
      const data = await res.json();
      const bookings = data.data || [];

      // Group by email
      const patientMap = {};
      bookings.forEach(b => {
        if (!patientMap[b.client_email]) {
          patientMap[b.client_email] = {
            name: b.client_name,
            email: b.client_email,
            visits: 0,
            lastVisit: b.date,
          };
        }
        patientMap[b.client_email].visits++;
        if (b.date > patientMap[b.client_email].lastVisit) {
          patientMap[b.client_email].lastVisit = b.date;
        }
      });

      setPatients(Object.values(patientMap).sort((a, b) => b.visits - a.visits));
    } catch (_) {}
    setLoading(false);
  };

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  if (loading) return <p className="loading-text">Loading...</p>;

  const exportCSV = () => {
    if (patients.length === 0) return;
    const headers = ['Name', 'Email', 'Visits', 'Last Visit'];
    const rows = patients.map(p => [p.name, p.email, p.visits, p.lastVisit]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          className="search-input"
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <button className="invoice-monthly-btn" onClick={exportCSV}>{t.exportCSV}</button>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-text">{t.noPatients}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.name}</th>
              <th>{language === 'pl' ? 'Nazwisko' : 'Last name'}</th>
              <th>{t.email}</th>
              <th>{t.visits}</th>
              <th>{t.lastVisit}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const nameParts = p.name.split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              return (
                <tr key={p.email}>
                  <td><strong>{firstName}</strong></td>
                  <td>{lastName}</td>
                  <td>{p.email}</td>
                  <td>{p.visits}</td>
                  <td>{p.lastVisit}</td>
                  <td>
                    <button className="mark-read-btn" onClick={() => onViewProfile(p.email, p.name)}>
                      {t.viewProfile}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
