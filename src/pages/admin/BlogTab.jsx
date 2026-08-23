import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function BlogTab() {
  const { language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title_pl: '', title_en: '', content_pl: '', content_en: '', slug: '' });

  const t = language === 'pl' ? {
    add: 'Dodaj artykuł', edit: 'Edytuj', delete: 'Usuń', save: 'Zapisz', cancel: 'Anuluj',
    publish: 'Opublikuj', unpublish: 'Ukryj', published: 'Opublikowany', draft: 'Szkic',
    titlePL: 'Tytuł (PL)', titleEN: 'Tytuł (EN)', contentPL: 'Treść (PL)', contentEN: 'Treść (EN)',
    slug: 'Slug (URL)', noPosts: 'Brak artykułów',
  } : {
    add: 'Add article', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
    publish: 'Publish', unpublish: 'Unpublish', published: 'Published', draft: 'Draft',
    titlePL: 'Title (PL)', titleEN: 'Title (EN)', contentPL: 'Content (PL)', contentEN: 'Content (EN)',
    slug: 'Slug (URL)', noPosts: 'No articles',
  };

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts?all=true');
    const data = await res.json();
    setPosts(data.data || []);
  };

  const handleSave = async () => {
    if (!form.title_pl || !form.content_pl) return;
    if (editing) {
      await fetch(`/api/posts?id=${editing}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setEditing(null);
    setForm({ title_pl: '', title_en: '', content_pl: '', content_en: '', slug: '' });
    fetchPosts();
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ title_pl: p.title_pl, title_en: p.title_en, content_pl: p.content_pl, content_en: p.content_en, slug: p.slug });
  };

  const handleDelete = async (id) => {
    await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  const handleTogglePublish = async (p) => {
    await fetch(`/api/posts?id=${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, is_published: !p.is_published }),
    });
    fetchPosts();
  };

  return (
    <div>
      <div className="admin-form-card">
        <h3>{editing ? t.edit : t.add}</h3>
        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <input placeholder={t.titlePL} value={form.title_pl} onChange={e => setForm({ ...form, title_pl: e.target.value })} />
          <input placeholder={t.titleEN} value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} />
        </div>
        <input placeholder={t.slug} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.75rem' }} />
        <textarea placeholder={t.contentPL} value={form.content_pl} onChange={e => setForm({ ...form, content_pl: e.target.value })} rows={6} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.75rem', fontFamily: 'inherit' }} />
        <textarea placeholder={t.contentEN} value={form.content_en} onChange={e => setForm({ ...form, content_en: e.target.value })} rows={6} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.75rem', fontFamily: 'inherit' }} />
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button className="mark-read-btn" onClick={handleSave}>{t.save}</button>
          {editing && <button className="cancel-btn" onClick={() => { setEditing(null); setForm({ title_pl: '', title_en: '', content_pl: '', content_en: '', slug: '' }); }}>{t.cancel}</button>}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="empty-text">{t.noPosts}</p>
      ) : (
        <div className="messages-cards">
          {posts.map(p => (
            <div key={p.id} className={`message-card ${p.is_published ? 'read' : 'unread'}`}>
              <div className="message-header">
                <strong>{language === 'pl' ? p.title_pl : p.title_en}</strong>
                <span className="message-date">{p.is_published ? t.published : t.draft}</span>
              </div>
              <p className="message-body" style={{ whiteSpace: 'pre-wrap' }}>
                {(language === 'pl' ? p.content_pl : p.content_en).substring(0, 200)}...
              </p>
              <div className="message-actions">
                <button className="mark-read-btn" onClick={() => handleEdit(p)}>{t.edit}</button>
                <button className="cancel-btn" onClick={() => handleTogglePublish(p)}>{p.is_published ? t.unpublish : t.publish}</button>
                <button className="delete-btn" onClick={() => handleDelete(p.id)}>{t.delete}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
