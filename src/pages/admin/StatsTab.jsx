import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { authFetch } from '../../config/api';

export default function StatsTab() {
  const { language } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = language === 'pl' ? {
    title: 'Statystyki',
    thisMonth: 'Ten miesiąc',
    visits: 'Wizyty',
    revenue: 'Przychód',
    completed: 'Zakończone',
    pending: 'Oczekujące',
    cancelled: 'Anulowane',
    newPatients: 'Nowi pacjenci',
    last6months: 'Ostatnie 6 miesięcy',
    month: 'Miesiąc',
    count: 'Wizyty',
  } : {
    title: 'Statistics',
    thisMonth: 'This month',
    visits: 'Visits',
    revenue: 'Revenue',
    completed: 'Completed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    newPatients: 'New patients',
    last6months: 'Last 6 months',
    month: 'Month',
    count: 'Visits',
  };

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await authFetch('/api/bookings');
      const data = await res.json();
      setBookings(data.data || []);
    } catch (_) {}
    setLoading(false);
  };

  if (loading) return <p className="loading-text">Loading...</p>;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // This month stats
  const thisMonthBookings = bookings.filter(b => b.date.startsWith(currentMonth));
  const completedThisMonth = thisMonthBookings.filter(b => b.status === 'completed');
  const pendingThisMonth = thisMonthBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const cancelledThisMonth = thisMonthBookings.filter(b => b.status === 'cancelled');
  const revenueThisMonth = completedThisMonth.length * 150; // TODO: get actual price from service

  // Unique patients this month (by email)
  const thisMonthEmails = [...new Set(thisMonthBookings.map(b => b.client_email))];
  const previousBookings = bookings.filter(b => !b.date.startsWith(currentMonth));
  const previousEmails = new Set(previousBookings.map(b => b.client_email));
  const newPatients = thisMonthEmails.filter(e => !previousEmails.has(e)).length;

  // Last 6 months chart data
  const monthsData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US', { month: 'short', year: '2-digit' });
    const count = bookings.filter(b => b.date.startsWith(key) && b.status !== 'cancelled').length;
    const revenue = bookings.filter(b => b.date.startsWith(key) && b.status === 'completed').length * 150;
    monthsData.push({ key, label, count, revenue });
  }
  const maxCount = Math.max(...monthsData.map(m => m.count), 1);
  const maxRevenue = Math.max(...monthsData.map(m => m.revenue), 1);

  return (
    <div>
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{thisMonthBookings.length}</div>
          <div className="stat-label">{t.visits} ({t.thisMonth})</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{revenueThisMonth} zł</div>
          <div className="stat-label">{t.revenue}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedThisMonth.length}</div>
          <div className="stat-label">{t.completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingThisMonth.length}</div>
          <div className="stat-label">{t.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cancelledThisMonth.length}</div>
          <div className="stat-label">{t.cancelled}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{newPatients}</div>
          <div className="stat-label">{t.newPatients}</div>
        </div>
      </div>

      <div className="stats-chart-section">
        <h3>{t.last6months} — {t.visits}</h3>
        <div className="stats-chart">
          {monthsData.map(m => (
            <div key={m.key} className="chart-bar-wrapper">
              <div className="chart-value">{m.count}</div>
              <div className="chart-bar" style={{ height: `${(m.count / maxCount) * 150}px` }}></div>
              <div className="chart-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-chart-section" style={{ marginTop: '1.5rem' }}>
        <h3>{t.last6months} — {t.revenue}</h3>
        <div className="stats-chart">
          {monthsData.map(m => (
            <div key={m.key + '-rev'} className="chart-bar-wrapper">
              <div className="chart-value">{m.revenue} zł</div>
              <div className="chart-bar" style={{ height: `${(m.revenue / maxRevenue) * 150}px`, background: 'var(--accent-color)' }}></div>
              <div className="chart-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
