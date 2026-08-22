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
  } : {
    title: 'Patients',
    search: 'Search patient...',
    name: 'Name',
    email: 'Email',
    visits: 'Visits',
    lastVisit: 'Last visit',
    viewProfile: 'Profile',
    noPatients: 'No patients',
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
    } catch (err) {}
    setLoading(false);
  };

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div>
      <input
        type="text"
        className="search-input"
        placeholder={t.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="empty-text">{t.noPatients}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.name}</th>
              <th>{t.email}</th>
              <th>{t.visits}</th>
              <th>{t.lastVisit}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.email}>
                <td><strong>{p.name}</strong></td>
                <td>{p.email}</td>
                <td>{p.visits}</td>
                <td>{p.lastVisit}</td>
                <td>
                  <button className="mark-read-btn" onClick={() => onViewProfile(p.email, p.name)}>
                    {t.viewProfile}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
