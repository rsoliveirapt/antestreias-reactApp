import { useState, useEffect } from 'react';
import { Film, Sun, Moon, ArrowRight } from 'lucide-react';
import { API_BASE } from '../config';

interface Props {
  mode: 'maintenance' | 'coming_soon';
}

export default function SplashPage({ mode }: Props) {
  // Check local storage or system preference for theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('splash_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [appearance, setAppearance] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('navbar_appearance');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('splash_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Dynamic fetch to get live logo URLs (allowed under maintenance modes)
    fetch(`${API_BASE}/admin_appearance.php`)
      .then(res => res.json())
      .then(data => {
        setAppearance(data);
        localStorage.setItem('navbar_appearance', JSON.stringify(data));
      })
      .catch(err => console.error("Error fetching appearance on splash page:", err));
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isMaintenance = mode === 'maintenance';
  const isDark = theme === 'dark';

  // Determine logo URL depending on the dark/light background theme
  const logoUrl = appearance
    ? (isDark
      ? (appearance['appearance.logo_light'] || appearance['appearance.logo_dark'])
      : (appearance['appearance.logo_dark'] || appearance['appearance.logo_light']))
    : null;

  const siteName = appearance?.['general.site_name'] || 'Antestreias';

  // Styles matching the premium application aesthetic
  const colors = {
    dark: {
      background: 'radial-gradient(circle at center, #191818 0%, #0c0c0c 100%)',
      textColor: '#ffffff',
      subText: '#b3b3b3',
      cardBg: 'rgba(34, 34, 34, 0.45)',
      cardBorder: '1px solid #2e2e2e',
      btnBg: 'rgba(255, 255, 255, 0.04)',
      btnText: '#ffffff',
      btnBorder: '1px solid rgba(255, 255, 255, 0.08)',
      accent: '#E50915',
      accentGlow: 'rgba(229, 9, 21, 0.4)',
      adminLink: 'rgba(255, 255, 255, 0.45)',
      adminLinkHover: '#E50915',
    },
    light: {
      background: 'radial-gradient(circle at center, #f8f8f8 0%, #e5e5e5 100%)',
      textColor: '#191818',
      subText: '#555555',
      cardBg: 'rgba(255, 255, 255, 0.75)',
      cardBorder: '1px solid rgba(0, 0, 0, 0.1)',
      btnBg: 'rgba(0, 0, 0, 0.03)',
      btnText: '#191818',
      btnBorder: '1px solid rgba(0, 0, 0, 0.08)',
      accent: '#E50915',
      accentGlow: 'rgba(229, 9, 21, 0.2)',
      adminLink: 'rgba(0, 0, 0, 0.55)',
      adminLinkHover: '#E50915',
    }
  };

  const currentColors = colors[theme];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: currentColors.background,
      color: currentColors.textColor,
      fontFamily: "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      padding: 20,
      transition: 'background 0.3s ease, color 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Theme Toggle */}
      <button
        onClick={handleToggleTheme}
        aria-label="Toggle theme"
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: currentColors.btnBg,
          border: currentColors.btnBorder,
          color: currentColors.btnText,
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s',
          zIndex: 10
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Main Announcement Card */}
      <div style={{
        width: '100%',
        maxWidth: 500,
        padding: '50px 40px',
        textAlign: 'center',
        zIndex: 5
      }}>
        {/* Brand Logo or Text */}
        <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'center' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              style={{
                maxHeight: 48,
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Film size={32} color={currentColors.accent} style={{ filter: `drop-shadow(0 0 8px ${currentColors.accentGlow})` }} />
              <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
                {siteName}
              </span>
            </div>
          )}
        </div>

        {/* Status Mode Title */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 16,
          letterSpacing: '-0.5px'
        }}>
          {isMaintenance ? 'Em Manutenção' : 'Brevemente'}
        </h1>

        {/* Message */}
        <p style={{
          color: currentColors.subText,
          fontSize: 15,
          lineHeight: 1.6,
          marginBottom: 32,
          maxWidth: '380px',
          margin: '0 auto 32px'
        }}>
          {isMaintenance
            ? 'Estamos a efetuar melhorias técnicas no Antestreias para proporcionar uma experiência cinematográfica incrível. Voltamos a estar online muito em breve!'
            : 'O Antestreias está a ser preparado para o lançamento. Prepara as pipocas, novidades espetaculares estão a caminho!'}
        </p>

        {/* Subtle Administration Access Link */}
        <div style={{ marginTop: 40 }}>
          <a
            href="/login"
            style={{
              fontSize: 13,
              color: currentColors.adminLink,
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = currentColors.adminLinkHover;
              const icon = e.currentTarget.querySelector('svg');
              if (icon) icon.style.transform = 'translateX(2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = currentColors.adminLink;
              const icon = e.currentTarget.querySelector('svg');
              if (icon) icon.style.transform = 'none';
            }}
          >
            Login <ArrowRight size={14} style={{ transition: 'transform 0.2s' }} />
          </a>
        </div>
      </div>
    </div>
  );
}
