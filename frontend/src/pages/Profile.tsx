import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Calendar, Edit3,
  Settings, Star,
  Camera, Save, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTopRole } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import { API_BASE, PLACEHOLDER_IMG } from '../config';
import { useTranslation } from '../context/LanguageContext';

interface ProfileData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string;
  bio: string;
  cover_image: string;
  social_links: {
    imdb?: string;
    letterboxd?: string;
    simkl?: string;
    twitter?: string;
    instagram?: string;
  };
  role: string;
  created_at: string;
  reviews?: any[];
  participations?: any[];
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  followers_list?: any[];
  following_list?: any[];
}

export default function Profile() {
  const { username: rawUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t, currentLanguage } = useTranslation();

  // Clean username (remove @ if present)
  const username = rawUsername?.startsWith('@') ? rawUsername.substring(1) : rawUsername;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('criticas');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState<string | null>(null);

  // Edit States
  const [editData, setEditData] = useState<Partial<ProfileData>>({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFollowHovered, setIsFollowHovered] = useState(false);

  const isOwnProfile = currentUser?.username === (username || profile?.username);

  const fetchProfile = async () => {
    try {
      const url = username
        ? `${API_BASE}/profile.php?username=${username}`
        : `${API_BASE}/profile.php`;

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!data.error) {
        setProfile(data);
        setEditData(data);
        setErrorMessage(null);
        const siteName = localStorage.getItem('site_name') || 'Antestreias';
        document.title = `${siteName} - ${t('profile_title_prefix', 'Perfil de @{username}').replace('{username}', data.username)}`;
      } else {
        setProfile(null);
        setErrorMessage(data.error);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMessage(t('profile_load_error', 'Erro ao carregar perfil.'));
    }
  };

  useEffect(() => {
    // If no username in URL, but we are logged in, redirect to our own @username profile
    if (!rawUsername && currentUser) {
      navigate(`/perfil/@${currentUser.username}`, { replace: true });
      return;
    }
    fetchProfile();
  }, [rawUsername, currentUser]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover_image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload.php`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const newUrl = data.url;

        // Prepare data for save - merging profile and any current edits
        const dataToSave = {
          ...profile,
          ...editData,
          [type]: newUrl
        };

        setEditData(dataToSave);

        // Save to DB immediately
        const saveRes = await fetch(`${API_BASE}/profile.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
          credentials: 'include'
        });

        const saveData = await saveRes.json();
        if (saveData.success) {
          // Success! Now refresh the whole profile view
          await fetchProfile();
          showToast(t('profile_update_success', 'Perfil atualizado com sucesso!'), "success");
        } else {
          showToast(t('profile_update_db_error', 'Erro ao guardar no perfil: ') + (saveData.error || t('error_unknown', 'Erro desconhecido')), "error");
        }
      } else {
        showToast(t('error_server', 'Erro no servidor: ') + (data.error || t('error_unknown_response', 'Resposta desconhecida')), "error");
      }
    } catch (err: any) {
      showToast(t('error_connection', 'Erro na ligação: ') + err.message, "error");
    } finally {
      setUploading(null);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      showToast(t('profile_follow_login_required', 'Inicia sessão para seguir utilizadores'), "error");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/follow.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile?.id }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? {
          ...prev,
          is_following: data.is_following,
          followers_count: (prev.followers_count || 0) + (data.is_following ? 1 : -1)
        } : null);
        showToast(data.is_following ? t('profile_following_user', 'A seguir @{username}').replace('{username}', profile?.username || '') : t('profile_unfollowed_user', 'Deixaste de seguir @{username}').replace('{username}', profile?.username || ''), "success");
        fetchProfile();
      }
    } catch (err) {
      showToast(t('profile_follow_error', 'Erro ao seguir utilizador'), "error");
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('profile_update_success', 'Perfil atualizado com sucesso!'), "success");
        setIsEditing(false);
        fetchProfile();
      } else {
        showToast(data.error || t('profile_save_changes_error', 'Erro ao guardar alterações'), "error");
      }
    } catch (err) {
      console.error("Erro ao salvar perfil");
    }
  };

  const translateRole = (role: string) => {
    if (role === 'Super Administrador') return t('role_super_admin', 'Super Administrador');
    if (role === 'Administrador') return t('role_admin', 'Administrador');
    if (role === 'Moderador') return t('role_moderator', 'Moderador');
    if (role === 'Membro') return t('role_member', 'Membro');
    return role;
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center', color: 'white' }}>{t('profile_loading', 'A carregar perfil...')}</div>;
  if (errorMessage || !profile) return (
    <div style={{ padding: 100, textAlign: 'center', color: 'white' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>{t('profile_access_denied', 'Acesso Negado / Indisponível')}</h2>
      <p style={{ color: 'var(--text-secondary)' }}>{errorMessage || t('profile_user_not_found', 'Utilizador não encontrado.')}</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 25px', background: 'var(--accent)', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>{t('btn_back_home', 'Voltar ao Início')}</Link>
    </div>
  );

  const currentCover = isEditing ? editData.cover_image : profile.cover_image;
  const currentAvatar = isEditing ? editData.avatar : profile.avatar;

  return (
    <div className="profile-container" style={{ minHeight: '100vh', paddingBottom: 50 }}>
      {/* Cover Image */}
      <div className="profile-cover" style={{
        height: 350,
        background: currentCover ? `url("${currentCover}") center/cover` : 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
        position: 'relative',
        borderRadius: '0 0 30px 30px',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))', zIndex: 1 }} />

        {isOwnProfile && (
          <button
            onClick={() => coverInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 20, right: 20,
              padding: '10px 20px', borderRadius: 12,
              background: 'var(--bg-secondary)', color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              fontWeight: 700, fontSize: 13,
              zIndex: 20, transition: 'all 0.3s'
            }}
            className="hover-bright"
          >
            <Camera size={18} /> {uploading === 'cover_image' ? t('loading', 'A carregar...') : t('profile_change_cover', 'Alterar Capa')}
          </button>
        )}
      </div>

      {/* Profile Layout */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40 }}>
          
          {/* Left Sidebar (Avatar, Info, Stats, Bio) */}
          <aside style={{ marginTop: '-100px' }}>
            <div className="avatar-wrapper" style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{
                width: 180, height: 180,
                borderRadius: 40,
                border: '6px solid var(--bg-primary)',
                background: 'var(--bg-primary)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative'
              }}>
                {currentAvatar ? (
                  <img src={currentAvatar} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploading === 'avatar' ? 0.5 : 1 }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'white' }}>
                    <User size={80} />
                  </div>
                )}
                {uploading === 'avatar' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <div className="loading-spinner"></div>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="edit-avatar-btn"
                  style={{
                    position: 'absolute', bottom: 10, left: 140,
                    width: 40, height: 40, borderRadius: 12,
                    background: 'var(--accent)', color: 'white',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 25
                  }}>
                  <Camera size={18} />
                </button>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 5px 0', letterSpacing: '-1px', lineHeight: 1.1 }}>
                {isEditing ? editData.first_name : profile.first_name} <br /> {isEditing ? editData.last_name : profile.last_name}
              </h1>
              {getTopRole(profile.role) !== 'Membro' && (
                <span style={{
                  background: getTopRole(profile.role) === 'Super Administrador' ? 'rgba(229, 9, 21, 0.2)' : 'rgba(229, 9, 21, 0.1)',
                  color: 'var(--accent)',
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 900,
                  border: `1px solid ${getTopRole(profile.role) === 'Super Administrador' ? 'var(--accent)' : 'rgba(229, 9, 21, 0.2)'}`,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginTop: '10px',
                  marginBottom: '10px',
                  display: 'inline-block'
                }}>
                  {translateRole(getTopRole(profile.role))}
                </span>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: '5px 0 0 0', fontWeight: 600 }}>@{profile.username}</p>
            </div>

            <div style={{ display: 'flex', gap: 30, marginBottom: 20 }}>
              <StatItem label={t('profile_followers', 'Seguidores')} value={(profile.followers_count || 0).toString()} />
              <StatItem label={t('profile_following', 'A Seguir')} value={(profile.following_count || 0).toString()} />
            </div>

            {/* Profile Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 25, width: '100%' }}>
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      padding: '10px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <Edit3 size={15} /> {t('profile_edit_btn', 'Editar Perfil')}
                  </button>
                  <Link
                    to="/definicoes"
                    className="btn-secondary"
                    style={{
                      padding: '10px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                    }}
                    title={t('nav_account_settings', 'Definições')}
                  >
                    <Settings size={16} />
                  </Link>
                </>
              )}
              {!isOwnProfile && currentUser && (
                <button 
                  onClick={handleFollow}
                  onMouseEnter={() => setIsFollowHovered(true)}
                  onMouseLeave={() => setIsFollowHovered(false)}
                  style={{
                    flex: 1,
                    background: profile.is_following 
                      ? (isFollowHovered ? 'rgba(229, 9, 21, 0.8)' : 'rgba(255,255,255,0.1)') 
                      : 'var(--accent)',
                    border: profile.is_following 
                      ? (isFollowHovered ? '1px solid var(--accent)' : '1px solid var(--glass-border)') 
                      : 'none',
                    color: 'white', 
                    padding: '10px 20px',
                    borderRadius: 6, 
                    cursor: 'pointer',
                    fontWeight: 700, 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  {profile.is_following 
                    ? (isFollowHovered ? t('profile_unfollow', 'Deixar de Seguir') : t('profile_following_status', 'A Seguir')) 
                    : t('profile_follow', 'Seguir')}
                </button>
              )}
            </div>

            <div className="metric-card" style={{ padding: 25, marginBottom: 25 }}>
              <h3 style={{ fontSize: 14, marginBottom: 15, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{t('profile_about', 'Sobre')}</h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: 14, margin: 0 }}>
                {(isEditing ? editData.bio : profile.bio) || t('profile_no_bio', 'Este utilizador ainda não adicionou uma biografia.')}
              </p>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow icon={<Calendar size={16} />} text={t('profile_member_since_date', 'Membro desde {date}').replace('{date}', new Date(profile.created_at).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-PT'))} />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {profile.social_links?.imdb && (
                <SocialIcon
                  icon={<img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDb" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
                  href={profile.social_links.imdb.startsWith('http') ? profile.social_links.imdb : `https://www.imdb.com/user/${profile.social_links.imdb}`}
                />
              )}
              {profile.social_links?.letterboxd && (
                <SocialIcon
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="7" cy="12" r="3.5" fill="#FF8000" /><circle cx="12" cy="12" r="3.5" fill="#00E054" /><circle cx="17" cy="12" r="3.5" fill="#40BCF4" /></svg>}
                  href={profile.social_links.letterboxd.startsWith('http') ? profile.social_links.letterboxd : `https://letterboxd.com/${profile.social_links.letterboxd}`}
                />
              )}
              {profile.social_links?.simkl && (
                <SocialIcon
                  icon={<img src="/assets/icons/simkl.webp" alt="Simkl" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                  href={profile.social_links.simkl.startsWith('http') ? profile.social_links.simkl : `https://simkl.com/user/${profile.social_links.simkl}`}
                />
              )}
              {profile.social_links?.twitter && (
                <SocialIcon
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>}
                  href={profile.social_links.twitter.startsWith('http') ? profile.social_links.twitter : `https://twitter.com/${profile.social_links.twitter}`}
                />
              )}
              {profile.social_links?.instagram && (
                <SocialIcon
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>}
                  href={profile.social_links.instagram.startsWith('http') ? profile.social_links.instagram : `https://instagram.com/${profile.social_links.instagram}`}
                />
              )}
            </div>
          </aside>

          <main style={{ paddingTop: 30 }}>
            <div style={{ display: 'flex', gap: 30, borderBottom: '1px solid var(--glass-border)', marginBottom: 30 }}>
              <TabButton id="criticas" label={t('reviews_title', 'Críticas')} active={activeTab === 'criticas'} onClick={setActiveTab} />
              <TabButton id="participacoes" label={t('profile_tab_participations', 'Participações')} active={activeTab === 'participacoes'} onClick={setActiveTab} />
              <TabButton id="seguidores" label={t('profile_followers', 'Seguidores')} active={activeTab === 'seguidores'} onClick={setActiveTab} />
              <TabButton id="a_seguir" label={t('profile_following', 'A Seguir')} active={activeTab === 'a_seguir'} onClick={setActiveTab} />
            </div>

            <div className="tab-content">
              {activeTab === 'criticas' && (
                profile.reviews && profile.reviews.length > 0 ? (
                  <div className="review-posters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                    {profile.reviews.map((review: any) => (
                      <Link to={`/review/${review.title_slug}`} key={review.id} className="review-card-poster">
                        <div className="card-clip-box">
                          <img className="bg-img" src={review.title_poster || review.title_backdrop || PLACEHOLDER_IMG} alt={review.title_name} />
                          
                          <div className="card-overlay">
                            <div style={{ 
                              position: 'absolute', top: 12, right: 12, 
                              background: 'var(--accent)', 
                              padding: '5px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4, 
                              boxShadow: '0 4px 15px rgba(229, 9, 21, 0.4)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              pointerEvents: 'auto'
                            }}>
                              <Star size={12} fill="white" /> 
                              <span style={{ fontSize: 13, fontWeight: 900 }}>{Number(review.score).toFixed(1)}</span>
                            </div>
                            
                            <div style={{ width: '100%', pointerEvents: 'auto' }}>
                              <h3 style={{ 
                                fontSize: 17, fontWeight: 800, margin: '0', 
                                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                lineHeight: 1.2
                              }}>
                                {review.title_name}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
                    {t('profile_no_reviews', 'Ainda não existem críticas publicadas.')}
                  </div>
                )
              )}
              {activeTab === 'seguidores' && (
                profile.followers_list && profile.followers_list.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {profile.followers_list.map((u: any) => (
                      <Link to={`/perfil/@${u.username}`} key={u.id} className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'var(--text-primary)', transition: 'transform 0.2s' }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} style={{ width: 50, height: 50, borderRadius: 25, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
                            <User size={24} />
                          </div>
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : `@${u.username}`}</h4>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>@{u.username}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
                    {t('profile_no_followers', 'Ainda não existem seguidores.')}
                  </div>
                )
              )}
              {activeTab === 'a_seguir' && (
                profile.following_list && profile.following_list.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {profile.following_list.map((u: any) => (
                      <Link to={`/perfil/@${u.username}`} key={u.id} className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'var(--text-primary)', transition: 'transform 0.2s' }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} style={{ width: 50, height: 50, borderRadius: 25, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
                            <User size={24} />
                          </div>
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : `@${u.username}`}</h4>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>@{u.username}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
                    {t('profile_no_following', 'Este utilizador ainda não segue ninguém.')}
                  </div>
                )
              )}
              {activeTab === 'participacoes' && (
                profile.participations && profile.participations.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
                    {profile.participations.map((p: any) => {
                      const isEnded = p.contest_end_date && new Date(p.contest_end_date) < new Date();
                      return (
                        <div key={p.id} className="glass-card" style={{ 
                          borderRadius: 16, 
                          overflow: 'hidden', 
                          background: p.is_winner ? 'linear-gradient(135deg, rgba(229,9,20,0.15) 0%, rgba(229,9,20,0.05) 100%)' : 'rgba(255,255,255,0.03)',
                          border: p.is_winner ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease',
                          height: '100%'
                        }}>
                          {p.title_backdrop || p.title_poster ? (
                            <div style={{ height: 110, position: 'relative', overflow: 'hidden' }}>
                              <img src={p.title_backdrop || p.title_poster} alt={p.title_name || p.contest_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }} />
                              <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 800, fontSize: 15, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{p.title_name || p.contest_name}</span>
                                {p.is_winner ? (
                                  <span style={{ background: 'var(--accent)', color: 'white', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 900, boxShadow: '0 4px 12px rgba(229,9,20,0.4)' }}>{t('contest_winner_badge', 'VENCEDOR')}</span>
                                ) : isEnded ? (
                                  <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>{t('contest_ended_badge', 'TERMINADO')}</span>
                                ) : (
                                  <span style={{ background: 'rgba(0,220,100,0.2)', color: '#00E054', border: '1px solid #00E054', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>{t('contest_active_badge', 'A DECORRER')}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{p.contest_name}</span>
                              {p.is_winner ? (
                                <span style={{ background: 'var(--accent)', color: 'white', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 900, boxShadow: '0 4px 12px rgba(229,9,20,0.4)' }}>{t('contest_winner_badge', 'VENCEDOR')}</span>
                              ) : isEnded ? (
                                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>{t('contest_ended_badge', 'TERMINADO')}</span>
                              ) : (
                                <span style={{ background: 'rgba(0,220,100,0.2)', color: '#00E054', border: '1px solid #00E054', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>{t('contest_active_badge', 'A DECORRER')}</span>
                              )}
                            </div>
                          )}

                          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'space-between' }}>
                            <div style={{ minHeight: 36, display: 'flex', alignItems: 'flex-start' }}>
                              {p.title_name && p.contest_name !== p.title_name && (
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>{t('contests_title', 'Passatempo')}:</strong> {p.contest_name}
                                </div>
                              )}
                            </div>

                            {p.title_slug && (
                              <Link to={`/movie/${p.title_slug}`} className={p.is_winner ? "btn-primary" : "btn-secondary"} style={{ width: '100%', textAlign: 'center', padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', marginTop: 'auto', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                                {t('profile_view_movie', 'Ver Filme')}
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
                    {t('profile_no_participations', 'Este utilizador ainda não participou em passatempos exclusivos.')}
                  </div>
                )
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            width: '100%', maxWidth: 600, background: '#1a1a1a',
            borderRadius: 24, border: '1px solid var(--glass-border)',
            overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{t('profile_edit_btn', 'Editar Perfil')}</h2>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
            </div>

            <div style={{ padding: 30, maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <FormGroup label={t('auth_first_name', 'Primeiro Nome')} value={editData.first_name} onChange={v => setEditData({ ...editData, first_name: v })} />
                <FormGroup label={t('auth_last_name', 'Último Nome')} value={editData.last_name} onChange={v => setEditData({ ...editData, last_name: v })} />
              </div>
              <FormGroup label={t('profile_edit_bio', 'Biografia')} type="textarea" value={editData.bio} onChange={v => setEditData({ ...editData, bio: v })} />

              <h3 style={{ fontSize: 14, marginTop: 30, marginBottom: 15, color: 'var(--text-secondary)' }}>{t('profile_edit_images', 'IMAGENS')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                <button onClick={() => avatarInputRef.current?.click()} style={{ padding: 15, borderRadius: 12, border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <Camera size={16} /> {t('profile_change_avatar', 'Mudar Avatar')}
                </button>
                <button onClick={() => coverInputRef.current?.click()} style={{ padding: 15, borderRadius: 12, border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <Camera size={16} /> {t('profile_change_cover', 'Mudar Capa')}
                </button>
              </div>

              <h3 style={{ fontSize: 14, marginTop: 30, marginBottom: 15, color: 'var(--text-secondary)' }}>{t('profile_edit_socials', 'REDES SOCIAIS')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <SocialInput icon={<Star size={16} />} placeholder={t('profile_placeholder_imdb', 'Nome de utilizador IMDb')} value={editData.social_links?.imdb} onChange={v => setEditData({ ...editData, social_links: { ...editData.social_links, imdb: v } })} />
                <SocialInput icon={<div style={{ fontSize: 12, fontWeight: 900 }}>LB</div>} placeholder={t('profile_placeholder_letterboxd', 'Nome de utilizador Letterboxd')} value={editData.social_links?.letterboxd} onChange={v => setEditData({ ...editData, social_links: { ...editData.social_links, letterboxd: v } })} />
                <SocialInput icon={<div style={{ fontSize: 12, fontWeight: 900 }}>SK</div>} placeholder={t('profile_placeholder_simkl', 'Nome de utilizador Simkl')} value={editData.social_links?.simkl} onChange={v => setEditData({ ...editData, social_links: { ...editData.social_links, simkl: v } })} />
                <SocialInput icon={<div style={{ fontWeight: 900, fontSize: 14 }}>X</div>} placeholder={t('profile_placeholder_twitter', 'Nome de utilizador Twitter / X')} value={editData.social_links?.twitter} onChange={v => setEditData({ ...editData, social_links: { ...editData.social_links, twitter: v } })} />
                <SocialInput icon={<Camera size={16} />} placeholder={t('profile_placeholder_instagram', 'Nome de utilizador Instagram')} value={editData.social_links?.instagram} onChange={v => setEditData({ ...editData, social_links: { ...editData.social_links, instagram: v } })} />
              </div>
            </div>

            <div style={{ padding: '20px 30px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'flex-end', gap: 15 }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: '12px 25px', borderRadius: 12, border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 700 }}>{t('btn_cancel', 'Cancelar')}</button>
              <button onClick={handleSave} style={{ padding: '12px 30px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Save size={18} /> {t('profile_save_changes', 'Guardar Alterações')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Inputs with fixed positioning and visibility hack for better compatibility */}
      <input
        type="file"
        ref={avatarInputRef}
        style={{ position: 'fixed', left: -1000, top: -1000, opacity: 0 }}
        onChange={e => handleFileUpload(e, 'avatar')}
        onClick={(e) => (e.target as any).value = null}
        accept="image/*"
      />
      <input
        type="file"
        ref={coverInputRef}
        style={{ position: 'fixed', left: -1000, top: -1000, opacity: 0 }}
        onChange={e => handleFileUpload(e, 'cover_image')}
        onClick={(e) => (e.target as any).value = null}
        accept="image/*"
      />
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 42, height: 42, borderRadius: 12,
        background: isHovered ? 'rgba(229, 9, 21, 0.15)' : 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isHovered ? 'var(--accent)' : 'var(--text-secondary)',
        border: `1px solid ${isHovered ? 'rgba(229, 9, 21, 0.4)' : 'var(--glass-border)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-3px)' : 'none'
      }}>
      {icon}
    </a>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      {text}
    </div>
  );
}

function TabButton({ id, label, active, onClick }: { id: string, label: string, active: boolean, onClick: (id: string) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        background: 'none', border: 'none',
        padding: '15px 0', fontSize: 14, fontWeight: 700,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer', position: 'relative',
        transition: 'all 0.3s'
      }}>
      {label}
      {active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />}
    </button>
  );
}

function FormGroup({ label, value, onChange, type = 'text' }: { label: string, value: any, onChange: (v: string) => void, type?: 'text' | 'textarea' }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{label}</label>
      {type === 'text' ? (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }}
        />
      ) : (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none', resize: 'none' }}
        />
      )}
    </div>
  );
}

function SocialInput({ icon, placeholder, value, onChange }: { icon: React.ReactNode, placeholder: string, value: any, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', padding: '2px 15px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
      <div style={{ color: 'var(--text-secondary)' }}>{icon}</div>
      <input
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 14 }}
      />
    </div>
  );
}
