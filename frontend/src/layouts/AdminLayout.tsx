import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import {
  BarChart3, Clapperboard, Contact, Newspaper, PlayCircle,
  ListChecks, MessageSquareText, LogOut, Home,
  Tag, Star, Palette, Settings, ClipboardList, User, Users2,
  LayoutGrid, Film, Bell, FolderOpen
} from 'lucide-react';
import { useAuth, getTopRole } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE } from '../config';
import Toast from '../components/Toast';

const iconMap: Record<string, any> = {
  'Métricas': BarChart3,
  'Temas': Palette,
  'Definições': Settings,
  'RGPD': ClipboardList,
  'Utilizadores': User,
  'Artistas': Users2,
  'Geral': LayoutGrid,
  'Filmes': Clapperboard,
  'Séries': Contact,
  'Notícias': Newspaper,
  'Vídeos': PlayCircle,
  'Canais': ListChecks,
  'Contactos': MessageSquareText,
  'Géneros': Tag,
  'Categorias': Tag,
  'Dashboard': Icons.BarChart3,
  'Críticas': Icons.Star,
  'Páginas': Icons.FileText,
  'Ficheiros': FolderOpen,
  'Anúncios': Icons.Megaphone,
  'Passatempos': Icons.Ticket,
  'Alertas': Icons.Bell,
  'Notificações': Icons.Bell
};

interface MenuItem {
  id: number;
  label: string;
  url: string;
  icon?: string;
}

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [appearance, setAppearance] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<any>(null);

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

  // Close sidebar on path changes (for mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin' ? 'active' : '';
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  useEffect(() => {
    fetchAppearance();
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    
    // Background sync every 15 minutes
    const syncInterval = setInterval(async () => {
      try {
        await fetch(`${API_BASE}/admin_google_alerts.php?action=sync`, { credentials: 'include' });
        fetchNotifications();
      } catch (e) {
        console.error('Background sync failed');
      }
    }, 15 * 60000);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin_google_alerts.php?action=items&unread=1&limit=5`, { credentials: 'include' });
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    if (appearance) {
      document.title = `${appearance['general.site_name'] || 'Antestreias'} - Admin`;
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon && appearance['appearance.favicon']) {
        favicon.href = appearance['appearance.favicon'];
      }
    }
  }, [appearance]);

  const fetchAppearance = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin_appearance.php`, { credentials: 'include' });
      const data = await res.json();
      setAppearance(data);
    } catch (err) {
      console.error('Failed to fetch appearance');
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin_menus.php?position=admin_sidebar&lang=${currentLanguage}`, { credentials: 'include' });
      const data = await res.json();
      if (data && data.items) {
        setMenuItems(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch admin menu');
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [currentLanguage]);

  const getIcon = (item: MenuItem) => {
    // Try the specific icon name first (from DB)
    if (item.icon && (Icons as any)[item.icon]) {
      const Icon = (Icons as any)[item.icon];
      return <Icon size={18} />;
    }

    // Fallback to iconMap based on label or icon name
    const iconName = item.icon || item.label;
    const Icon = iconMap[iconName] || iconMap[item.label] || Icons.HelpCircle;
    return <Icon size={18} />;
  };

  return (
    <div className="admin-container">
      {isSidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {appearance?.['appearance.logo_light'] ? (
              <img src={appearance['appearance.logo_light']} alt="Logo" style={{ maxHeight: 30, width: 'auto', display: 'block' }} />
            ) : (
              <>
                <Film color="var(--accent)" />
                <span>{appearance?.['general.site_name'] || 'Antestreias'}</span>
              </>
            )}
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsSidebarOpen(false)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              marginLeft: 'auto',
              display: 'none'
            }}
          >
            <Icons.X size={20} />
          </button>
        </div>
        <nav className="admin-nav" style={{ flex: 1, overflowY: 'auto', padding: '0 10px', scrollbarWidth: 'none' }}>
          {menuItems.length > 0 ? (
            menuItems.map(item => (
              <Link
                key={item.id}
                to={item.url}
                className={location.pathname === item.url ? 'active' : isActive(item.url)}
              >
                {getIcon(item)} {item.label}
              </Link>
            ))
          ) : (
            <>
              <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}><BarChart3 size={18} /> {t('menu_metrics', 'Métricas')}</Link>
              {hasPermission('update_appearance') && <Link to="/admin/settings/themes" className={isActive('/admin/settings/themes')}><Palette size={18} /> {t('menu_themes', 'Temas')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/settings" className={isActive('/admin/settings')}><Settings size={18} /> {t('menu_settings', 'Definições')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/rgpd" className={isActive('/admin/rgpd')}><ClipboardList size={18} /> {t('menu_gdpr', 'RGPD')}</Link>}
              {hasPermission('view_users') && <Link to="/admin/users" className={isActive('/admin/users')}><User size={18} /> {t('menu_users', 'Utilizadores')}</Link>}
              {hasPermission('view_actors') && <Link to="/admin/artists" className={isActive('/admin/artists')}><Users2 size={18} /> {t('menu_artists', 'Elenco')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/general" className={isActive('/admin/general')}><LayoutGrid size={18} /> {t('menu_general', 'Geral')}</Link>}
              {hasPermission('view_titles') && <Link to="/admin/movies" className={isActive('/admin/movies')}><Clapperboard size={18} /> {t('menu_movies', 'Filmes')}</Link>}
              {hasPermission('view_titles') && <Link to="/admin/series" className={isActive('/admin/series')}><Contact size={18} /> {t('menu_series', 'Séries')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/pages" className={isActive('/admin/pages')}><Icons.FileText size={18} /> {t('menu_pages', 'Páginas')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/categories" className={isActive('/admin/categories')}><Tag size={18} /> {t('menu_categories', 'Categorias')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/ads" className={isActive('/admin/ads')}><Icons.Megaphone size={18} /> {t('menu_ads', 'Anúncios')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/contests" className={isActive('/admin/contests')}><Icons.Ticket size={18} /> {t('menu_contests', 'Passatempos')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/files" className={isActive('/admin/files')}><FolderOpen size={18} /> {t('menu_files', 'Ficheiros')}</Link>}
              {hasPermission('view_reviews') && <Link to="/admin/reviews" className={isActive('/admin/reviews')}><Star size={18} /> {t('menu_reviews', 'Críticas')}</Link>}
              {hasPermission('create_news') && <Link to="/admin/news" className={isActive('/admin/news')}><Newspaper size={18} /> {t('menu_news', 'Notícias')}</Link>}
              {hasPermission('view_videos') && <Link to="/admin/videos" className={isActive('/admin/videos')}><PlayCircle size={18} /> {t('menu_videos', 'Vídeos')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/alerts" className={isActive('/admin/alerts')}><Icons.Bell size={18} /> {t('menu_alerts', 'Alertas')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/notifications" className={isActive('/admin/notifications')}><Icons.BellRing size={18} /> {t('menu_notifications', 'Notificações')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/channels" className={isActive('/admin/channels')}><ListChecks size={18} /> {t('menu_channels', 'Canais')}</Link>}
              {hasPermission('access_admin') && <Link to="/admin/contacts" className={isActive('/admin/contacts')}><MessageSquareText size={18} /> {t('menu_contacts', 'Contactos')}</Link>}
            </>
          )}
        </nav>

        <div className="admin-sidebar-footer" style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
          <Link to="/" className="view-site-link" style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Home size={18} /> {t('menu_view_site', 'Ver Site')}
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px'
            }}
          >
            <Icons.Menu size={24} />
          </button>
          <div className="search-box"><input type="text" placeholder={t('nav_search_placeholder', 'Pesquisar...')} /></div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button 
              onClick={() => changeLanguage(currentLanguage === 'pt' ? 'en' : 'pt')}
              className="language-switcher"
              title={currentLanguage === 'pt' ? 'Switch to English' : 'Mudar para Português'}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                transition: 'color 0.2s',
                padding: '4px 8px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {currentLanguage}
            </button>

            <button
              onClick={toggleTheme}
              className="theme-switcher"
              title={activeTheme?.name.toLowerCase() === 'light' ? t('theme_dark', 'Dark mode') : t('theme_light', 'Light mode')}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: '4px 8px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {activeTheme?.name.toLowerCase() === 'light' ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
            </button>

            <Link
              to="/admin/notifications"
              title={t('admin_push_title', 'Notificações Push')}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
                transition: 'color 0.2s',
                padding: '4px 8px',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Icons.Send size={20} />
            </Link>

            <div className="notifications-container" ref={notifRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', position: 'relative', padding: 5 }}
              >
                <Bell size={24} style={{ opacity: showNotifications ? 1 : 0.7 }} />
                {unreadCount > 0 && (
                  <span style={{ 
                    position: 'absolute', top: 2, right: 2, 
                    background: 'var(--accent)', color: 'white', 
                    fontSize: 10, fontWeight: 800, padding: '1px 5px', 
                    borderRadius: '50%', border: '2px solid var(--bg-secondary)'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown glass" style={{
                  position: 'absolute', top: 'calc(100% + 15px)', right: -10,
                  width: 320, background: 'var(--bg-secondary)',
                  borderRadius: 16,
                  border: '1px solid var(--glass-border)', overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 100
                }}>
                  <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Google Alerts</span>
                    <Link to="/admin/alerts" onClick={() => setShowNotifications(false)} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{t('alerts_view_all', 'Ver todos')}</Link>
                  </div>
                  
                  <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', transition: '0.2s' }}>
                          <a href={n.link} target="_blank" rel="noreferrer" onClick={() => {
                            fetch(`${API_BASE}/admin_google_alerts.php`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ mark_read: n.id }),
                              credentials: 'include'
                            }).then(() => fetchNotifications());
                          }} style={{ textDecoration: 'none', color: 'inherit', textAlign: 'left' }}>
                            <div 
                              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5, lineHeight: 1.4 }}
                              dangerouslySetInnerHTML={{ __html: n.title }}
                            />
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(n.pub_date).toLocaleDateString()}</div>
                          </a>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                        {t('alerts_none', 'Nenhum alerta novo.')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 20, borderLeft: '1px solid var(--glass-border)', textDecoration: 'none', color: 'inherit' }}>
              <div className="admin-profile-text" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{getTopRole(user?.role)}</div>
              </div>
              <div className="avatar" style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.username?.charAt(0)}
              </div>
            </Link>

            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 8 }}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
      <Toast />
    </div>
  );
}
