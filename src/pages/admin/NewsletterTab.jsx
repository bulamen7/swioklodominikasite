import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function NewsletterTab() {
  const { language } = useLanguage();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  const t = language === 'pl' ? {
    title: 'Subskrybenci',
    email: 'Email',
    date: 'Data zapisu',
    status: 'Status',
    active: 'Aktywny',
    inactive: 'Nieaktywny',
    unsubscribe: 'Wypisz',
    noSubscribers: 'Brak subskrybentów',
    sendTitle: 'Wyślij newsletter',
    subject: 'Temat',
    content: 'Treść (HTML lub tekst)',
    send: 'Wyślij do wszystkich aktywnych',
    sending: 'Wysyłanie...',
    sent: 'Wysłano!',
    sendError: 'Błąd wysyłania',
    count: 'subskrybentów',
  } : {
    title: 'Subscribers',
    email: 'Email',
    date: 'Subscribed',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    unsubscribe: 'Unsubscribe',
    noSubscribers: 'No subscribers',
    sendTitle: 'Send newsletter',
    subject: 'Subject',
    content: 'Content (HTML or text)',
    send: 'Send to all active subscribers',
    sending: 'Sending...',
    sent: 'Sent!',
    sendError: 'Send failed',
    count: 'subscribers',
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/newsletter');
      const data = await res.json();
      setSubscribers(data.data || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleUnsubscribe = async (id) => {
    setSubscribers(subscribers.map(s => s.id === id ? { ...s, is_active: false } : s));
    await fetch(`/api/newsletter?id=${id}`, { method: 'DELETE' });
  };

  const handleSend = async () => {
    if (!subject || !content) return;
    setSending(true);
    setSendResult('');

    const activeEmails = subscribers.filter(s => s.is_active).map(s => s.email);
    if (activeEmails.length === 0) {
      setSendResult(t.noSubscribers);
      setSending(false);
      return;
    }

    try {
      // Send via Resend API through our contact endpoint workaround
      // We'll send individual emails to each subscriber
      let sent = 0;
      for (const email of activeEmails) {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Newsletter',
            email: email,
            message: `NEWSLETTER_SEND:${subject}:::${content}`,
          }),
        });
        if (res.ok) sent++;
      }
      setSendResult(`${t.sent} (${sent}/${activeEmails.length})`);
      setSubject('');
      setContent('');
    } catch (err) {
      setSendResult(t.sendError);
    }
    setSending(false);
  };

  const activeCount = subscribers.filter(s => s.is_active).length;

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div>
      <div className="admin-form-card">
        <h3>{t.sendTitle}</h3>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {activeCount} {t.count}
        </p>
        <input
          placeholder={t.subject}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '0.75rem' }}
        />
        <textarea
          placeholder={t.content}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={6}
          style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', marginBottom: '0.75rem' }}
        />
        <button className="mark-read-btn" onClick={handleSend} disabled={sending}>
          {sending ? t.sending : t.send}
        </button>
        {sendResult && <p style={{ marginTop: '0.5rem', color: sendResult.includes('!') ? '#28a745' : '#dc3545', fontSize: '0.9rem' }}>{sendResult}</p>}
      </div>

      <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{t.title} ({subscribers.length})</h3>

      {subscribers.length === 0 ? (
        <p className="empty-text">{t.noSubscribers}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.email}</th>
              <th>{t.date}</th>
              <th>{t.status}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(s => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{new Date(s.subscribed_at).toLocaleDateString()}</td>
                <td>
                  <span style={{ color: s.is_active ? '#28a745' : '#dc3545' }}>
                    {s.is_active ? t.active : t.inactive}
                  </span>
                </td>
                <td>
                  {s.is_active && (
                    <button className="cancel-btn" onClick={() => handleUnsubscribe(s.id)}>{t.unsubscribe}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
