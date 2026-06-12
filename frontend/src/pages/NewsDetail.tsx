import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Calendar, Globe, ArrowLeft, Shuffle } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE } from '../config';

import AdSlot from '../components/AdSlot';

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  body: string;
  image: string;
  source: string;
  source_url: string;
  created_at: string;
}

export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const [news, setNews] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/get_news_detail.php?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        setNews(data);
        setLoading(false);
        window.scrollTo(0, 0);
        if (data && data.title) {
          const siteName = localStorage.getItem('site_name') || 'Antestreias';
          document.title = `${siteName} - ${data.title}`;
        }
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleRandom = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_random_news.php?exclude=${slug}`);
      const data = await res.json();
      if (data.slug) {
        navigate(`/news/${data.slug}`);
      }
    } catch (err) {
      console.error('Failed to get random news');
    }
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;
  if (!news) return <div className="container" style={{ paddingTop: 150, textAlign: 'center' }}><h1>{t('news_not_found', 'Notícia não encontrada')}</h1><Link to="/news" className="btn-primary" style={{ marginTop: 20 }}>{t('btn_back', 'Voltar')}</Link></div>;

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Hero Banner Section */}
      <div style={{ 
        position: 'relative', 
        height: '60vh', 
        minHeight: 450,
        width: '100%', 
        overflow: 'hidden' 
      }}>
        <img 
          src={news.image} 
          alt="" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            filter: 'brightness(0.4)'
          }} 
        />
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 5% 60px 5%'
        }}>
          <div className="container">
            <div style={{ maxWidth: 900 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
                <span style={{ 
                  background: 'var(--accent)', 
                  color: 'white', 
                  padding: '6px 16px', 
                  borderRadius: 6, 
                  fontSize: 12, 
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  {news.source}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                  <Calendar size={16} /> {new Date(news.created_at).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-PT')}
                </span>
              </div>
              
              <h1 className="news-detail-title" style={{ 
                fontSize: 'clamp(32px, 5vw, 56px)', 
                lineHeight: 1.1, 
                fontWeight: 900,
                textShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                {news.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container" style={{ marginTop: 60 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <AdSlot slot="news-top" />
          </div>
          
          <div style={{ 
            fontSize: 19, 
            lineHeight: 1.9, 
            color: 'var(--text-primary)', 
            marginBottom: 60,
            whiteSpace: 'pre-line',
            fontWeight: 400
          }}>
            {news.body || t('news_no_content', 'Conteúdo não disponível para esta notícia.')}
            
            {(!news.body || news.body.length < 300) && (
              <div style={{ marginTop: 40, padding: '25px', borderLeft: '4px solid var(--accent)', background: 'var(--bg-secondary)', borderRadius: '0 12px 12px 0' }}>
                <p style={{ fontStyle: 'italic', opacity: 0.8 }}>
                  {t('news_imported_notice_prefix', 'Esta notícia foi importada automaticamente da fonte ')}
                  <strong>{news.source}</strong>
                  {t('news_imported_notice_suffix', '. A nossa equipa editorial está a trabalhar para expandir esta cobertura.')}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 40 }}>
            <AdSlot slot="news-bottom" />
          </div>

          <div className="glass" style={{ 
            padding: 40, 
            textAlign: 'center', 
            borderRadius: 24,
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            marginBottom: 40
          }}>
            <Globe size={40} className="accent-text" style={{ marginBottom: 20 }} />
            <h3 style={{ fontSize: 24, marginBottom: 15 }}>{t('news_continue_reading', 'Continuar a ler?')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30, fontSize: 16 }}>
              {t('news_read_full_prefix', 'Podes ler o artigo completo e todos os detalhes originais diretamente no portal')} <strong>{news.source}</strong>.
            </p>
            <a 
              href={news.source_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: '16px 40px',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 50,
                boxShadow: '0 10px 20px rgba(229, 9, 21, 0.3)'
              }}
            >
              {t('news_read_original', 'Ler artigo original')} <ExternalLink size={20} />
            </a>
          </div>

          <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/news')} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '12px 25px', 
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <ArrowLeft size={18} /> {t('btn_back_prev', 'Voltar atrás')}
            </button>
            <button 
              onClick={handleRandom} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '12px 25px', 
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <Shuffle size={18} /> {t('news_read_another', 'Ler outra notícia')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
