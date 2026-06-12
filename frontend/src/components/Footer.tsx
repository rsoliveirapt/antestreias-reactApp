import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE, apiFetch } from '../config';

interface FooterSettings {
  'footer.copyright': string;
  'footer.facebook': string;
  'footer.twitter': string;
  'footer.instagram': string;
  'footer.youtube': string;
  'footer.tiktok': string;
  'footer.tmdb': string;
  'footer.imdb': string;
  'footer.links_title': string;
  'footer.show_theme_toggle': string;
}

interface MenuItem {
  id: number;
  label: string;
  url: string;
}

export default function Footer() {
  const { t, currentLanguage } = useTranslation();
  const [settings, setSettings] = useState<FooterSettings>({
    'footer.copyright': '© 2026 Antestreias. Todos os direitos reservados.',
    'footer.facebook': '',
    'footer.twitter': '',
    'footer.instagram': '',
    'footer.youtube': '',
    'footer.tiktok': '',
    'footer.tmdb': '',
    'footer.imdb': '',
    'footer.links_title': 'Links Úteis',
    'footer.show_theme_toggle': '1'
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [appearance, setAppearance] = useState<any>(null);

  useEffect(() => {
    // Fetch settings
    apiFetch(`${API_BASE}/admin_settings.php?group=footer`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Error fetching footer settings:", err));

    // Fetch footer menu items
    apiFetch(`${API_BASE}/menu.php?pos=footer&lang=${currentLanguage}`)
      .then(res => res.json())
      .then(data => setMenuItems(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching footer menu:", err));

    // Fetch appearance for the logo
    apiFetch(`${API_BASE}/admin_appearance.php`)
      .then(res => res.json())
      .then(data => setAppearance(data))
      .catch(err => console.error("Error fetching appearance settings:", err));
  }, [currentLanguage]);

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          
          {/* Brand & Socials Column */}
          <div className="footer-brand-column">
            <Link to="/" className="footer-logo">
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
            <p className="footer-description">
              {t('footer_tagline', 'O teu portal de antestreias, trailers, passatempos e novidades do mundo do cinema.')}
            </p>
            <div className="footer-social-links">
              {settings['footer.facebook'] && (
                <a href={settings['footer.facebook']} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {settings['footer.twitter'] && (
                <a href={settings['footer.twitter']} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Twitter">
                  <TwitterIcon />
                </a>
              )}
              {settings['footer.instagram'] && (
                <a href={settings['footer.instagram']} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {settings['footer.youtube'] && (
                <a href={settings['footer.youtube']} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="YouTube">
                  <YoutubeIcon />
                </a>
              )}
              {settings['footer.tiktok'] && (
                <a href={settings['footer.tiktok']} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="TikTok">
                  <TiktokIcon />
                </a>
              )}
              {(settings['footer.tmdb'] || settings['footer.imdb']) && (
                <div className="footer-partner-links">
                  {settings['footer.tmdb'] && (
                    <a href={settings['footer.tmdb']} target="_blank" rel="noreferrer" className="footer-partner-btn" aria-label="TMDb">
                      <TmdbIcon />
                    </a>
                  )}
                  {settings['footer.imdb'] && (
                    <a href={settings['footer.imdb']} target="_blank" rel="noreferrer" className="footer-partner-btn" aria-label="IMDb">
                      <ImdbIcon />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Custom Links Column */}
          <div className="footer-links-column">
            {settings['footer.links_title'] && (
              <h4 className="footer-links-title">{settings['footer.links_title']}</h4>
            )}
            <div className="footer-links-list">
              {menuItems.map(item => (
                <Link 
                  key={item.id} 
                  to={item.url} 
                  className="footer-link"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          {/* Copyright */}
          <div className="footer-copyright">
            {settings['footer.copyright']}
          </div>
        </div>
      </div>
    </footer>
  );
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

function TmdbIcon() {
  return (
    <svg width="60" height="10" viewBox="0 0 273.42 35.52" style={{ verticalAlign: 'middle' }}>
      <path d="M191.85,35.37h63.9A17.67,17.67,0,0,0,273.42,17.7h0A17.67,17.67,0,0,0,255.75,0h-63.9A17.67,17.67,0,0,0,174.18,17.7h0A17.67,17.67,0,0,0,191.85,35.37ZM10.1,35.42h7.8V6.92H28V0H0v6.9H10.1Zm28.1,0H46V8.25h.1L55.05,35.4h6L70.3,8.25h.1V35.4h7.8V0H66.45l-8.2,23.1h-.1L50,0H38.2ZM89.14.12h11.7a33.56,33.56,0,0,1,8.08,1,18.52,18.52,0,0,1,6.67,3.08,15.09,15.09,0,0,1,4.53,5.52,18.5,18.5,0,0,1,1.67,8.25,16.91,16.91,0,0,1-1.62,7.58,16.3,16.3,0,0,1-4.38,5.5,19.24,19.24,0,0,1-6.35,3.37,24.53,24.53,0,0,1-7.55,1.15H89.14Zm7.8,28.2h4a21.66,21.66,0,0,0,5-.55A10.58,10.58,0,0,0,110,26a8.73,8.73,0,0,0,2.68-3.35,11.9,11.9,0,0,0,1-5.08,9.87,9.87,0,0,0-1-4.52,9.17,9.17,0,0,0-2.63-3.18A11.61,11.61,0,0,0,106.22,8a17.06,17.06,0,0,0-4.68-.63h-4.6ZM133.09.12h13.2a32.87,32.87,0,0,1,4.63.33,12.66,12.66,0,0,1,4.17,1.3,7.94,7.94,0,0,1,3,2.72,8.34,8.34,0,0,1,1.15,4.65,7.48,7.48,0,0,1-1.67,5,9.13,9.13,0,0,1-4.43,2.82V17a10.28,10.28,0,0,1,3.18,1,8.51,8.51,0,0,1,2.45,1.85,7.79,7.79,0,0,1,1.57,2.62,9.16,9.16,0,0,1,.55,3.2,8.52,8.52,0,0,1-1.2,4.68,9.32,9.32,0,0,1-3.1,3A13.38,13.38,0,0,1,152.32,35a22.5,22.5,0,0,1-4.73.5h-14.5Zm7.8,14.15h5.65a7.65,7.65,0,0,0,1.78-.2,4.78,4.78,0,0,0,1.57-.65,3.43,3.43,0,0,0,1.13-1.2,3.63,3.63,0,0,0,.42-1.8A3.3,3.3,0,0,0,151,8.6a3.42,3.42,0,0,0-1.23-1.13A6.07,6.07,0,0,0,148,6.9a9.9,9.9,0,0,0-1.85-.18h-5.3Zm0,14.65h7a8.27,8.27,0,0,0,1.83-.2,4.67,4.67,0,0,0,1.67-.7,3.93,3.93,0,0,0,1.23-1.3,3.8,3.8,0,0,0,.47-1.95,3.16,3.16,0,0,0-.62-2,4,4,0,0,0-1.58-1.18,8.23,8.23,0,0,0-2-.55,15.12,15.12,0,0,0-2.05-.15h-5.9Z" fill="currentColor" />
    </svg>
  );
}

function ImdbIcon() {
  return (
    <svg width="34" height="18" viewBox="0 0 48 24" fill="#333">
      <rect x="0" y="0" width="48" height="24" rx="4" />
      <text x="24" y="17" fontFamily="Arial Black, sans-serif" fontSize="16" fontWeight="900" fill="white" textAnchor="middle">IMDb</text>
    </svg>
  );
}
