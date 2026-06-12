import { useState, useEffect } from 'react';
import { Wrench, Rocket, Sun, Moon, ArrowRight } from 'lucide-react';

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

  useEffect(() => {
    localStorage.setItem('splash_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isMaintenance = mode === 'maintenance';

  // Styles for Dark and Light themes
  const colors = {
    dark: {
      background: 'radial-gradient(circle at center, #1c1c1c 0%, #080808 100%)',
      textColor: '#ffffff',
      subText: '#aaaaaa',
      cardBg: 'rgba(255, 255, 255, 0.02)',
      cardBorder: '1px solid rgba(255, 255, 255, 0.07)',
      btnBg: 'rgba(255, 255, 255, 0.04)',
      btnText: '#ffffff',
      btnBorder: '1px solid rgba(255, 255, 255, 0.08)',
      accent: '#e50914',
      accentGlow: 'rgba(229, 9, 20, 0.25)',
      adminLink: 'rgba(255, 255, 255, 0.35)',
      adminLinkHover: '#e50914',
    },
    light: {
      background: 'radial-gradient(circle at center, #f5f5f7 0%, #e5e5ea 100%)',
      textColor: '#1c1c1e',
      subText: '#5c5c5e',
      cardBg: 'rgba(255, 255, 255, 0.7)',
      cardBorder: '1px solid rgba(0, 0, 0, 0.08)',
      btnBg: 'rgba(0, 0, 0, 0.03)',
      btnText: '#1c1c1e',
      btnBorder: '1px solid rgba(0, 0, 0, 0.08)',
      accent: '#e50914',
      accentGlow: 'rgba(229, 9, 20, 0.15)',
      adminLink: 'rgba(0, 0, 0, 0.45)',
      adminLinkHover: '#e50914',
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
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Main Announcement Card */}
      <div style={{
        width: '100%',
        maxWidth: 550,
        padding: '50px 40px',
        borderRadius: 28,
        textAlign: 'center',
        background: currentColors.cardBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: currentColors.cardBorder,
        boxShadow: theme === 'dark' ? '0 30px 60px rgba(0, 0, 0, 0.5)' : '0 20px 45px rgba(0, 0, 0, 0.08)',
        transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease',
        zIndex: 5
      }}>
        {/* Glowing Icon Container */}
        <div style={{
          width: 80,
          height: 80,
          background: isMaintenance ? 'rgba(229, 9, 20, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          borderRadius: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          color: isMaintenance ? '#e50914' : '#f59e0b',
          boxShadow: `0 10px 30px ${isMaintenance ? currentColors.accentGlow : 'rgba(245, 158, 11, 0.25)'}`,
          animation: 'pulseGlow 2.5s infinite ease-in-out'
        }}>
          {isMaintenance ? <Wrench size={38} /> : <Rocket size={38} />}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 850,
          marginBottom: 16,
          letterSpacing: '-0.5px'
        }}>
          {isMaintenance ? 'Em Manutenção' : 'Brevemente'}
        </h1>

        {/* Subtitle */}
        <p style={{
          color: currentColors.subText,
          fontSize: 16,
          lineHeight: 1.7,
          marginBottom: 35,
          maxWidth: '440px',
          margin: '0 auto 35px'
        }}>
          {isMaintenance 
            ? 'Estamos a efetuar melhorias técnicas no nosso portal para lhe proporcionar uma experiência cinematográfica incrível. Voltamos a estar online muito em breve!' 
            : 'O novo portal Antestreias.com está a ser preparado para o lançamento. Prepare as pipocas, novidades espetaculares estão a caminho!'}
        </p>

        {/* Action Button */}
        <button
          onClick={() => window.location.reload()}
          style={{
            background: isMaintenance ? '#e50914' : '#f59e0b',
            color: '#ffffff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 6px 20px ${isMaintenance ? 'rgba(229, 9, 20, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Tentar Novamente
        </button>

        {/* Subtle Administration Access Link */}
        <div style={{ marginTop: 45 }}>
          <a
            href="/login"
            style={{
              fontSize: 13,
              color: currentColors.adminLink,
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = currentColors.adminLinkHover;
              const icon = e.currentTarget.querySelector('svg');
              if (icon) icon.style.transform = 'translateX(4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = currentColors.adminLink;
              const icon = e.currentTarget.querySelector('svg');
              if (icon) icon.style.transform = 'none';
            }}
          >
            Administração <ArrowRight size={14} style={{ transition: 'transform 0.2s' }} />
          </a>
        </div>
      </div>

      {/* Styled Keyframe Animation (Inject dynamically) */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
