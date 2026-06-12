import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { API_BASE, PLACEHOLDER_IMG } from '../config';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

interface CastMember {
  person_id: number;
  name: string;
  poster: string;
  slug: string;
  character: string;
  job: string;
  department: string;
}

interface MovieDetail {
  id: number;
  name: string;
  poster: string;
  backdrop: string;
}

export default function MovieCast() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCast, setVisibleCast] = useState(15);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/movies_detail.php?id=${id}`)
      .then(r => r.json())
      .then(movieData => {
        if (!movieData || movieData.error) { setLoading(false); return; }
        setMovie(movieData);
        fetch(`${API_BASE}/title_details.php?id=${movieData.id}`)
          .then(r => r.json())
          .then(details => {
            setCast(details.cast || []);
            setCrew(details.crew || []);
            setLoading(false);
          });
      }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loader-container"><div className="spinner" /></div>;
  if (!hasPermission('view_cast')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="glass" style={{ maxWidth: 500, width: '100%', padding: 50, textAlign: 'center', borderRadius: 24, border: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>{t('cast_restricted_access', 'Acesso Restrito')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 30 }}>
            {t('cast_restricted_desc', 'Lamentamos, mas a tua conta não tem permissão para visualizar o Elenco e Equipa Técnica. Contacta a administração se achas que isto é um erro.')}
          </p>
          <Link to="/" style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '14px 32px', borderRadius: 14, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
            {t('cast_back_to_home', 'Voltar à Página Inicial')}
          </Link>
        </div>
      </div>
    );
  }
  if (!movie) return <div className="container" style={{ padding: '150px 20px', textAlign: 'center' }}><h2>{t('media_not_found', 'Título não encontrado')}</h2></div>;

  // Group crew by department
  const crewByDept = crew.reduce((acc: any, member) => {
    if (!acc[member.department]) acc[member.department] = [];
    acc[member.department].push(member);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header section */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        {movie.backdrop && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${movie.backdrop})`,
            backgroundSize: 'cover', backgroundPosition: 'center 20%',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), var(--bg-primary))' }} />
          </div>
        )}
        <div className="container" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 40 }}>
          <div style={{ display: 'flex', gap: 30, alignItems: 'flex-end' }}>
            <div style={{ width: 120, borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={movie.poster || PLACEHOLDER_IMG} alt={movie.name} style={{ width: '100%', display: 'block' }} />
            </div>
            <div>
              <Link to={`/movie/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', fontSize: 14, marginBottom: 10 }}>
                <ArrowLeft size={16} /> {t('btn_back', 'Voltar')}
              </Link>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{movie.name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 18, marginTop: 4 }}>{t('cast_title', 'Elenco e Equipa Técnica')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>

          {/* CAST COLUMN */}
          <section>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 30, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 4, height: 24, background: 'var(--accent)', borderRadius: 2 }} />
              {t('media_cast', 'Elenco')} <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 18 }}>({cast.length})</span>
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: 20 
            }}>
              {cast.slice(0, visibleCast).map(person => (
                <Link 
                  key={person.person_id} 
                  to={`/celebrity/${person.slug || person.person_id}`} 
                  style={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ 
                    position: 'relative',
                    aspectRatio: '2/3', 
                    borderRadius: 16, 
                    overflow: 'hidden', 
                    background: '#1a1a1a',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    border: '1px solid var(--glass-border)',
                    marginBottom: 12
                  }}>
                    {person.poster ? (
                      <img src={person.poster} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                        <User size={40} />
                      </div>
                    )}
                    <div style={{ 
                      position: 'absolute', inset: 0, 
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)',
                      opacity: 0, transition: '0.3s',
                    }} className="hover-overlay" />
                  </div>
                  
                  <div style={{ padding: '0 4px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.2, marginBottom: 4 }}>{person.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>{person.character}</div>
                  </div>
                </Link>
              ))}
            </div>

            {visibleCast < cast.length && (
              <button
                onClick={() => setVisibleCast(prev => prev + 15)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: 40
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(229, 9, 20, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {t('btn_load_more', 'Ver mais')} (+{Math.min(15, cast.length - visibleCast)})
              </button>
            )}
          </section>

          {/* CREW COLUMN */}
          <section>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 30, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 4, height: 24, background: 'var(--accent)', borderRadius: 2 }} />
              {t('media_crew', 'Equipa Técnica')} <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 18 }}>({crew.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {Object.entries(crewByDept).map(([dept, members]: [string, any]) => (
                <div key={dept}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--accent)', marginBottom: 16, opacity: 0.8 }}>{dept}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {members.map((person: any, idx: number) => (
                      <Link key={`${person.person_id}-${idx}`} to={`/celebrity/${person.slug || person.person_id}`} style={{
                        display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
                        padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid transparent', transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                          {person.poster ? (
                            <img src={person.poster} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                              <User size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{person.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{person.job}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
