import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { API_BASE, PLACEHOLDER_IMG } from '../config';
import AdSlot from '../components/AdSlot';
import { sanitizeHTML } from '../utils/sanitize';
import { useTranslation } from '../context/LanguageContext';

export default function ReviewDetail() {
  const { slug } = useParams();
  const { t, currentLanguage } = useTranslation();
  const [review, setReview] = useState<any>(null);
  const [otherReviews, setOtherReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/review_detail.php?slug=${slug}&lang=${currentLanguage}`).then(res => res.json()),
      fetch(`${API_BASE}/titles_with_reviews.php?lang=${currentLanguage}`).then(res => res.json())
    ])
    .then(([reviewData, otherData]) => {
      setReview(reviewData);
      if (reviewData && !reviewData.error) {
        setOtherReviews(otherData.filter((t: any) => t.id !== reviewData.reviewable_id));
        const siteName = localStorage.getItem('site_name') || 'Antestreias';
        document.title = `${siteName} - ${t('review_meta_title_critic', 'Crítica:')} ${reviewData.title_name}`;
      }
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [slug, currentLanguage, t]);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;
  if (!review || review.error) return (
    <div className="container" style={{ paddingTop: 120, textAlign: 'center' }}>
      <h2>{t('review_not_found_title', 'Crítica não encontrada')}</h2>
      <Link to="/reviews" className="btn-primary" style={{ marginTop: 20 }}>{t('review_back_to_reviews', 'Voltar às críticas')}</Link>
    </div>
  );


  return (
    <div className="review-detail-page" style={{ paddingBottom: 100 }}>
      {/* Hero Backdrop Section */}
      <div style={{ 
        position: 'relative', 
        height: '60vh', 
        minHeight: 450,
        width: '100%', 
        overflow: 'hidden',
        background: '#000'
      }}>
        {review.title_backdrop ? (
          <img 
            src={review.title_backdrop} 
            alt="" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              filter: 'brightness(0.4)'
            }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1a1a1a, #0a0a0a)' }} />
        )}
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 5% 40px 5%'
        }}>
          <div className="container" style={{ maxWidth: 1200 }}>
            
            <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
              <img src={review.title_poster} style={{ width: 140, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                  {review.title_type === 'tv' ? t('review_tv_show_critic', 'Crítica de Série') : t('review_movie_critic', 'Crítica de Filme')}
                </div>
                <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{review.title_name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'white', padding: '8px 20px', borderRadius: 30, fontWeight: 800, fontSize: 18, boxShadow: '0 10px 20px rgba(229, 9, 21, 0.3)' }}>
                    <Star size={20} fill="white" /> {Number(review.score).toFixed(1)} / 10
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1200, marginTop: 60 }}>
        <div className="glass-panel" style={{ padding: 40, position: 'relative', overflow: 'hidden' }}>
          
          {/* Author Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 40, paddingBottom: 30, borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)' }}>
              {review.avatar ? <img src={review.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'white', fontWeight: 800 }}>{review.username?.[0].toUpperCase()}</div>}
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('review_written_by', 'Escrito por')}</div>
              <Link to={`/perfil/@${review.username}`} style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', textDecoration: 'none' }}>{review.username}</Link>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('review_published_at', 'Publicado em')}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{new Date(review.created_at).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Review Body */}
          <div 
            className="review-content" 
            style={{ fontSize: 19, lineHeight: 1.9, color: 'var(--text-primary)', opacity: 0.9, marginBottom: 60 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(review.body) }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40, borderTop: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => window.history.back()} 
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 30px', borderRadius: 12, fontSize: 15, fontWeight: 700 }}
            >
              <ArrowLeft size={18} /> {t('review_back_to_reviews', 'Voltar às críticas')}
            </button>
          </div>
        </div>

        {/* Advertisement Slot */}
        <div style={{ marginTop: 60 }}>
          <AdSlot slot="bottom" />
        </div>

        {/* More Reviews Section */}
        {otherReviews.length > 0 && (
          <div style={{ marginTop: 100 }}>
            <h2 style={{ fontSize: '32px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ width: '4px', height: '32px', background: 'var(--accent)', borderRadius: '2px' }}></span>
              {t('review_more_reviews', 'Mais Críticas')}
            </h2>
            <div className="movie-grid" style={{ 
              paddingTop: '10px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '20px'
            }}>
              {otherReviews.slice(0, 12).map(item => (
                <Link to={`/review/${item.slug}`} key={item.id} className="movie-card" style={{ fontSize: '14px' }}>
                  <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} style={{ borderRadius: '10px' }} />
                  <div className="movie-info" style={{ padding: '12px' }}>
                    <h3 style={{ fontSize: 14, marginBottom: 6 }}>{item.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffc800', fontSize: 11, fontWeight: 700 }}>
                        <Star size={10} fill="#ffc800" /> {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 ? Number(item.tmdb_vote_average).toFixed(1) : '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>
                        <Star size={10} fill="var(--accent)" /> {item.local_score && Number(item.local_score) > 0 ? Number(item.local_score).toFixed(1) : '-'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
