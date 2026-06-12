import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

// Detect browser type
function getBrowser(): 'chrome' | 'firefox' | 'safari' | 'other' {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
  if (ua.includes('Chrome') || ua.includes('Chromium')) return 'chrome';
  return 'other';
}

export default function PwaInstallBanner() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cookiesHandled, setCookiesHandled] = useState(false);
  const promptReadyRef = useRef(false);
  const browser = getBrowser();

  // Check if already installed
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://');

  // Listen for the cookies-handled event from CookieBanner
  useEffect(() => {
    if (isStandalone) return;
    if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') return;

    // If cookies were already accepted before this render, fire immediately
    if (localStorage.getItem('antestreias_cookies_accepted')) {
      setCookiesHandled(true);
      return;
    }

    const handleCookiesDone = () => setCookiesHandled(true);
    window.addEventListener('cookies-handled', handleCookiesDone);
    return () => window.removeEventListener('cookies-handled', handleCookiesDone);
  }, [isStandalone]);

  // Capture the browser install prompt (Chrome/Edge/Android)
  useEffect(() => {
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      promptReadyRef.current = true;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isStandalone]);

  // Show the banner once cookies are handled
  useEffect(() => {
    if (!cookiesHandled) return;
    if (isStandalone) return;
    if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') return;

    // Firefox/Safari: show manual install instructions banner
    // Chrome/Edge: show only when the deferred prompt is captured
    if (browser === 'firefox' || browser === 'safari') {
      // Slight delay so it doesn't clash with the cookie banner animation
      setTimeout(() => setIsVisible(true), 800);
    } else {
      // Wait up to 10s for the beforeinstallprompt, then give up
      const timeout = setTimeout(() => {
        if (promptReadyRef.current) {
          setTimeout(() => setIsVisible(true), 800);
        }
      }, 500);

      // Also react instantly if the prompt was already captured
      const interval = setInterval(() => {
        if (promptReadyRef.current) {
          clearInterval(interval);
          clearTimeout(timeout);
          setTimeout(() => setIsVisible(true), 800);
        }
      }, 300);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [cookiesHandled, browser, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsVisible(false);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isStandalone || !isVisible) return null;
  if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') return null;

  // Firefox / Safari — manual instructions
  const isManual = browser === 'firefox' || browser === 'safari';

  const manualLabel =
    browser === 'firefox'
      ? t('pwa_firefox_instructions', 'Toca nos 3 pontos (⋮) e escolhe "Adicionar ao ecrã inicial"')
      : t('pwa_safari_instructions', 'Toca em Partilhar (□↑) e escolhe "Adicionar ao ecrã inicial"');

  return (
    <div
      className="pwa-install-banner glass-panel"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        maxWidth: 500,
        margin: '0 auto',
        padding: '16px 20px',
        zIndex: 999999,
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        animation: 'pwaSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid var(--accent-glow)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          background: 'var(--accent)',
          color: 'white',
          width: 42,
          height: 42,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Download size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('pwa_install_title', 'Instalar App')}
          </h4>
          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            {isManual
              ? manualLabel
              : t('pwa_install_desc', 'Adiciona o Antestreias ao teu ecrã inicial para um melhor acesso.')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isManual && (
          <button
            onClick={handleInstallClick}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {t('pwa_install_btn', 'Instalar')}
          </button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>
      </div>

      <style>{`
        @keyframes pwaSlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
