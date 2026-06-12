import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Star } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE, PLACEHOLDER_IMG } from '../config';

export default function Contests() {
  const { t } = useTranslation();
  const [titles, setTitles] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('contests_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return localStorage.getItem('contests_list') === null;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    fetch(`${API_BASE}/titles_with_contests.php`)
      .then(res => res.json())
      .then(data => {
        setTitles(data);
        try {
          localStorage.setItem('contests_list', JSON.stringify(data));
        } catch (e) {
          console.warn("Failed to write contests cache to localStorage", e);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ width: '4px', height: '32px', background: 'var(--accent)', borderRadius: '2px' }}></span>
          {t('contests_title', 'Passatempos')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginLeft: '19px' }}>
          {t('contests_subtitle_desc', 'Habilita-te a ganhar convites duplos e outros prémios exclusivos.')}
        </p>
      </div>

      <div className="movie-grid">
        {titles.map(item => (
          <Link to={`/movie/${item.slug}`} key={item.id} className="movie-card" style={{ 
            filter: item.is_active ? 'none' : 'grayscale(1)',
            opacity: item.is_active ? 1 : 0.6,
            pointerEvents: 'auto'
          }}>
            <div style={{ position: 'relative' }}>
              <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: item.is_active ? 'var(--accent)' : '#222222',
                color: 'white',
                padding: '6px 12px', borderRadius: 8, fontSize: 13,
                fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {item.is_active ? (
                  <><Ticket size={13} fill="white" /> {t('contests_active', 'ATIVO')}</>
                ) : (
                  <>{t('contests_ended_upper', 'TERMINADO')}</>
                )}
              </div>
            </div>
            <div className="movie-info">
              <h3>{item.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffc800', fontSize: 12, fontWeight: 700 }}>
                      <Star size={11} fill="#ffc800" /> {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 ? Number(item.tmdb_vote_average).toFixed(1) : '-'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>
                      <Star size={11} fill="var(--accent)" /> {item.local_vote_average && Number(item.local_vote_average) > 0 ? Number(item.local_vote_average).toFixed(1) : '-'}
                    </span>
                  </div>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {item.type === 'movie' ? t('media_type_movie', 'Filme') : t('media_type_series', 'Série')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {titles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
          <Ticket size={60} style={{ marginBottom: 20 }} />
          <h3>{t('contests_none_active', 'De momento não existem passatempos ativos.')}</h3>
          <p>{t('contests_stay_tuned', 'Fica atento às nossas redes sociais para futuras novidades!')}</p>
        </div>
      )}
    </div>
  );
}
