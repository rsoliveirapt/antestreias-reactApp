import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsLayout() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname.includes(path) ? 'active' : '';

  const menuItems = [
    { path: '/admin/settings/search', label: t('settings_menu_search', 'Pesquisa local') },
    { path: '/admin/settings/content', label: t('settings_menu_content', 'Conteúdo') },
    { path: '/admin/settings/videos', label: t('settings_menu_videos', 'Vídeos') },
    { path: '/admin/settings/general', label: t('settings_menu_general', 'Geral') },
    { path: '/admin/settings/registration', label: t('settings_menu_registration', 'Registos') },
    { path: '/admin/settings/localization', label: t('settings_menu_localization', 'Localização') },
    { path: '/admin/settings/auth', label: t('settings_menu_auth', 'Autenticação') },
    { path: '/admin/settings/roles', label: t('settings_menu_roles', 'Cargos e Permissões') },
    { path: '/admin/settings/uploads', label: t('settings_menu_uploads', 'Carregamentos') },
    { path: '/admin/settings/mail', label: t('settings_menu_mail', 'E-mail de saída') },
    { path: '/admin/settings/cache', label: t('settings_menu_cache', 'Cache') },
    { path: '/admin/settings/metrics', label: t('settings_menu_metrics', 'Métricas') },
    { path: '/admin/settings/logging', label: t('settings_menu_logging', 'Logs do Sistema') },
    { path: '/admin/settings/queue', label: t('settings_menu_queue', 'Fila (Queue)') },
    { path: '/admin/settings/recaptcha', label: t('settings_menu_recaptcha', 'Recaptcha') },
    { path: '/admin/settings/gdpr', label: t('settings_menu_gdpr', 'RGPD') },
    { path: '/admin/settings/seo', label: t('settings_menu_seo', 'SEO') },
    { path: '/admin/settings/appearance', label: t('settings_menu_appearance', 'Aparência') },
    { path: '/admin/settings/appearance/slider', label: t('settings_menu_slider', 'Slider Inicial'), sub: true },
    { path: '/admin/settings/themes', label: t('settings_menu_themes', 'Temas'), sub: true },
    { path: '/admin/settings/menus', label: t('settings_menu_menus', 'Menus'), sub: true },
    { path: '/admin/settings/footer', label: t('settings_menu_footer', 'Rodapé'), sub: true },
    { path: '/admin/settings/appearance/mail', label: t('settings_menu_emails', 'E-mails'), sub: true },
    { path: '/admin/settings/appearance/mail/templates', label: t('settings_menu_templates', 'Templates'), sub: true },
  ];

  // Ordenar itens pelo comprimento do path descendente para correspondência precisa de caminhos aninhados
  const sortedMenuItems = [...menuItems].sort((a, b) => b.path.length - a.path.length);
  const activeItem = sortedMenuItems.find(item => location.pathname.startsWith(item.path)) || menuItems[0];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [dropdownOpen]);

  return (
    <div className="settings-layout">
      {isMobile ? (
        <div className="settings-dropdown-container" style={{ position: 'relative', width: '100%', zIndex: 100 }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'left'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>⚙️</span>
              <span>{activeItem?.label}</span>
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: 'var(--text-secondary)'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="glass"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                zIndex: 9999,
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '8px 0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
              }}
            >
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    color: location.pathname.includes(item.path) ? 'var(--accent)' : 'var(--text-primary)',
                    fontSize: 14,
                    textDecoration: 'none',
                    background: location.pathname.includes(item.path) ? 'rgba(229, 9, 21, 0.05)' : 'transparent',
                    paddingLeft: item.sub ? 36 : 20,
                  }}
                  className="dropdown-item"
                >
                  {item.sub && <ChevronRight size={12} style={{ marginRight: 6, opacity: 0.5 }} />}
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <Link to="/admin/settings/search" className={isActive('search')}>{t('settings_menu_search', 'Pesquisa local')}</Link>
            <Link to="/admin/settings/content" className={isActive('content')}>{t('settings_menu_content', 'Conteúdo')}</Link>
            <Link to="/admin/settings/videos" className={isActive('videos')}>{t('settings_menu_videos', 'Vídeos')}</Link>
            <Link to="/admin/settings/general" className={isActive('general')}>{t('settings_menu_general', 'Geral')}</Link>
            <Link to="/admin/settings/registration" className={isActive('registration')}>{t('settings_menu_registration', 'Registos')}</Link>
            <Link to="/admin/settings/localization" className={isActive('localization')}>{t('settings_menu_localization', 'Localização')}</Link>
            <Link to="/admin/settings/auth" className={isActive('auth')}>{t('settings_menu_auth', 'Autenticação')}</Link>
            <Link to="/admin/settings/roles" className={isActive('roles')}>{t('settings_menu_roles', 'Cargos e Permissões')}</Link>
            <Link to="/admin/settings/uploads" className={isActive('uploads')}>{t('settings_menu_uploads', 'Carregamentos')}</Link>
            <Link to="/admin/settings/mail" className={isActive('mail')}>{t('settings_menu_mail', 'E-mail de saída')}</Link>
            <Link to="/admin/settings/cache" className={isActive('cache')}>{t('settings_menu_cache', 'Cache')}</Link>
            <Link to="/admin/settings/metrics" className={isActive('metrics')}>{t('settings_menu_metrics', 'Métricas')}</Link>
            <Link to="/admin/settings/logging" className={isActive('logging')}>{t('settings_menu_logging', 'Logs do Sistema')}</Link>
            <Link to="/admin/settings/queue" className={isActive('queue')}>{t('settings_menu_queue', 'Fila (Queue)')}</Link>
            <Link to="/admin/settings/recaptcha" className={isActive('recaptcha')}>{t('settings_menu_recaptcha', 'Recaptcha')}</Link>
            <Link to="/admin/settings/gdpr" className={isActive('gdpr')}>{t('settings_menu_gdpr', 'RGPD')}</Link>
            <Link to="/admin/settings/seo" className={isActive('seo')}>{t('settings_menu_seo', 'SEO')}</Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link to="/admin/settings/appearance" className={location.pathname === '/admin/settings/appearance' ? 'active' : ''}>{t('settings_menu_appearance', 'Aparência')}</Link>
              <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 24, gap: 2, marginTop: 2, marginBottom: 4 }}>
                <Link to="/admin/settings/appearance/slider" className={isActive('appearance/slider')} style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={14} style={{ marginRight: 6 }} /> {t('settings_menu_slider', 'Slider Inicial')}
                </Link>
                <Link to="/admin/settings/themes" className={isActive('themes')} style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={14} style={{ marginRight: 6 }} /> {t('settings_menu_themes', 'Temas')}
                </Link>
                <Link to="/admin/settings/menus" className={isActive('menus')} style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={14} style={{ marginRight: 6 }} /> {t('settings_menu_menus', 'Menus')}
                </Link>
                <Link to="/admin/settings/footer" className={isActive('footer')} style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={14} style={{ marginRight: 6 }} /> {t('settings_menu_footer', 'Rodapé')}
                </Link>
                <Link to="/admin/settings/appearance/mail" className={isActive('appearance/mail')} style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={14} style={{ marginRight: 6 }} /> {t('settings_menu_emails', 'E-mails')}
                </Link>
                <Link to="/admin/settings/appearance/mail/templates" className={isActive('appearance/mail/templates')} style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center', paddingLeft: 40 }}>
                  <ChevronRight size={14} style={{ marginRight: 6 }} /> {t('settings_menu_templates', 'Templates')}
                </Link>
              </div>
            </div>
          </nav>
        </aside>
      )}
      <main className="settings-main">
        <Outlet />
      </main>
    </div>
  );
}
