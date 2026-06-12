import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE } from '../config';

// Fires a global event so PwaInstallBanner knows cookies have been handled
export function dispatchCookiesHandled() {
  window.dispatchEvent(new Event('cookies-handled'));
}

export default function CookieBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCookieNotice = async () => {
      const accepted = localStorage.getItem('antestreias_cookies_accepted');
      if (accepted) {
        setLoading(false);
        // Already accepted — let PWA banner know it can show
        dispatchCookiesHandled();
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/admin_settings.php`);
        const data = await res.json();
        if (data['gdpr.cookie_notice'] === 'true' || data['gdpr.cookie_notice'] === '1') {
          setIsVisible(true);
        } else {
          // Cookie notice disabled — let PWA banner show immediately
          dispatchCookiesHandled();
        }
      } catch (err) {
        console.error('Failed to fetch cookie notice setting');
        dispatchCookiesHandled();
      } finally {
        setLoading(false);
      }
    };

    checkCookieNotice();
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('antestreias_cookies_accepted', 'true');
    setIsVisible(false);
    dispatchCookiesHandled();
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('antestreias_cookies_accepted', 'essential');
    setIsVisible(false);
    dispatchCookiesHandled();
  };

  if (loading || !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: 28,
        right: 28,
        maxWidth: 1040,
        margin: '0 auto',
        background: 'var(--glass-bg, #141414)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
        borderRadius: 24,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 999998,
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 36,
        animation: 'cookieSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="cookie-banner-container"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 16,
          background: 'rgba(229, 9, 21, 0.08)', border: '1px solid rgba(229, 9, 21, 0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)', flexShrink: 0, marginTop: 2
        }}>
          <Cookie size={24} />
        </div>
        <div>
          <h3 style={{
            fontSize: 17, fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 6px 0',
            display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.3px'
          }}>
            {t('cookie_title', 'Privacidade e Cookies')}
            <ShieldCheck size={16} color="var(--accent)" />
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
            {t('cookie_text_detailed', 'Utilizamos cookies e tecnologias semelhantes para garantir o funcionamento correto da plataforma, melhorar a tua experiência de navegação e proteger a tua conta. Não utilizamos cookies de rastreio publicitário invasivo. Ao clicar em "Aceitar todos", concordas com a nossa ')}
            <Link to="/cookies" className="premium-cookie-link">{t('cookie_policy', 'Política de Cookies')}</Link>
            {t('cookie_and', ' e ')}
            <Link to="/privacy-policy" className="premium-cookie-link">{t('cookie_privacy_policy', 'Política de Privacidade')}</Link>.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button
          onClick={handleAcceptEssential}
          style={{
            padding: '12px 20px', borderRadius: 12,
            border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
            background: 'var(--glass-bg, rgba(255,255,255,0.05))',
            color: 'var(--text-primary)', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', fontSize: 13.5, whiteSpace: 'nowrap'
          }}
          className="btn-premium-essential"
        >
          {t('cookie_essential', 'Apenas essenciais')}
        </button>
        <button
          onClick={handleAcceptAll}
          style={{
            padding: '12px 26px', borderRadius: 12, border: 'none',
            background: 'var(--accent)', color: '#ffffff', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s', fontSize: 13.5, whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(229, 9, 21, 0.35)'
          }}
          className="btn-premium-accept"
        >
          {t('cookie_accept', 'Aceitar todos')}
        </button>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(80px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .premium-cookie-link {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 600;
          border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.3));
          padding-bottom: 1px;
          transition: all 0.2s ease;
        }
        .premium-cookie-link:hover {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        .btn-premium-essential:hover {
          background: var(--glass-hover, rgba(255,255,255,0.1)) !important;
          border-color: var(--text-secondary, rgba(255,255,255,0.2)) !important;
          color: var(--text-primary) !important;
          transform: translateY(-1px);
        }
        .btn-premium-accept:hover {
          transform: translateY(-1px);
          background: #f00a16 !important;
          box-shadow: 0 6px 20px rgba(229, 9, 21, 0.5) !important;
        }
        .btn-premium-essential:active, .btn-premium-accept:active {
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .cookie-banner-container {
            flex-direction: column;
            align-items: stretch !important;
            padding: 22px !important;
            bottom: 16px !important; left: 16px !important; right: 16px !important;
            border-radius: 20px !important;
          }
          .cookie-banner-container > div:last-child {
            flex-direction: column;
            width: 100%;
          }
          .cookie-banner-container button { width: 100%; }
        }
      `}</style>
    </div>
  );
}
