import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ticket, Calendar, Play, Star, Clock, Globe, DollarSign, Film, X, ArrowLeft, ChevronDown, Check, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdSlot from '../components/AdSlot';
import { API_BASE, PLACEHOLDER_IMG } from '../config';
import { showToast } from '../components/Toast';
import { sanitizeHTML } from '../utils/sanitize';
import { useTranslation } from '../context/LanguageContext';

interface MovieDetail {
  id: number; name: string; original_title: string; description: string;
  poster: string; backdrop: string; release_date: string; runtime: number;
  tagline: string; genre: string; certification: string; language: string;
  tmdb_vote_average: number; tmdb_vote_count: number; local_vote_average: number;
  popularity: number; budget: number; revenue: number; imdb_id: string;
  tmdb_id: number; country: string; type: string; is_series: number;
  affiliate_link: string; slug: string;
}
interface Contest { 
  id: number; 
  title_id: number;
  type: 'exclusive' | 'partner';
  require_login?: number | boolean;
  name: string; 
  details: string; 
  link: string; 
  partner_logo?: string;
  location?: string;
  end_date?: string;
  created_at?: string;
  tickets_count?: number;
  rules_link?: string;
  question?: string;
  has_winners?: boolean | number;
  winners?: string[];
}
interface Video { id: number; name: string; src: string; type: string; category: string; }
interface Review { id: number; title: string; body: string; score: number; created_at: string; username?: string; avatar?: string; }

const fmt = (n: number) => n ? `$${(n / 1e6).toFixed(1)}M` : null;
const fmtDate = (d: string, lang: string) => d ? new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

const getShortLocation = (loc?: string, nationalLabel: string = 'Nacional') => {
  if (!loc) return nationalLabel;
  return loc.split(',')
    .map(part => {
      const subParts = part.split(/[-–—:]/);
      return subParts[0].trim();
    })
    .join(', ');
};

const formatRulesLink = (link?: string) => {
  if (!link) return '/contest-rules';
  const trimmed = link.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.includes('.')) {
    return `https://${trimmed}`;
  }
  return `/${trimmed}`;
};

export default function Movie() {
  const { id } = useParams();
  const { user, hasPermission } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'en' ? 'en-US' : 'pt-PT';
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeVideoDbId, setActiveVideoDbId] = useState<number | null>(null);
  const [reportedVideoIds, setReportedVideoIds] = useState<Set<number>>(new Set());
  const [cast, setCast] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [appearance, setAppearance] = useState<any>(null);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [expandedContestId, setExpandedContestId] = useState<number | null>(null);
  const [participationForm, setParticipationForm] = useState({
    name: '',
    email: '',
    cc_bi: '',
    location: '',
    answer: '',
    instagram_link: '',
    age_confirm: false,
    terms_confirm: false
  });

  const handleOpenContestModal = (contest: Contest) => {
    setActiveContest(contest);
    setParticipationForm({
      name: user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '',
      email: user ? user.email : '',
      cc_bi: '',
      location: '',
      answer: '',
      instagram_link: '',
      age_confirm: false,
      terms_confirm: false
    });
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/movies_detail.php?id=${id}&lang=${currentLanguage}`)
      .then(r => r.json())
      .then(movieData => {
        if (!movieData || movieData.error) { setLoading(false); return; }
        setMovie(movieData);
        Promise.all([
          fetch(`${API_BASE}/contests.php?movie_id=${movieData.id}`).then(r => r.json()),
          fetch(`${API_BASE}/videos.php?movie_id=${movieData.id}`).then(r => r.json()),
          fetch(`${API_BASE}/title_details.php?id=${movieData.id}`).then(r => r.json()),
          fetch(`${API_BASE}/admin_appearance.php`).then(r => r.json()),
        ]).then(([c, v, details, app]) => {
          setContests(c || []);
          setVideos(v || []);
          setReviews(details.reviews || []);
          setCast(details.cast || []);
          setCrew(details.crew || []);
          setAppearance(app);
          setLoading(false);
          const siteName = (app && app['general.site_name']) || localStorage.getItem('site_name') || 'Antestreias';
          document.title = `${siteName} - ${movieData.name}`;
        });
      }).catch(() => setLoading(false));
  }, [id, currentLanguage]);

  const getYtId = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
    if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
    return url;
  };

  const trackVideoPlay = (videoId: number) => {
    fetch(`${API_BASE}/videos.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId }),
    }).catch(() => {});
  };

  const reportVideo = async (videoId: number) => {
    if (reportedVideoIds.has(videoId)) return;
    try {
      await fetch(`${API_BASE}/videos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_video_id: videoId }),
      });
      setReportedVideoIds(prev => new Set(prev).add(videoId));
    } catch { /* silent */ }
  };

  if (loading) return <div className="loader-container"><div className="spinner" /></div>;
  if (!movie) return (
    <div className="container" style={{ padding: '150px 20px', textAlign: 'center' }}>
      <h2>{t('movie_not_found', 'Título não encontrado')}</h2>
      <Link to="/" style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 20, display: 'inline-block' }}>← {t('btn_back', 'Voltar')}</Link>
    </div>
  );
  if (!hasPermission('view_titles')) return (
    <div className="container" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h2>{t('access_forbidden', 'Acesso Interdito')}</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 400, marginTop: 10 }}>{t('access_forbidden_desc', 'A tua conta não tem permissão para ver este título.')}</p>
    </div>
  );

  const genres = movie.genre ? movie.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
  const trailer = videos.find(v => v.category?.toLowerCase().includes('trailer') || v.type?.toLowerCase().includes('trailer'));
  const firstVideo = trailer || videos[0];

  return (
    <div>
      {/* ── HERO ── */}
      <div className="movie-hero-wrap" style={{ position: 'relative', minHeight: 560, display: 'flex', alignItems: 'flex-end' }}>
        {/* Backdrop */}
        {movie.backdrop && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${movie.backdrop})`,
            backgroundSize: 'cover', backgroundPosition: 'center top',
          }}>
            <div className="movie-backdrop-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.85) 100%)' }} />
            <div style={{ position: 'absolute', bottom: -2, left: -1, right: -1, height: 202, background: 'linear-gradient(to top, var(--bg-primary), transparent)' }} />
          </div>
        )}

        <div className="container movie-hero-inner" style={{ position: 'relative', zIndex: 2, paddingTop: 100, paddingBottom: 50, display: 'flex', gap: 40, alignItems: 'flex-end' }}>
          {/* Poster */}
          <div className="movie-hero-poster" style={{ flexShrink: 0, width: 220, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={movie.poster || PLACEHOLDER_IMG} alt={movie.name} style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, paddingBottom: 10 }}>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, margin: '8px 0 6px', lineHeight: 1.1, letterSpacing: '-1px', color: 'white' }}>{movie.name}</h1>
            {movie.original_title && movie.original_title !== movie.name && (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 10 }}>{movie.original_title}</p>
            )}
            {(movie.certification || movie.tagline) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                {movie.certification && (
                  <span style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.4)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, letterSpacing: 1, textTransform: 'uppercase', display: 'inline-block' }}>
                    {movie.certification}
                  </span>
                )}
                {movie.tagline && (
                  <p style={{ color: 'var(--accent)', fontSize: 15, fontStyle: 'italic', margin: 0 }}>
                    "{movie.tagline}"
                  </p>
                )}
              </div>
            )}

            {/* Meta pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
              {fmtDate(movie.release_date, currentLanguage) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  <Calendar size={14} /> {fmtDate(movie.release_date, currentLanguage)}
                </span>
              )}
              {movie.runtime > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  <Clock size={14} /> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ffc800', color: 'black', padding: '4px 12px', borderRadius: 6, fontSize: 14, fontWeight: 700 }}>
                  <Star size={13} fill="black" color="black" /> {movie.tmdb_vote_average && Number(movie.tmdb_vote_average) > 0 ? Number(movie.tmdb_vote_average).toFixed(1) : '-'} <span style={{ opacity: 0.7, fontWeight: 500 }}>TMDB</span>
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--accent)', color: 'white',
                  padding: '4px 12px', borderRadius: 6, fontSize: 14,
                  fontWeight: 700,
                }}>
                  <Star size={13} fill="white" color="white" /> {movie.local_vote_average && Number(movie.local_vote_average) > 0 ? Number(movie.local_vote_average).toFixed(1) : '-'} <span style={{ opacity: 0.8, fontWeight: 500, fontSize: 12 }}>Antestreias</span>
                </span>
              </div>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                {genres.map(g => (
                  <span key={g} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 6, fontSize: 13, color: 'white' }}>{g}</span>
                ))}
              </div>
            )}

            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.7, maxWidth: 680, marginBottom: 24 }}>{movie.description}</p>

            {/* Action buttons */}
            <div className="movie-action-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {firstVideo && hasPermission('view_videos') && hasPermission('play_videos') && (
                <button className="btn-primary" onClick={() => { setActiveVideo(getYtId(firstVideo.src)); setActiveVideoDbId(firstVideo.id); trackVideoPlay(firstVideo.id); }} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, padding: '12px 24px' }}>
                  <Play size={18} fill="currentColor" /> {t('movie_watch_trailer', 'Ver Trailer')}
                </button>
              )}
              {movie.affiliate_link && (
                <a href={movie.affiliate_link} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, padding: '12px 24px' }}>
                  <Film size={18} /> {t('movie_watch_movie', 'Ver Filme')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        
        {/* Contests - New Grid System (Full Width) */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '4px', height: '28px', background: 'var(--accent)', borderRadius: '2px' }}></span>
              <Ticket className="ticket-active-glow" size={24} style={{ color: 'var(--accent)' }} />
              {t('nav_contests', 'Passatempos')}
            </h2>
          </div>
          
          {(() => {
            const visibleContests = contests
              .filter(c => c.type !== 'exclusive' || hasPermission('view_contests'))
              .sort((a, b) => {
                const isEndedA = (a.end_date && new Date(a.end_date) < new Date()) || Number(a.has_winners) === 1;
                const isEndedB = (b.end_date && new Date(b.end_date) < new Date()) || Number(b.has_winners) === 1;

                if (!isEndedA && isEndedB) return -1;
                if (isEndedA && !isEndedB) return 1;

                const dateA = a.end_date ? new Date(a.end_date).getTime() : (isEndedA ? 0 : Infinity);
                const dateB = b.end_date ? new Date(b.end_date).getTime() : (isEndedB ? 0 : Infinity);

                if (!isEndedA) {
                  return dateA - dateB;
                } else {
                  return dateB - dateA;
                }
              });
            return visibleContests.length > 0 ? (
              <div className="contests-grid">
                {visibleContests.map((c, idx) => {
                  const isExpanded = expandedContestId === c.id;
                  const isEnded = (c.end_date && new Date(c.end_date) < new Date()) || Number(c.has_winners) === 1;
                  
                  return (
                    <div key={c.id} className={`contest-detail-card ${isEnded ? 'ended' : (c.type === 'exclusive' ? 'active-exclusive' : 'active-partner')}`}>
                      <div 
                        onClick={() => setExpandedContestId(prev => prev === c.id ? null : c.id)}
                        style={{ 
                          padding: '16px 20px', 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 16,
                          cursor: 'pointer',
                          background: isExpanded ? 'var(--contest-bg-subtle)' : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {c.type === 'partner' ? (
                              c.partner_logo ? (
                                <div style={{ height: 24 }}>
                                  <img src={c.partner_logo} alt="Partner" style={{ height: '100%', objectFit: 'contain', filter: 'var(--contest-logo-filter)' }} />
                                </div>
                              ) : <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--contest-text-primary)' }}>{t('contest_partner', 'Parceiro')}</span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {appearance?.['appearance.logo_light'] || appearance?.['appearance.logo_dark'] ? (
                                  <img src={appearance?.['appearance.logo_light'] || appearance?.['appearance.logo_dark']} alt="Antestreias" style={{ height: '20px', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--contest-text-primary)' }}>Antestreias</span>
                                )}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isEnded ? (
                                <span style={{ color: 'var(--contest-badge-text)', fontWeight: 800, fontSize: 9, letterSpacing: 0.5, background: 'var(--contest-badge-bg)', padding: '2px 6px', borderRadius: 4 }}>{t('contest_ended_badge', 'TERMINADO')}</span>
                              ) : (
                                <>
                                  {c.type === 'exclusive' ? (
                                    <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 9, letterSpacing: 0.5, background: 'rgba(229,9,20,0.1)', padding: '2px 6px', borderRadius: 4 }}>{t('contest_exclusive_badge', 'EXCLUSIVO')}</span>
                                  ) : (
                                    <span style={{ color: 'var(--contest-badge-text)', fontWeight: 800, fontSize: 9, letterSpacing: 0.5, background: 'var(--contest-badge-bg)', padding: '2px 6px', borderRadius: 4 }}>{t('contest_partner_badge', 'PARCEIRO')}</span>
                                  )}
                                  <span style={{ color: '#00E054', fontWeight: 800, fontSize: 9, letterSpacing: 0.5, background: 'rgba(0,220,100,0.1)', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Ticket size={10} fill="#00E054" className="ticket-active-glow" />
                                    {t('contest_active_badge', 'A DECORRER')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: isExpanded ? (c.type === 'exclusive' ? 'var(--accent)' : 'var(--contest-arrow-bg-active)') : 'var(--contest-arrow-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                            <ChevronDown size={16} style={{ transition: 'transform 0.4s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', color: 'var(--contest-arrow-color)' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--contest-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px 12px', marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('contest_start', 'Início')}: {c.created_at ? new Date(c.created_at).toLocaleDateString(locale) : '—'}</span>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--contest-dot-bg)' }}></span>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('contest_end', 'Fim')}: {c.end_date ? new Date(c.end_date).toLocaleString(locale, { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                            </div>
                          </div>

                          {!isExpanded && (
                            <div 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                color: 'var(--text-secondary)', 
                                fontSize: 10, 
                                opacity: 0.8, 
                                flexShrink: 1, 
                                minWidth: 0,
                                marginBottom: 2
                              }}
                              title={c.location || t('location_national', 'Nacional')}
                            >
                              <Globe size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
                              <span style={{ 
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}>
                                {getShortLocation(c.location, t('location_national', 'Nacional'))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Body - Expandable */}
                      {isExpanded && (
                        <div style={{ padding: '0 20px 20px', animation: 'modalSlideUp 0.4s ease' }}>
                          <div style={{ height: '1px', background: 'var(--contest-border-subtle)', marginBottom: 20 }}></div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                              <p style={{ color: 'var(--contest-text-secondary)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.7 }}>{c.details}</p>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                <div style={{ background: 'var(--contest-bg-subtle)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--contest-border-subtle)' }}>
                                  <div style={{ opacity: 0.5, marginBottom: 4, fontWeight: 700 }}>{t('contest_location_label', 'Local')}</div>
                                  <div style={{ fontWeight: 800, color: 'var(--contest-text-primary)', fontSize: 12 }}>{c.location || t('location_national', 'Nacional')}</div>
                                </div>
                                <div style={{ background: 'var(--contest-bg-subtle)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--contest-border-subtle)' }}>
                                  <div style={{ opacity: 0.5, marginBottom: 4, fontWeight: 700 }}>{t('contest_tickets_label', 'Convites')}</div>
                                  <div style={{ fontWeight: 800, color: 'var(--contest-text-primary)', fontSize: 12 }}>{c.tickets_count || '—'}</div>
                                </div>
                                <div style={{ background: 'var(--contest-bg-subtle)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--contest-border-subtle)' }}>
                                  <div style={{ opacity: 0.5, marginBottom: 4, fontWeight: 700 }}>{t('contest_start_label', 'Início')}</div>
                                  <div style={{ fontWeight: 800, color: 'var(--contest-text-primary)', fontSize: 12 }}>{c.created_at ? new Date(c.created_at).toLocaleDateString(locale) : '—'}</div>
                                </div>
                                <div style={{ background: 'var(--contest-bg-subtle)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--contest-border-subtle)' }}>
                                  <div style={{ opacity: 0.5, marginBottom: 4, fontWeight: 700 }}>{t('contest_end_label', 'Fim')}</div>
                                  <div style={{ fontWeight: 800, color: 'var(--contest-text-primary)', fontSize: 12 }}>{c.end_date ? new Date(c.end_date).toLocaleString(locale, { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                                </div>
                              </div>

                              {c.winners && c.winners.length > 0 && (
                                <div style={{ 
                                  marginTop: 20, 
                                  background: '#1d1516', 
                                  borderRadius: 12, 
                                  padding: '16px 20px' 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                    <Ticket size={16} /> {t('contest_winners_title', 'Vencedores do Passatempo')}
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {c.winners.map((w, idx) => (
                                      <div key={idx} style={{ background: 'var(--accent)', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'white', boxShadow: '0 4px 12px rgba(229,9,20,0.2)' }}>
                                        {w}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {isEnded ? (
                                <button 
                                  className="btn-secondary" 
                                  disabled
                                  style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 14, opacity: 0.5, cursor: 'not-allowed' }}
                                >
                                  {t('contest_ended_btn', 'Passatempo Terminado')}
                                </button>
                              ) : (
                                <>
                                  {c.type === 'exclusive' ? (
                                    (c.require_login === 1 || c.require_login === true) ? (
                                      user ? (
                                        hasPermission('participate_contests') ? (
                                          <button 
                                            className="btn-primary" 
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 14, boxShadow: '0 8px 24px rgba(229,9,20,0.2)' }}
                                            onClick={() => handleOpenContestModal(c)}
                                          >
                                            {t('contest_participate_now', 'Participar Agora')}
                                          </button>
                                        ) : (
                                          <button 
                                            className="btn-secondary" 
                                            disabled
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 14, opacity: 0.5, cursor: 'not-allowed' }}
                                          >
                                            {t('contest_no_permission', 'Sem permissão para participar')}
                                          </button>
                                        )
                                      ) : (
                                        <Link 
                                          to="/login"
                                          className="btn-primary" 
                                          style={{ 
                                            width: '100%', 
                                            padding: '14px', 
                                            borderRadius: 12, 
                                            fontWeight: 800, 
                                            fontSize: 14, 
                                            boxShadow: '0 8px 24px rgba(229,9,20,0.2)',
                                            textAlign: 'center',
                                            display: 'block',
                                            textDecoration: 'none'
                                          }}
                                        >
                                          {t('contest_login_required', 'Inicia sessão para participar')}
                                        </Link>
                                      )
                                    ) : (
                                      <button 
                                        className="btn-primary" 
                                        style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 14, boxShadow: '0 8px 24px rgba(229,9,20,0.2)' }}
                                        onClick={() => handleOpenContestModal(c)}
                                      >
                                        {t('contest_participate_now', 'Participar Agora')}
                                      </button>
                                    )
                                  ) : (
                                    <a 
                                      href={c.link} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="btn-secondary" 
                                      style={{ 
                                        width: '100%', 
                                        textAlign: 'center', 
                                        padding: '14px', 
                                        borderRadius: 12, 
                                        fontWeight: 800, 
                                        textDecoration: 'none', 
                                        fontSize: 14, 
                                        background: 'var(--contest-btn-bg)', 
                                        border: '1px solid var(--contest-btn-border)',
                                        color: 'var(--contest-btn-text)',
                                        transition: 'all 0.3s ease',
                                        display: 'block'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--accent)';
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(229, 9, 20, 0.3)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.background = 'var(--contest-btn-bg)';
                                        e.currentTarget.style.borderColor = 'var(--contest-btn-border)';
                                        e.currentTarget.style.color = 'var(--contest-btn-text)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                      }}
                                    >
                                      {t('contest_visit_partner', 'Visitar passatempo')}
                                    </a>
                                  )}
                                </>
                              )}
                              <a 
                                href={formatRulesLink(c.rules_link)}
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ 
                                  fontSize: 11, 
                                  color: 'var(--text-secondary)', 
                                  textAlign: 'center', 
                                  textDecoration: 'none', 
                                  opacity: 0.6, 
                                  fontWeight: 600,
                                  transition: 'all 0.2s ease',
                                  display: 'block',
                                  marginTop: 4
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.color = 'var(--contest-rules-hover)';
                                  e.currentTarget.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.opacity = '0.6';
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                  e.currentTarget.style.textDecoration = 'none';
                                }}
                              >
                                {t('contest_rules_official', 'Regulamento Oficial')}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: 24, border: '1px dashed var(--glass-border)' }}>
                <Ticket size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                <p style={{ margin: 0, fontSize: 16 }}>{t('contests_no_contests', 'Não existem passatempos ativos de momento.')}</p>
              </div>
            );
          })()}
        </section>

        <div className="movie-body-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 40, alignItems: 'flex-start' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

            {/* Ad Slot: movie-series */}
            <AdSlot slot="movie-series" style={{ margin: '0 0 8px' }} />

            {/* Reviews */}
            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '4px', height: '24px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                {t('reviews_title', 'Críticas')}
              </h2>
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map(r => (
                    <Link to={`/review/${movie.slug}`} key={r.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div className="glass-panel" style={{ padding: 24, transition: 'transform 0.2s', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {r.avatar ? (
                                <img src={r.avatar} alt={r.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                                  {r.username ? r.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.username || t('review_user_fallback', 'Utilizador')}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString(locale)}</div>
                            </div>
                          </div>
                          <div style={{ background: 'var(--accent)', color: 'white', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={12} fill="white" color="white" /> {Number(r.score).toFixed(1)}
                          </div>
                        </div>
                        <div 
                          style={{ 
                            fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', opacity: 0.8, margin: 0,
                            maxHeight: 120, overflow: 'hidden', position: 'relative'
                          }} 
                        >
                          <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(r.body) }} />
                        </div>
                        <div style={{ marginTop: 15, fontSize: 13, color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {t('review_read_full', 'Ler crítica completa')} <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Star size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <p style={{ margin: 0 }}>{t('review_no_reviews_title', 'Ainda não existem críticas para este título.')}</p>
                </div>
              )}
            </section>

            {/* Videos Slider */}
            {videos.length > 0 && hasPermission('view_videos') && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '4px', height: '24px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                    {t('movie_videos_trailers', 'Vídeos e Trailers')}
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => document.getElementById('video-slider')?.scrollBy({ left: -300, behavior: 'smooth' })}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', opacity: 0.8 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button 
                      onClick={() => document.getElementById('video-slider')?.scrollBy({ left: 300, behavior: 'smooth' })}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', opacity: 0.8 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    >
                      <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  </div>
                </div>

                <div 
                  id="video-slider"
                  style={{ 
                    display: 'flex', 
                    gap: 20, 
                    overflowX: 'auto', 
                    paddingBottom: 20,
                    paddingRight: 40,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollBehavior: 'smooth',
                    scrollSnapType: 'x proximity'
                  }}
                >
                  {videos.map(v => {
                    const ytId = getYtId(v.src);
                    return (
                      <div key={v.id} onClick={() => { if (hasPermission('play_videos')) { setActiveVideo(ytId); setActiveVideoDbId(v.id); trackVideoPlay(v.id); } }}
                        style={{ 
                          flex: '0 0 320px',
                          borderRadius: 8, 
                          overflow: 'hidden', 
                          cursor: hasPermission('play_videos') ? 'pointer' : 'default', 
                          background: 'rgba(255,255,255,0.03)', 
                          border: '1px solid var(--glass-border)',
                          transition: 'all 0.3s ease',
                          scrollSnapAlign: 'start'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}>
                        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111', overflow: 'hidden' }}>
                          <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ 
                                width: 50, height: 50, borderRadius: '50%', background: 'var(--accent)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 10px 20px rgba(229, 9, 21, 0.4)'
                              }}>
                              <Play size={20} fill="white" color="white" />
                            </div>
                          </div>
                          {v.category && (
                            <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {v.category}
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '16px' }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN – Cast + Videos sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Facts Section */}
            {(fmt(movie.budget) || fmt(movie.revenue) || movie.country || movie.language) && (
              <section>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '4px', height: '20px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                  {t('movie_details_title', 'Detalhes')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {movie.country && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={14} /> {t('movie_country', 'País')}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{movie.country}</span>
                    </div>
                  )}
                  {movie.language && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={14} /> {t('movie_language', 'Idioma')}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>{movie.language}</span>
                    </div>
                  )}
                  {fmt(movie.budget) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={14} /> {t('movie_budget', 'Orçamento')}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{fmt(movie.budget)}</span>
                    </div>
                  )}
                  {fmt(movie.revenue) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={14} /> {t('movie_revenue', 'Receita')}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{fmt(movie.revenue)}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Cast Section */}
            {cast.length > 0 && hasPermission('view_cast') && (
              <section>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '4px', height: '20px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                  {t('media_cast', 'Elenco Principal')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...cast].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5).map((person: any) => (
                    <Link
                      key={person.person_id}
                      to={`/celebrity/${person.slug || person.person_id}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 14, 
                        textDecoration: 'none', 
                        padding: '10px 12px', 
                        borderRadius: 14, 
                        background: 'transparent', 
                        transition: 'all 0.3s ease' 
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#222', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        {person.poster ? (
                          <img src={person.poster} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 20, fontWeight: 700 }}>
                            {person.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginBottom: 2 }}>{person.name}</div>
                        {person.character && <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>{person.character}</div>}
                      </div>
                    </Link>
                  ))}
                  {cast.length > 5 && (
                    <Link to={`/movie/${id}/cast`} style={{ 
                      textAlign: 'center', 
                      padding: '12px', 
                      color: 'white', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      textDecoration: 'none', 
                      background: 'var(--accent)', 
                      borderRadius: 12, 
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.9)')}
                    onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                    >
                      {t('movie_view_full_cast', 'Ver elenco completo')} ({cast.length}) →
                    </Link>
                  )}
                </div>
              </section>
            )}

            {/* Crew highlights: Directors & Writers */}
            {false && crew.filter((c: any) => c.job === 'Director' || c.job === 'Screenplay' || c.job === 'Writer').length > 0 && hasPermission('view_cast') && (
              <section>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '4px', height: '20px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                  {t('media_crew', 'Equipa Técnica')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...crew].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5).map((person: any, i: number) => (
                    <Link
                      key={`crew-${person.person_id}-${i}`}
                      to={`/celebrity/${person.slug || person.person_id}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 14, 
                        textDecoration: 'none', 
                        padding: '10px 12px', 
                        borderRadius: 14, 
                        background: 'transparent', 
                        transition: 'all 0.3s ease' 
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#222', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        {person.poster ? (
                          <img src={person.poster} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 20, fontWeight: 700 }}>
                            {person.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 2 }}>{person.name}</div>
                        <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>{person.job}</div>
                      </div>
                    </Link>
                  ))}
                  {crew.length > 5 && (
                    <Link to={`/movie/${id}/cast`} style={{ 
                      textAlign: 'center', 
                      padding: '12px', 
                      color: 'white', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      textDecoration: 'none', 
                      background: 'rgba(229,9,20,0.1)', 
                      borderRadius: 12, 
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,9,20,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(229,9,20,0.1)')}
                    >
                      {t('movie_view_full_crew', 'Ver equipa técnica completa')} ({crew.length}) →
                    </Link>
                  )}
                </div>
              </section>
            )}


        </div>
      </div>
    </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <AdSlot slot="player" style={{ marginBottom: 32 }} />
      </div>

      {/* ── VIDEO MODAL ── */}
      {activeVideo && (
        <div onClick={() => setActiveVideo(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <button onClick={() => setActiveVideo(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
          
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Top bar: report button */}
            {activeVideoDbId && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => reportVideo(activeVideoDbId)}
                  disabled={reportedVideoIds.has(activeVideoDbId)}
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    padding: '7px 14px',
                    ...(reportedVideoIds.has(activeVideoDbId) && {
                      background: 'rgba(16,185,129,0.1)',
                      borderColor: 'rgba(16,185,129,0.35)',
                      color: '#10b981',
                      cursor: 'default',
                      opacity: 1,
                    }),
                  }}
                >
                  <Flag size={12} />
                  {reportedVideoIds.has(activeVideoDbId) ? t('video_report_sent', 'Denúncia enviada') : t('video_report_btn', 'Reportar vídeo')}
                </button>
              </div>
            )}


            {/* Video */}
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} title="Vídeo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
            
            <AdSlot slot="player" />
          </div>
        </div>
      )}


      {/* ── PARTICIPATION MODAL ── */}
      {activeContest && (
        <div className="modal-overlay participation-modal-overlay" onClick={() => setActiveContest(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content participation-modal-content" onClick={e => e.stopPropagation()} style={{ 
            width: '100%', maxWidth: 650, padding: 0, borderRadius: 24, overflow: 'hidden', 
            background: '#141414', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}>
            <div className="participation-modal-header" style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{t('contest_participate_title', 'Participar no Passatempo')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0' }}>{activeContest.name}</p>
              </div>
              <button onClick={() => setActiveContest(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: 6, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                <X size={20} />
              </button>
            </div>

            <div className="participation-modal-body" style={{ padding: 40, maxHeight: '80vh', overflowY: 'auto' }}>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!participationForm.age_confirm || !participationForm.terms_confirm) {
                    showToast(t('contest_accept_terms_error', 'Por favor, aceite os termos e a idade.'), 'error');
                    return;
                  }
                  try {
                    const res = await fetch(`${API_BASE}/participate.php`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        contest_id: activeContest.id,
                        ...participationForm
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setActiveContest(null);
                      setParticipationForm({ name: '', email: '', cc_bi: '', location: '', answer: '', instagram_link: '', age_confirm: false, terms_confirm: false });
                      setIsSuccessModalOpen(true);
                    } else {
                      showToast(data.error || t('contest_submit_error', 'Erro ao enviar participação.'), 'error');
                    }
                  } catch (err) {
                    showToast(t('contest_submit_error', 'Erro ao enviar participação.'), 'error');
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{t('contact_name', 'Nome Completo')}</label>
                    <input 
                      required
                      className="form-input" 
                      placeholder={t('contest_placeholder_name', 'O seu nome...')} 
                      style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12 }} 
                      value={participationForm.name}
                      onChange={e => setParticipationForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{t('auth_email', 'E-mail')}</label>
                    <input 
                      required
                      className="form-input" 
                      type="email" 
                      placeholder={t('contest_placeholder_email', 'seu@email.com')} 
                      style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12 }} 
                      value={participationForm.email}
                      onChange={e => setParticipationForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{t('contest_cc_bi_label', 'Número de CC / BI (obrigatório para levantamento de bilhetes)')}</label>
                  <input 
                    required
                    className="form-input" 
                    placeholder={t('contest_placeholder_cc_bi', 'Introduza o seu número de CC ou BI...')} 
                    style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12 }} 
                    value={participationForm.cc_bi}
                    onChange={e => setParticipationForm(p => ({ ...p, cc_bi: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{t('contest_cinema_location_label', 'Localização do Cinema')}</label>
                  <select 
                    required
                    className="form-input" 
                    style={{ background: 'rgba(255,255,255,0.03)', height: 50, borderRadius: 12, color: 'white' }}
                    value={participationForm.location}
                    onChange={e => setParticipationForm(p => ({ ...p, location: e.target.value }))}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>{t('select_option_placeholder', 'Selecione...')}</option>
                    {activeContest.location?.split(/[/,&]+/).map((loc: string) => {
                      const cleanLoc = loc.trim();
                      if (!cleanLoc) return null;
                      return <option key={cleanLoc} value={cleanLoc.toLowerCase()} style={{ background: '#1a1a1a' }}>{cleanLoc}</option>;
                    })}
                    {(!activeContest.location || activeContest.location.toLowerCase().includes('nacional')) && (
                      <>
                        <option value="lisboa" style={{ background: '#1a1a1a' }}>{t('location_lisbon', 'Lisboa')}</option>
                        <option value="porto" style={{ background: '#1a1a1a' }}>{t('location_porto', 'Porto')}</option>
                        <option value="nacional" style={{ background: '#1a1a1a' }}>{t('location_national', 'Nacional')}</option>
                      </>
                    )}
                    <option value="outro" style={{ background: '#1a1a1a' }}>{t('location_other', 'Outro')}</option>
                  </select>
                </div>

                {activeContest.question && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{activeContest.question}</label>
                    <textarea 
                      required
                      className="form-input" 
                      rows={3} 
                      placeholder={t('contest_placeholder_answer', 'A sua resposta...')} 
                      style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12 }} 
                      value={participationForm.answer}
                      onChange={e => setParticipationForm(p => ({ ...p, answer: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{t('contest_instagram_label', 'Link do Perfil Instagram')}</label>
                  <input 
                    className="form-input" 
                    placeholder={t('contest_placeholder_instagram', 'https://instagram.com/seu-perfil')} 
                    style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12 }} 
                    value={participationForm.instagram_link}
                    onChange={e => setParticipationForm(p => ({ ...p, instagram_link: e.target.value }))}
                  />
                </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8, fontSize: 14, background: 'rgba(229,9,20,0.05)', padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(229,9,20,0.2)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{t('contest_before_participating', 'Antes de participar:')}</span>
                    <a 
                      href={formatRulesLink(activeContest.rules_link)}
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}
                    >
                      {t('contest_read_rules_link', 'Ler Regulamento do Passatempo')}
                    </a>
                  </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14 }}>
                    <input 
                      type="checkbox" 
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)', marginTop: 2, flexShrink: 0 }} 
                      checked={participationForm.age_confirm}
                      onChange={e => setParticipationForm(p => ({ ...p, age_confirm: e.target.checked }))}
                    />
                    <span>{t('contest_confirm_age', 'Confirmo que tenho mais de 16 anos.')}</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 14 }}>
                    <input 
                      type="checkbox" 
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)', marginTop: 2, flexShrink: 0 }} 
                      checked={participationForm.terms_confirm}
                      onChange={e => setParticipationForm(p => ({ ...p, terms_confirm: e.target.checked }))}
                    />
                    <span>
                      {t('contest_confirm_terms_pre', 'Tomei conhecimento dos')}{' '}
                      <Link to="/terms-and-conditions" target="_blank" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {t('contest_confirm_terms_link', 'termos e condições')}
                      </Link>
                      .
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '18px', fontSize: 16, fontWeight: 800, borderRadius: 6, marginTop: 10 }}>
                  {t('contest_submit_btn', 'Enviar Participação')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL ── */}
      {isSuccessModalOpen && (
        <div className="modal-overlay success-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content success-modal-content" style={{ 
            background: '#1a1a1a', 
            width: '90%', 
            maxWidth: 480, 
            borderRadius: 24, 
            border: '1px solid var(--glass-border)', 
            padding: 40,
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'rgba(46, 204, 113, 0.1)', 
              border: '2px solid rgb(46, 204, 113)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'rgb(46, 204, 113)',
              animation: 'pulseGreen 2s infinite'
            }}>
              <Check size={40} strokeWidth={3} />
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px', color: 'white' }}>{t('contest_success_title', 'Participação Registada!')}</h3>
            
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 32px' }}>
              {t('contest_success_desc_1', 'Obrigado por participares no passatempo. A tua participação foi submetida com sucesso.')} <br /><br />
              {t('contest_success_desc_2', 'Enviámos-te um e-mail de confirmação com os detalhes da tua participação. Boa sorte!')}
            </p>

            <button 
              onClick={() => setIsSuccessModalOpen(false)} 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: 6, fontWeight: 800, fontSize: 15, justifyContent: 'center' }}
            >
              {t('btn_close', 'Fechar')}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGreen {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }
      `}</style>
    </div>
  );
}
