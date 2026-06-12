import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Star, Film, ChevronDown, ChevronUp, User } from 'lucide-react';
import { API_BASE } from '../config';
import AdSlot from '../components/AdSlot';
import { useTranslation } from '../context/LanguageContext';

interface Person {
  id: number;
  name: string;
  poster: string;
  biography: string;
  birthday: string;
  deathday: string;
  place_of_birth: string;
  known_for: string;
  gender: number;
  gender_label: string;
  popularity: number;
  imdb_id: string;
  tmdb_id: number;
}

interface Credit {
  title_id: number;
  title_name: string;
  title_poster: string;
  release_date: string;
  character: string;
  job: string;
  department: string;
  slug: string;
}

interface PersonData {
  person: Person;
  credits: Credit[];
  credits_grouped: Record<string, Credit[]>;
  known_for: Credit[];
}

export default function Celebrity() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/person.php?id=${slug}&lang=${currentLanguage}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setData(d);
          if (!isNaN(Number(slug)) && d.person.slug) {
            navigate(`/celebrity/${d.person.slug}`, { replace: true });
          }
          const firstDept = Object.keys(d.credits_grouped)[0];
          if (firstDept) setExpandedDepts({ [firstDept]: true });
          const siteName = localStorage.getItem('site_name') || 'Antestreias';
          document.title = `${siteName} - ${t('celebrity_title_prefix', 'Artistas')}: ${d.person.name}`;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, navigate, t, currentLanguage]);

  const toggleDept = (dept: string) => {
    setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const translateGender = (label: string) => {
    if (!label) return '';
    const lbl = label.toLowerCase();
    if (lbl === 'masculino') return t('gender_male', 'Masculino');
    if (lbl === 'feminino') return t('gender_female', 'Feminino');
    return label;
  };

  if (loading) return <div className="loader-container"><div className="spinner" /></div>;

  if (!data) return (
    <div className="container" style={{ padding: '150px 20px', textAlign: 'center' }}>
      <h2>{t('celebrity_not_found', 'Celebridade não encontrada')}</h2>
      <Link to="/" style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 20, display: 'inline-block' }}>← {t('btn_back', 'Voltar')}</Link>
    </div>
  );

  const { person, credits_grouped, known_for } = data;
  const totalCredits = data.credits.length;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Background Decor */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 600,
        background: 'linear-gradient(to bottom, rgba(229,9,20,0.08) 0%, transparent 100%)',
        zIndex: -1, pointerEvents: 'none'
      }} />

      <div className="container celebrity-container">
        <div className="celebrity-grid">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="celebrity-sidebar">
            {/* Mobile Header (only visible on mobile) */}
            <div className="celebrity-mobile-header">
              <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                {person.name}
              </h1>
              {person.popularity > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(229,9,20,0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid rgba(229,9,20,0.2)' }}>
                    <Star size={14} fill="var(--accent)" /> {t('celebrity_popularity_format', '{popularity} Popularidade').replace('{popularity}', Number(person.popularity).toFixed(1))}
                  </span>
                </div>
              )}
            </div>

            {/* Photo */}
            <div className="celebrity-photo-container">
              {person.poster ? (
                <img src={person.poster} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <User size={80} opacity={0.2} />
                </div>
              )}
            </div>

            {/* Personal Details Card */}
            <div className="celebrity-info-card">
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 4, height: 22, background: 'var(--accent)', borderRadius: 2 }} />
                {t('celebrity_personal_info', 'Info Pessoal')}
              </h3>

              <div className="celebrity-details-list">
                {person.known_for && (
                  <Detail label={t('celebrity_known_for', 'Conhecido por')} value={person.known_for} />
                )}
                {person.gender_label && person.gender_label !== 'Desconhecido' && (
                  <Detail label={t('celebrity_gender', 'Género')} value={translateGender(person.gender_label)} />
                )}
                <Detail label={t('celebrity_total_credits', 'Total de Créditos')} value={String(totalCredits)} />
                {person.birthday && (
                  <Detail
                    label={t('celebrity_birthday', 'Nascimento')}
                    value={fmtDate(person.birthday) || person.birthday}
                    icon={<Calendar size={16} />}
                  />
                )}
                {person.deathday && (
                  <Detail
                    label={t('celebrity_deathday', 'Falecimento')}
                    value={fmtDate(person.deathday) || person.deathday}
                    icon={<Calendar size={16} />}
                  />
                )}
                {person.place_of_birth && (
                  <Detail
                    label={t('celebrity_place_of_birth', 'Local de Origem')}
                    value={person.place_of_birth}
                    icon={<MapPin size={16} />}
                  />
                )}
                {person.imdb_id && (
                  <div className="celebrity-imdb-wrapper" style={{ marginTop: 12 }}>
                    <a
                      href={`https://www.imdb.com/name/${person.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ 
                        fontSize: 14, padding: '14px 20px', borderRadius: 16, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.2)', color: '#ffc800',
                        fontWeight: 700
                      }}
                    >
                      <Star size={16} fill="#ffc800" /> {t('celebrity_imdb_profile', 'Perfil IMDb')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── RIGHT MAIN CONTENT ── */}
          <main style={{ minWidth: 0 }}>
            {/* Header */}
            <div className="celebrity-desktop-header">
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-2px', lineHeight: 1 }}>
                {person.name}
              </h1>
              {person.popularity > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(229,9,20,0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid rgba(229,9,20,0.2)' }}>
                    <Star size={14} fill="var(--accent)" /> {t('celebrity_popularity_format', '{popularity} Popularidade').replace('{popularity}', Number(person.popularity).toFixed(1))}
                  </span>
                </div>
              )}
            </div>

            {/* Known For Grid */}
            {known_for.length > 0 && (
              <section style={{ marginBottom: 56 }}>
                <SectionTitle>{t('celebrity_featured', 'Destaques')}</SectionTitle>
                <div className="celebrity-highlights-grid">
                  {known_for.map((credit, i) => (
                    <Link
                      key={i}
                      to={`/movie/${credit.title_id}`}
                      className="celebrity-highlight-card"
                    >
                      <div style={{
                        aspectRatio: '2/3', borderRadius: 16, overflow: 'hidden',
                        background: '#1a1a1a', border: '1px solid var(--glass-border)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: 12
                      }}>
                        {credit.title_poster ? (
                          <img src={credit.title_poster} alt={credit.title_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                            <Film size={40} opacity={0.1} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '0 4px' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>{credit.title_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {credit.character || credit.job || t('celebrity_actor', 'Ator')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Biography */}
            {person.biography && (
              <section style={{ marginBottom: 56 }}>
                <SectionTitle>{t('celebrity_biography', 'Biografia')}</SectionTitle>
                <div className="celebrity-bio-box">
                  {person.biography}
                </div>
              </section>
            )}

            {/* Ad Slot */}
            <AdSlot slot="celebrity" style={{ marginBottom: 56 }} />

            {/* Credits List */}
            {Object.keys(credits_grouped).length > 0 && (
              <section>
                <SectionTitle>{t('celebrity_filmography', 'Filmografia')}</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  {Object.entries(credits_grouped).map(([dept, items]) => (
                    <div key={dept}>
                      <div
                        onClick={() => toggleDept(dept)}
                        style={{
                          width: '100%', padding: '0 0 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'white',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          marginBottom: 12
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.9 }}>
                          {dept} 
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, opacity: 0.5 }}>
                            ({items.length})
                          </span>
                        </span>
                        {expandedDepts[dept] ? <ChevronUp size={20} opacity={0.5} /> : <ChevronDown size={20} opacity={0.5} />}
                      </div>

                      {expandedDepts[dept] && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {items.map((credit, i) => (
                            <Link
                              key={i}
                              to={`/movie/${credit.title_id}`}
                              className="celebrity-credit-item"
                            >
                              <div style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, minWidth: 50, fontVariantNumeric: 'tabular-nums' }}>
                                {credit.release_date ? credit.release_date.slice(0, 4) : '—'}
                              </div>
                              
                              <div style={{ width: 40, height: 56, borderRadius: 6, overflow: 'hidden', background: '#222', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                {credit.title_poster ? (
                                  <img src={credit.title_poster} alt={credit.title_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Film size={18} opacity={0.2} />
                                  </div>
                                )}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: 'white', fontSize: 16 }}>{credit.title_name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2, fontWeight: 500 }}>
                                  {credit.character ? (
                                    <span>{t('celebrity_as', 'como')} <span style={{ color: 'rgba(255,255,255,0.7)' }}>{credit.character}</span></span>
                                  ) : (
                                    <span>{credit.job || ''}</span>
                                  )}
                                </div>
                              </div>

                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="celebrity-section-title">
      <span style={{ width: 4, height: 24, background: 'var(--accent)', borderRadius: 2 }} />
      {children}
    </h2>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{label}</span>
      <span style={{ fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
        {icon && <span style={{ color: 'var(--accent)', opacity: 0.9 }}>{icon}</span>}
        {value}
      </span>
    </div>
  );
}
