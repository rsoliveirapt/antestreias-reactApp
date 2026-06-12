import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, User, FileText, ChevronRight } from 'lucide-react';
import { API_BASE } from '../config';
import { useTranslation } from '../context/LanguageContext';

import { sanitizeHTML } from '../utils/sanitize';

export default function CustomPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    fetchPage();
    window.scrollTo(0, 0);
  }, [slug, currentLanguage]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_page.php?slug=${slug}&lang=${currentLanguage}`);
      if (!res.ok) {
        setPage(null);
        return;
      }
      const data = await res.json();
      if (data && data.error) {
        setPage(null);
      } else {
        setPage(data);
        if (data && data.title) {
          const siteName = localStorage.getItem('site_name') || 'Antestreias';
          document.title = `${siteName} - ${data.title}`;
        }
      }
    } catch (err) {
      console.error('Failed to fetch page');
      setPage(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '100px 0', textAlign: 'center', color: 'white' }}>{t('loading', 'A carregar...')}</div>;
  if (!page) return (
    <div style={{ padding: '100px 0', textAlign: 'center', color: 'white' }}>
      <h1>{t('page_not_found', 'Página não encontrada')}</h1>
      <p>{t('page_not_found_desc', 'A página que procura não existe ou foi removida.')}</p>
      <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: 20 }}>{t('btn_back_home', 'Voltar ao Início')}</Link>
    </div>
  );

  return (
    <div className="custom-page-view" style={{ minHeight: '80vh', padding: '100px 0' }}>
      <div className="container">
        
        {/* Breadcrumbs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 40 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav_home', 'Início')}</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{page.title}</span>
        </nav>

        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 60, paddingBottom: 24, borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(229, 9, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText color="var(--accent)" size={28} />
            </div>
            <div>
              <h1 className="gradient-text" style={{ fontSize: 36, margin: 0, paddingBottom: 2 }}>{page.title}</h1>
              <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: 16, marginTop: 4, fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} />
                    {page.updated_at && page.updated_at !== 'null' && page.updated_at !== '0000-00-00 00:00:00'
                      ? t('page_updated_at', 'Atualizado em {date}').replace('{date}', page.updated_at)
                      : t('page_updated_recently', 'Atualizado recentemente')}
                  </span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {t('page_author_format', 'Por {author}').replace('{author}', page.owner || 'Antestreias')}</span>
              </div>
            </div>
          </div>
        </header>

        <article 
          className="page-content" 
          style={{ color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(page.content) }}
        />
      </div>

      <style>{`
        .page-content h2 { color: var(--text-primary); margin-top: 40px; margin-bottom: 20px; font-size: 28px; }
        .page-content p { margin-bottom: 24px; }
        .page-content ul, .page-content ol { margin-bottom: 24px; padding-left: 20px; }
        .page-content li { margin-bottom: 12px; }
        .page-content strong { color: var(--text-primary); }
        @media print {
          .admin-nav, .footer, .action-btn, nav { display: none !important; }
          body { background: white !important; color: black !important; }
          .custom-page-view { padding: 0 !important; }
          .page-content, h1 { color: black !important; }
        }
      `}</style>
    </div>
  );
}
