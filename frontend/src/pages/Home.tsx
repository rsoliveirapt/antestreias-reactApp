import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Ticket, ChevronRight, ArrowLeft } from 'lucide-react';
import Slider from '../components/Slider';
import AdSlot from '../components/AdSlot';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { slugify } from '../utils/slugify';
import { API_BASE, PLACEHOLDER_IMG } from '../config';

interface Media {
  id: number;
  name: string;
  slug: string;
  poster: string;
  backdrop: string;
  description: string;
  tmdb_vote_average: number;
  local_vote_average: number;
  type: string;
}

export default function Home() {
  const { hasPermission } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const [movies, setMovies] = useState<Media[]>(() => {
    try {
      const saved = localStorage.getItem(`home_movies_${currentLanguage}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [series, setSeries] = useState<Media[]>(() => {
    try {
      const saved = localStorage.getItem(`home_series_${currentLanguage}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [homepageType, setHomepageType] = useState(() => {
    return localStorage.getItem('home_homepage_type') || 'landingPage';
  });
  const [sliderSettings, setSliderSettings] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('home_slider_settings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [latestReview, setLatestReview] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`home_latest_review_${currentLanguage}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [contests, setContests] = useState<Media[]>(() => {
    try {
      const saved = localStorage.getItem(`home_contests_${currentLanguage}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const hasCachedData = localStorage.getItem(`home_movies_${currentLanguage}`) !== null;
      return !hasCachedData;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/movies.php?lang=${currentLanguage}&t=${Date.now()}`).then(res => res.json()),
      fetch(`${API_BASE}/admin_settings.php`).then(res => res.json()),
      fetch(`${API_BASE}/admin_appearance.php`).then(res => res.json()),
      fetch(`${API_BASE}/latest_review.php?lang=${currentLanguage}`).then(res => res.json()),
      fetch(`${API_BASE}/titles_with_contests.php?lang=${currentLanguage}`).then(res => res.json())
    ]).then(([mediaData, settings, appearance, review, contestsData]) => {
      const hType = settings['homepage.type'] || 'landingPage';
      const mList = mediaData.filter((d: any) => d.type === 'movie');
      const sList = mediaData.filter((d: any) => d.type === 'series');
      const cList = Array.isArray(contestsData) ? contestsData.filter((c: any) => c.is_active == 1) : [];

      setHomepageType(hType);
      setMovies(mList);
      setSeries(sList);
      setSliderSettings(appearance);
      setLatestReview(review);
      setContests(cList);

      try {
        localStorage.setItem(`home_movies_${currentLanguage}`, JSON.stringify(mList));
        localStorage.setItem(`home_series_${currentLanguage}`, JSON.stringify(sList));
        localStorage.setItem('home_homepage_type', hType);
        localStorage.setItem('home_slider_settings', JSON.stringify(appearance));
        localStorage.setItem(`home_latest_review_${currentLanguage}`, JSON.stringify(review));
        localStorage.setItem(`home_contests_${currentLanguage}`, JSON.stringify(cList));
      } catch (e) {
        console.warn("Failed to write home page cache to localStorage", e);
      }

      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [currentLanguage]);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  if (!hasPermission('view_titles')) {
    return (
      <div className="container" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, marginBottom: 15 }}>{t('home_restricted_access', 'Acesso Restrito')}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          {t('home_restricted_desc', 'Lamentamos, mas a tua conta não tem permissão para visualizar o catálogo de Filmes & Séries. Contacta a administração se achas que isto é um erro.')}
        </p>
      </div>
    );
  }

  // Handle different homepage types
  if (homepageType === 'loginPage') {
    return (
      <div className="container" style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h1 className="gradient-text">{t('auth_login_title', 'Iniciar Sessão')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('home_login_soon', 'O login será implementado em breve.')}</p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setHomepageType('landingPage')}>{t('home_view_premieres', 'Ver Antestreias')}</button>
        </div>
      </div>
    );
  }

  if (homepageType === 'registerPage') {
    return (
      <div className="container" style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h1 className="gradient-text">{t('auth_register_title', 'Criar Nova Conta')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('home_register_soon', 'O registo será implementado em breve.')}</p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setHomepageType('landingPage')}>{t('home_view_premieres', 'Ver Antestreias')}</button>
        </div>
      </div>
    );
  }

  let sliderItems: Media[] = [];
  if (sliderSettings['slider.enabled'] !== '0') {
    let allMedia = [...movies, ...series];
    const count = parseInt(sliderSettings['slider.count'] || '5');

    if (sliderSettings['slider.type'] === 'manual') {
      const ids = sliderSettings['slider.manual_ids'] ? sliderSettings['slider.manual_ids'].split(',') : [];
      sliderItems = ids.map((id: string) => allMedia.find(m => m.id.toString() === id)).filter(Boolean);
    } else if (sliderSettings['slider.type'] === 'featured') {
      sliderItems = [...allMedia].sort((a, b) => (b.tmdb_vote_average || 0) - (a.tmdb_vote_average || 0)).slice(0, count);
    } else {
      sliderItems = [...movies.slice(0, Math.ceil(count / 2)), ...series.slice(0, Math.floor(count / 2))].slice(0, count);
    }
    sliderItems = sliderItems.slice(0, count);
  }

  return (
    <>
      {sliderItems.length > 0 && (
        <Slider
          movies={sliderItems}
          autoplay={sliderSettings['slider.autoplay'] !== '0'}
          intervalMs={parseInt(sliderSettings['slider.interval'] || '5000')}
        />
      )}
      <div className="container" style={{ paddingBottom: '100px' }}>

        {contests.length > 0 && (
          <>
            <div className="home-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '60px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '32px', margin: 0, borderLeft: '4px solid var(--accent)', paddingLeft: '15px', lineHeight: 1.1 }}>
                {t('home_active_contests', 'Passatempos Ativos')}
              </h2>
              <div className="home-section-controls" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link to="/contests" className="btn-view-all" style={{
                  fontSize: '13px',
                  color: 'white',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  padding: '8px 16px',
                  borderRadius: '100px',
                  border: 'none',
                  transition: '0.3s'
                }}>
                  {t('home_view_all', 'Ver todos')} <ChevronRight size={14} />
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => document.getElementById('contests-row')?.scrollBy({ left: -400, behavior: 'smooth' })}
                    className="nav-arrow"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onClick={() => document.getElementById('contests-row')?.scrollBy({ left: 400, behavior: 'smooth' })}
                    className="nav-arrow"
                  >
                    <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              </div>
            </div>
            <div id="contests-row" className="home-scroll-row hide-scrollbar" style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              paddingBottom: '20px',
              scrollBehavior: 'smooth',
              width: '100%'
            }}>
              {contests.map(item => (
                <Link to={`/movie/${slugify(item.name)}`} key={item.id} className="movie-card" style={{ flex: '0 0 220px' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} />
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      background: 'var(--accent)', color: 'white',
                      padding: '4px 10px', borderRadius: 8, fontSize: 11,
                      fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <Ticket size={11} fill="white" /> {t('contests_active', 'ATIVO')}
                    </div>
                  </div>
                  <div className="movie-info">
                    <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffc800', fontSize: 13, fontWeight: 700 }}>
                        <Star size={12} fill="#ffc800" /> {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 ? Number(item.tmdb_vote_average).toFixed(1) : '-'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="home-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '60px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', margin: 0, borderLeft: '4px solid var(--accent)', paddingLeft: '15px', lineHeight: 1.1 }}>
            {t('home_explore_catalog', 'Explorar Catálogo')}
          </h2>
          <div className="home-section-controls" style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => document.getElementById('catalog-row')?.scrollBy({ left: -400, behavior: 'smooth' })}
              className="nav-arrow"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => document.getElementById('catalog-row')?.scrollBy({ left: 400, behavior: 'smooth' })}
              className="nav-arrow"
            >
              <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>

        {[...movies, ...series].length > 0 ? (
          <div id="catalog-row" className="home-scroll-row hide-scrollbar" style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '20px',
            scrollBehavior: 'smooth',
            width: '100%'
          }}>
            {[...movies, ...series].map(item => (
              <Link to={`/movie/${slugify(item.name)}`} key={`${item.type}-${item.id}`} className="movie-card" style={{ flex: '0 0 220px' }}>
                <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} />
                <div className="movie-info">
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffc800', fontSize: 13, fontWeight: 700 }}>
                      <Star size={12} fill="#ffc800" /> {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 ? Number(item.tmdb_vote_average).toFixed(1) : '-'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {item.type === 'series' ? t('search_series', 'Série') : t('search_movie', 'Filme')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>{t('home_no_content', 'Nenhum conteúdo disponível.')}</p>
        )}

        {latestReview && (
          <div style={{ marginTop: '80px' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '30px', borderLeft: '4px solid var(--accent)', paddingLeft: '15px', lineHeight: 1.1 }}>
              {t('home_latest_review', 'Última Crítica')}
            </h2>
            <Link to={`/review/${latestReview.title_slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="latest-review-wrapper" style={{
                display: 'flex',
                gap: '30px',
                alignItems: 'flex-start',
                transition: 'transform 0.3s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <img
                  src={latestReview.title_poster || PLACEHOLDER_IMG}
                  alt={latestReview.title_name}
                  style={{ width: '150px', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <span className="latest-review-label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('home_review_of', 'Crítica de')}</span>
                      <h3 style={{ fontSize: '20px', color: 'var(--accent)', marginTop: '4px' }}>{latestReview.title_name}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 700, fontSize: '18px' }}>
                      <Star fill="var(--accent)" size={18} /> {latestReview.score} / 10
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                      {latestReview.avatar ? <img src={latestReview.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : latestReview.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="latest-review-meta" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <strong className="latest-review-author" style={{ color: 'white' }}>{latestReview.first_name || latestReview.username}</strong>
                      <span style={{ margin: '0 8px', opacity: 0.5 }}>•</span>
                      {new Date(latestReview.created_at).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <p className="latest-review-body" style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {latestReview.body}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        <AdSlot slot="homepage-bottom" style={{ marginTop: '60px' }} />
      </div>
      <style>{`
        .nav-arrow {
          background: transparent;
          border: none;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          padding: 8px;
        }
        .nav-arrow:hover {
          background: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(229, 9, 20, 0.4);
        }
        .btn-view-all:hover {
          background: transparent !important;
          color: var(--accent) !important;
          transform: translateY(-2px);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
