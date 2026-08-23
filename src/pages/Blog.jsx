import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Blog.css';

export default function Blog() {
  const { language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  const t = language === 'pl' ? {
    title: 'Blog',
    subtitle: 'Artykuły o terapii i zdrowiu',
    noPosts: 'Brak artykułów',
    back: '← Wróć do listy',
    readMore: 'Czytaj więcej',
  } : {
    title: 'Blog',
    subtitle: 'Articles about therapy and health',
    noPosts: 'No articles yet',
    back: '← Back to list',
    readMore: 'Read more',
  };

  useEffect(() => {
    fetch('/api/posts').then(r => r.json()).then(data => setPosts(data.data || [])).catch(() => {});
  }, []);

  if (selectedPost) {
    const title = language === 'pl' ? selectedPost.title_pl : selectedPost.title_en;
    const content = language === 'pl' ? selectedPost.content_pl : selectedPost.content_en;
    return (
      <div className="blog-page">
        <div className="container" style={{ padding: '3rem 2rem' }}>
          <button className="blog-back" onClick={() => setSelectedPost(null)}>{t.back}</button>
          <article className="blog-article">
            <h1>{title}</h1>
            <p className="blog-date">{new Date(selectedPost.created_at).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')}</p>
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <div className="blog-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="container" style={{ padding: '3rem 2rem' }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>{t.noPosts}</p>
        ) : (
          <div className="blog-grid">
            {posts.map(post => (
              <div key={post.id} className="blog-card" onClick={() => setSelectedPost(post)}>
                <h2>{language === 'pl' ? post.title_pl : post.title_en}</h2>
                <p className="blog-date">{new Date(post.created_at).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')}</p>
                <p className="blog-excerpt">
                  {(language === 'pl' ? post.content_pl : post.content_en).substring(0, 150)}...
                </p>
                <span className="blog-read-more">{t.readMore} →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
