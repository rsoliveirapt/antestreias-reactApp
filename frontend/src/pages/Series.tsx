import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Tv } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE, PLACEHOLDER_IMG } from '../config';

interface Media {
  id: number;
  name: string;
  slug: string;
  poster: string;
  tmdb_vote_average: number;
  local_vote_average: number;
  type: string;
}

export default function Series() {
  const { hasPermission } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const [series, setSeries] = useState<Media[]>(() => {
    try {
      const saved = localStorage.getItem(`series_list_${currentLanguage}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return localStorage.getItem(`series_list_${currentLanguage}`) === null;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    fetch(`${API_BASE}/movies.php?lang=${currentLanguage}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((d: any) => d.type === 'series');
        setSeries(filtered);
        try {
          localStorage.setItem(`series_list_${currentLanguage}`, JSON.stringify(filtered));
        } catch (e) {
          console.warn("Failed to write series cache to localStorage", e);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentLanguage]);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  if (!hasPermission('view_titles')) {
    return (
      <div className="container" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, marginBottom: 15 }}>{t('restricted_access', 'Acesso Restrito')}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          {t('series_restricted_desc', 'Lamentamos, mas a tua conta não tem permissão para visualizar o catálogo de Séries.')}
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '100px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ width: '4px', height: '32px', background: 'var(--accent)', borderRadius: '2px' }}></span>
          {t('nav_series', 'Séries')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginLeft: '19px' }}>{t('series_subtitle', 'As melhores produções televisivas para maratonar.')}</p>
      </div>

      {series.length > 0 ? (
        <div className="movie-grid">
          {series.map(item => (
            <Link to={`/series/${item.slug || item.id}`} key={item.id} className="movie-card">
              <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} />
              <div className="movie-info">
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffc800', fontSize: 13, fontWeight: 700 }}>
                    <Star size={12} fill="#ffc800" /> {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 ? Number(item.tmdb_vote_average).toFixed(1) : '-'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
                    <Star size={12} fill="var(--accent)" /> {item.local_vote_average && Number(item.local_vote_average) > 0 ? Number(item.local_vote_average).toFixed(1) : '-'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
          <Tv size={60} style={{ marginBottom: 20 }} />
          <h3>{t('series_none_found', 'Nenhuma série encontrada.')}</h3>
        </div>
      )}
    </div>
  );
}
