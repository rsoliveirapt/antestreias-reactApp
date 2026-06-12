import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Film, Search, User, Menu, LayoutDashboard, Tv, Users, Settings, List, 
  MessageSquare, Languages, Home, Star, Heart, Info, HelpCircle, Bookmark, 
  Calendar, Camera, Check, Circle, Cloud, Compass, CreditCard, Download, 
  Edit, Eye, LogOut, Map, Mic, Moon, Sun, Music, Phone, Play, PlusCircle, 
  ShoppingBag, Zap, ChevronDown, Ticket, Newspaper, FileText, Clapperboard,
  Palette, ClipboardList, Users2, LayoutGrid, Contact, PlayCircle, ListChecks,
  MessageSquarePlus, MessageSquareText, Activity, Clock, Globe, Shield, Lock,
  Database, Mail, Image, Video, BarChart3, Trash2, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE } from '../config';

const iconMap: Record<string, any> = {
  LayoutDashboard, Film, Tv, Users, Settings, List, MessageSquare, Languages, 
  Home, Star, Heart, Info, HelpCircle, Bookmark, Calendar, Camera, Check, 
  Circle, Cloud, Compass, CreditCard, Download, Edit, Eye, LogOut, Map, 
  Mic, Moon, Sun, Music, Phone, Play, PlusCircle, ShoppingBag, Zap, Ticket,
  Newspaper, FileText, Clapperboard, Palette, ClipboardList, Users2, 
  LayoutGrid, Contact, PlayCircle, ListChecks, MessageSquarePlus, 
  MessageSquareText, Activity, Clock, Globe, Shield, Lock, Database, 
  Mail, Image, Video, BarChart3, Trash2, User
};

export default function Navbar() {
  const { user, logout, hasPermission } = useAuth();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`navbar_menu_${currentLanguage}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appearance, setAppearance] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('navbar_appearance');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [showThemeToggle, setShowThemeToggle] = useState(false);
  const [footerSettings, setFooterSettings] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/menu.php?pos=primary&lang=${currentLanguage}`)
      .then(res => res.json())
      .then(data => {
        setMenuItems(data);
        localStorage.setItem(`navbar_menu_${currentLanguage}`, JSON.stringify(data));
      })
      .catch(err => console.error("Error fetching menu:", err));
    
    fetch(`${API_BASE}/admin_appearance.php`)
      .then(res => res.json())
      .then(data => {
        setAppearance(data);
        localStorage.setItem('navbar_appearance', JSON.stringify(data));
      })
      .catch(err => console.error("Error fetching appearance:", err));
  }, [currentLanguage]);

  useEffect(() => {
    // Fetch themes for toggle
    fetch(`${API_BASE}/admin_themes.php`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setThemes(data);
          const localPref = localStorage.getItem('theme-preference');
          let active = null;
          if (localPref) {
            active = data.find((t: any) => t.name.toLowerCase() === localPref.toLowerCase());
          }
          if (!active) {
            active = data.find((t: any) => t.is_active === 1 || t.is_active === '1');
          }
          if (active) setActiveTheme(active);
        }
      })
      .catch(err => console.error("Error fetching themes:", err));

    // Fetch footer settings to check show_theme_toggle and display footer info
    fetch(`${API_BASE}/admin_settings.php?group=footer`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setFooterSettings(data);
          if (data['footer.show_theme_toggle'] === '1') {
            setShowThemeToggle(true);
          }
        }
      })
      .catch(err => console.error("Error fetching settings for footer:", err));

    // Listen to theme refresh events
    const handleRefreshTheme = () => {
      fetch(`${API_BASE}/admin_themes.php`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setThemes(data);
            const localPref = localStorage.getItem('theme-preference');
            let active = null;
            if (localPref) {
              active = data.find((t: any) => t.name.toLowerCase() === localPref.toLowerCase());
            }
            if (!active) {
              active = data.find((t: any) => t.is_active === 1 || t.is_active === '1');
            }
            if (active) setActiveTheme(active);
          }
        })
        .catch(err => console.error("Error fetching themes on refresh:", err));
    };
    window.addEventListener('refreshTheme', handleRefreshTheme);
    return () => window.removeEventListener('refreshTheme', handleRefreshTheme);
  }, []);

  const toggleTheme = async () => {
    if (!activeTheme || themes.length < 2) return;
    
    const nextTheme = themes.find((t: any) => 
      activeTheme.name.toLowerCase() === 'dark' ? t.name.toLowerCase() === 'light' : t.name.toLowerCase() === 'dark'
    ) || themes.find((t: any) => t.id !== activeTheme.id);

    if (nextTheme) {
      localStorage.setItem('theme-preference', nextTheme.name.toLowerCase());
      
      try {
        const response = await fetch(`${API_BASE}/admin_themes.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'activate', id: nextTheme.id })
        });
        if (!response.ok) {
          console.warn("Failed to activate theme on server (status: " + response.status + ")");
        }
      } catch (err) {
        console.warn("Failed to save theme preference on server:", err);
      }
      
      setActiveTheme(nextTheme);
      window.dispatchEvent(new Event('refreshTheme'));
    }
  };

  const getIcon = (name: string) => {
    const Icon = iconMap[name];
    if (!Icon) return null;
    return <Icon size={16} style={{ marginRight: 6 }} />;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        fetch(`${API_BASE}/search.php?q=${query}&lang=${currentLanguage}`)
          .then(res => res.json())
          .then(data => {
            setResults(data);
            setShowResults(true);
          });
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentLanguage]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: any) => {
    setShowResults(false);
    setQuery('');
    // Normalize path based on item type
    let path = 'movie';
    if (item.type === 'series') path = 'series';
    if (item.type === 'review') path = 'review';
    if (item.type === 'person') {
      navigate(`/celebrity/${item.slug || item.id}`);
      return;
    }
    if (item.type === 'user') {
      navigate(`/perfil/${item.slug}`);
      return;
    }
    
    navigate(`/${path}/${item.slug || item.id}`);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (<>
    <nav className={`main-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        <div className="nav-left">
          <Link to="/" className="logo">
            {appearance?.['appearance.logo_light'] ? (
              <img
                src={appearance['appearance.logo_light']}
                alt="Logo"
                style={{ maxHeight: 35, maxWidth: 'clamp(100px, 35vw, 180px)', width: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <>
                <Film size={28} color="var(--accent)" />
                <span className="gradient-text">{appearance?.['general.site_name'] || 'Antestreias'}</span>
              </>
            )}
          </Link>
          <div className="nav-links desktop-only">
            {menuItems.length > 0 ? (
              menuItems.map(item => (
                <Link key={item.id} to={item.url} style={{ display: 'flex', alignItems: 'center' }}>
                  {getIcon(item.icon)}
                  {item.label}
                </Link>
              ))
            ) : (
              <>
                {hasPermission('view_titles') && <Link to="/movies">{t('nav_movies', 'Filmes')}</Link>}
                {hasPermission('view_titles') && <Link to="/series">{t('nav_series', 'Séries')}</Link>}
                {hasPermission('access_admin') && <Link to="/contests">{t('nav_contests', 'Passatempos')}</Link>}
                {hasPermission('view_users') && <Link to="/people">{t('nav_people', 'Pessoas')}</Link>}
                {hasPermission('create_news') && <Link to="/news">{t('nav_news', 'Notícias')}</Link>}
              </>
            )}
          </div>
        </div>
        <div className="nav-right">
          <div className="search-box desktop-only" ref={searchRef} style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder={t('nav_search_placeholder', 'Pesquisar...')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { if(results.length > 0) setShowResults(true); }}
            />
            {showResults && (
              <div className="search-dropdown glass">
                {results.length > 0 ? (
                  results.map(r => (
                    <div key={`${r.type}-${r.id}`} className="search-item" onClick={() => handleSelect(r)}>
                      {r.poster ? (
                        <img 
                          src={r.poster} 
                          alt={r.name} 
                          style={{ 
                            width: 40, 
                            height: r.type === 'user' ? 40 : 60, 
                            borderRadius: r.type === 'user' ? '50%' : '8px', 
                            objectFit: 'cover',
                            flexShrink: 0
                          }} 
                        />
                      ) : (
                        <div 
                          className="no-img" 
                          style={{ 
                            width: 40, 
                            height: r.type === 'user' ? 40 : 60, 
                            borderRadius: r.type === 'user' ? '50%' : '8px',
                            flexShrink: 0
                          }}
                        >
                          {r.type === 'user' ? <User size={16}/> : <Film size={12}/>}
                        </div>
                      )}
                      <div className="search-info">
                        <h4>{r.name}</h4>
                        <span>
                          {r.type === 'user' ? t('search_user', 'Utilizador') : (r.type === 'person' ? t('search_celebrity', 'Celebridade') : (r.release_date ? r.release_date.substring(0,4) : 'N/A'))}
                          {r.type !== 'user' && ' • '}
                          {r.type === 'series' ? t('search_series', 'Série') : (r.type === 'person' ? t('search_person', 'Pessoa') : (r.type === 'user' ? '' : t('search_movie', 'Filme')))}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{padding: 15, color: 'var(--text-secondary)', textAlign: 'center'}}>{t('search_no_results', 'Nenhum resultado encontrado.')}</div>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => changeLanguage(currentLanguage === 'pt' ? 'en' : 'pt')}
            className="icon-btn"
            title={currentLanguage === 'pt' ? 'Switch to English' : 'Mudar para Português'}
            style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}
          >
            {currentLanguage}
          </button>

          {showThemeToggle && (
            <button
              onClick={toggleTheme}
              className="icon-btn"
              title={activeTheme?.name.toLowerCase() === 'light' ? t('theme_dark', 'Dark mode') : t('theme_light', 'Light mode')}
            >
              {activeTheme?.name.toLowerCase() === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          )}

          {user ? (
            <div className="user-menu-container" ref={userMenuRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="profile-link-btn" 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', 
                  cursor: 'pointer', padding: 0 
                }}
              >
                <div style={{ 
                  width: 32, height: 32, borderRadius: 10, background: 'var(--accent)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 900, fontSize: 14, overflow: 'hidden',
                  border: showUserMenu ? '2px solid white' : '2px solid transparent',
                  transition: 'all 0.3s'
                }}>
                  {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.username.charAt(0).toUpperCase()}
                </div>
                <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                  <span className="nav-user-display-name" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="nav-user-handle" style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2 }}>
                    @{user.username}
                  </span>
                </div>
                <ChevronDown size={14} opacity={0.7} className="nav-chevron" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </button>

              {showUserMenu && (
                <div className="user-dropdown-menu" style={{
                  position: 'absolute', top: 'calc(100% + 15px)', right: 0,
                  width: 220,
                  borderRadius: 16,
                  overflow: 'hidden',
                  zIndex: 100,
                  animation: 'dropdownFade 0.3s ease-out'
                }}>
                  <div className="dropdown-header">
                    <div className="dropdown-header-name">{user.first_name} {user.last_name}</div>
                    <div className="dropdown-header-handle">@{user.username}</div>
                  </div>
                  
                  <div style={{ padding: 8 }}>
                    <Link to={`/perfil/@${user.username}`} className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <User size={16} /> {t('nav_view_profile', 'Ver Perfil')}
                    </Link>

                    <Link to="/definicoes" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <Settings size={16} /> {t('nav_account_settings', 'Definições de conta')}
                    </Link>

                    {hasPermission('access_admin') && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <LayoutDashboard size={16} /> {t('nav_admin_dashboard', 'Painel de Administração')}
                      </Link>
                    )}

                    <div className="dropdown-divider"></div>

                    <button onClick={handleLogout} className="dropdown-item dropdown-item-logout">
                      <LogOut size={16} /> {t('nav_logout', 'Sair')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="icon-btn"><User size={20} /></Link>
          )}
          
          <button className="icon-btn mobile-only" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu"><Menu size={24} /></button>
        </div>
      </div>
    </nav>

    {/* Mobile Drawer */}
    {mobileMenuOpen && (
      <>
        {/* Backdrop */}
        <div
          onClick={closeMobileMenu}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 100000, backdropFilter: 'blur(4px)'
          }}
        />
        {/* Drawer panel */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 'min(320px, 85vw)',
          background: '#111',
          borderRight: '1px solid var(--glass-border)',
          zIndex: 100001,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInLeft 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Drawer header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 20px', borderBottom: '1px solid var(--glass-border)'
          }}>
            <Link to="/" className="logo" onClick={closeMobileMenu}>
              {appearance?.['appearance.logo_light'] ? (
                <img src={appearance['appearance.logo_light']} alt="Logo" style={{ maxHeight: 30, width: 'auto' }} />
              ) : (
                <><Film size={24} color="var(--accent)" />
                <span className="gradient-text" style={{ fontSize: 18 }}>{appearance?.['general.site_name'] || 'Antestreias'}</span></>
              )}
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Language Switcher */}
              <button
                onClick={() => changeLanguage(currentLanguage === 'pt' ? 'en' : 'pt')}
                title={currentLanguage === 'pt' ? 'Switch to English' : 'Mudar para Português'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {currentLanguage}
              </button>

              {/* Theme Toggle */}
              {showThemeToggle && (
                <button
                  onClick={toggleTheme}
                  title={activeTheme?.name.toLowerCase() === 'light' ? t('theme_dark', 'Dark mode') : t('theme_light', 'Light mode')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 6,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {activeTheme?.name.toLowerCase() === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={closeMobileMenu}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginLeft: 4,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }} ref={searchRef}>
            <div className="search-box" style={{ width: '100%', borderRadius: 12 }}>
              <Search size={18} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder={t('nav_search_placeholder', 'Pesquisar...')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowResults(true); }}
                style={{ width: '100%' }}
              />
            </div>
            {showResults && (
              <div className="search-dropdown glass" style={{ position: 'static', width: '100%', marginTop: 8 }}>
                {results.length > 0 ? (
                  results.map(r => (
                    <div key={`mob-${r.type}-${r.id}`} className="search-item" onClick={() => { handleSelect(r); closeMobileMenu(); }}>
                      {r.poster ? (
                        <img src={r.poster} alt={r.name} style={{ width: 36, height: r.type === 'user' ? 36 : 54, borderRadius: r.type === 'user' ? '50%' : '6px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div className="no-img" style={{ width: 36, height: r.type === 'user' ? 36 : 54, borderRadius: r.type === 'user' ? '50%' : '6px', flexShrink: 0 }}>
                          {r.type === 'user' ? <User size={14}/> : <Film size={10}/>}
                        </div>
                      )}
                      <div className="search-info"><h4>{r.name}</h4></div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 12, color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>{t('search_no_results', 'Nenhum resultado encontrado.')}</div>
                )}
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {menuItems.length > 0 ? (
              menuItems.map(item => (
                <Link
                  key={item.id}
                  to={item.url}
                  onClick={closeMobileMenu}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: 15, transition: 'all 0.2s', borderLeft: '3px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  {getIcon(item.icon)}{item.label}
                </Link>
              ))
            ) : (
              <>
                {hasPermission('view_titles') && <Link to="/movies" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>{t('nav_movies', 'Filmes')}</Link>}
                {hasPermission('view_titles') && <Link to="/series" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>{t('nav_series', 'Séries')}</Link>}
                {hasPermission('access_admin') && <Link to="/contests" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>{t('nav_contests', 'Passatempos')}</Link>}
                {hasPermission('create_news') && <Link to="/news" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>{t('nav_news', 'Notícias')}</Link>}
              </>
            )}
          </nav>

          {/* Footer: user & info */}
          <div style={{ borderTop: '1px solid var(--glass-border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* User */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, overflow: 'hidden' }}>
                    {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{user.first_name} {user.last_name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>@{user.username}</div>
                  </div>
                </div>
                <Link to={`/perfil/@${user.username}`} onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  <User size={16} /> {t('nav_view_profile', 'Ver Perfil')}
                </Link>
                <Link to="/definicoes" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  <Settings size={16} /> {t('nav_account_settings', 'Definições')}
                </Link>
                {hasPermission('access_admin') && (
                  <Link to="/admin" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                    <LayoutDashboard size={16} /> {t('nav_admin_dashboard', 'Admin')}
                  </Link>
                )}
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(229,9,21,0.08)', borderRadius: 10, color: '#ff4444', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                  <LogOut size={16} /> {t('nav_logout', 'Sair')}
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={closeMobileMenu} className="btn-primary" style={{ textAlign: 'center', padding: '12px', fontSize: 14 }}>
                {t('nav_login', 'Iniciar Sessão')}
              </Link>
            )}

            {/* Footer Information */}
            {footerSettings && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
                {/* Social icons */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                  {footerSettings['footer.facebook'] && (
                    <a href={footerSettings['footer.facebook']} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      <FacebookIcon />
                    </a>
                  )}
                  {footerSettings['footer.twitter'] && (
                    <a href={footerSettings['footer.twitter']} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      <TwitterIcon />
                    </a>
                  )}
                  {footerSettings['footer.instagram'] && (
                    <a href={footerSettings['footer.instagram']} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      <InstagramIcon />
                    </a>
                  )}
                  {footerSettings['footer.youtube'] && (
                    <a href={footerSettings['footer.youtube']} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      <YoutubeIcon />
                    </a>
                  )}
                  {footerSettings['footer.tiktok'] && (
                    <a href={footerSettings['footer.tiktok']} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      <TiktokIcon />
                    </a>
                  )}
                </div>
                {/* Copyright */}
                {footerSettings['footer.copyright'] && (
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6, lineHeight: 1.4 }}>
                    {footerSettings['footer.copyright']}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <style>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </>
    )}
  </>);
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505a3.017 3.017 0 00-2.122 2.136C0 8.055 0 12 0 12s0 3.945.501 5.814a3.015 3.015 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.945 24 12 24 12s0-3.945-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.35-.63.44-1.01 1.15-1.01 1.92-.01.55.22 1.13.67 1.46.68.52 1.61.57 2.37.28.67-.25 1.13-.86 1.25-1.57.08-1.02.04-2.04.04-3.06V0z"/>
    </svg>
  );
}
