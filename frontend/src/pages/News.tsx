import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Newspaper, Calendar } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE, PLACEHOLDER_IMG } from '../config';

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  source: string;
  source_url: string;
  image: string;
  created_at: string;
}

export default function News() {
  const { t, currentLanguage } = useTranslation();
  const [news, setNews] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem('news_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return localStorage.getItem('news_list') === null;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    fetch(`${API_BASE}/get_news.php`)
      .then(res => res.json())
      .then(data => {
        setNews(data);
        try {
          localStorage.setItem('news_list', JSON.stringify(data));
        } catch (e) {
          console.warn("Failed to write news cache to localStorage", e);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '100px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ width: '4px', height: '32px', background: 'var(--accent)', borderRadius: '2px' }}></span>
          {t('news_title', 'Notícias')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginLeft: '19px' }}>{t('news_subtitle_desc', 'Fica a par de tudo o que acontece no mundo do cinema e do entretenimento.')}</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: 30 
      }}>
        {news.map(item => (
          <Link 
            to={`/news/${item.slug}`} 
            key={item.id} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="glass" style={{ 
              height: '100%', 
              overflow: 'hidden', 
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.borderColor = 'rgba(229, 9, 21, 0.3)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ position: 'relative', height: 220 }}>
                <img 
                  src={item.image || PLACEHOLDER_IMG} 
                  alt={item.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  padding: '15px', 
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: 1,
                    background: 'var(--accent)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    color: 'white'
                  }}>
                    {item.source}
                  </span>
                </div>
              </div>
              <div style={{ padding: 25, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ 
                  fontSize: 20, 
                  marginBottom: 15, 
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.title}
                </h3>
                
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 15, borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} /> {new Date(item.created_at).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-PT')}
                    </span>
                  </div>
                  <ExternalLink size={16} className="accent-text" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {news.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
          <Newspaper size={60} style={{ marginBottom: 20 }} />
          <h3>{t('news_none_published', 'Ainda não existem notícias publicadas.')}</h3>
        </div>
      )}
    </div>
  );
}
