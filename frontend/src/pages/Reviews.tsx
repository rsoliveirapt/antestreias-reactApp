import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE, PLACEHOLDER_IMG } from '../config';

const extractSlogan = (html: string) => {
  if (!html) return '';
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  let text = tempDiv.textContent || tempDiv.innerText || "";
  if (text.length > 120) return text.substring(0, 120) + '...';
  return text;
};

export default function Reviews() {
  const { t, currentLanguage } = useTranslation();
  const [titles, setTitles] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`reviews_list_${currentLanguage}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return localStorage.getItem(`reviews_list_${currentLanguage}`) === null;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    fetch(`${API_BASE}/titles_with_reviews.php?lang=${currentLanguage}`)
      .then(res => res.json())
      .then(data => {
        setTitles(data);
        try {
          localStorage.setItem(`reviews_list_${currentLanguage}`, JSON.stringify(data));
        } catch (e) {
          console.warn("Failed to write reviews cache to localStorage", e);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentLanguage]);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ width: '4px', height: '32px', background: 'var(--accent)', borderRadius: '2px' }}></span>
          {t('reviews_title', 'Críticas')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginLeft: '19px' }}>
          {t('reviews_subtitle_desc', 'Descobre o que a nossa equipa e comunidade pensam sobre os últimos lançamentos.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '30px' }}>
        {titles.map(item => (
          <Link to={`/review/${item.slug}`} key={item.id} className="review-card-cinematic">
            <div className="card-clip-box">
              <img className="bg-img" src={item.backdrop || item.poster || PLACEHOLDER_IMG} alt={item.name} />
              
              <div className="card-overlay">
                <div style={{ 
                   position: 'absolute', top: 20, right: 20, 
                   background: 'var(--accent)', 
                   padding: '8px 16px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 6, 
                   boxShadow: '0 8px 25px rgba(229, 9, 21, 0.4)',
                   border: '1px solid rgba(255,255,255,0.1)',
                   pointerEvents: 'auto'
                 }}>
                  <Star size={16} fill="white" color="white" /> 
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{Number(item.local_score).toFixed(1)}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', pointerEvents: 'auto' }}>
                  <div>
                    <h3 style={{ 
                       fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: 'white',
                       textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                       display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                     }}>
                      {item.name}
                    </h3>
                    <p style={{ 
                       fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: '0 0 15px 0',
                       display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                       lineHeight: 1.5, textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                     }}>
                      "{extractSlogan(item.latest_review_body)}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <span style={{ 
                         fontSize: 13, background: '#ffc800',
                         padding: '4px 10px', borderRadius: 8, color: 'black', fontWeight: 700,
                         display: 'flex', alignItems: 'center', gap: 5
                       }}>
                        <Star size={11} fill="black" color="black" /> TMDB {Number(item.tmdb_vote_average).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </Link>
        ))}
      </div>

      {titles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
          <MessageSquare size={60} style={{ marginBottom: 20 }} />
          <h3>{t('reviews_none_evaluated', 'Ainda não existem títulos avaliados.')}</h3>
        </div>
      )}
    </div>
  );
}
