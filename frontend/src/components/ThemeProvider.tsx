import { useEffect } from 'react';
import { API_BASE } from '../config';

const FONTS: Record<string, string> = {
  'Sistema': 'system-ui, -apple-system, sans-serif',
  'Impact': 'Impact, Charcoal, sans-serif',
  'Arial': 'Arial, Helvetica, sans-serif',
  'Comic Sans MS': '"Comic Sans MS", cursive, sans-serif',
  'Century Gothic': '"Century Gothic", sans-serif',
  'Courier New': '"Courier New", Courier, monospace',
  'Inter': 'Inter, sans-serif',
  'Roboto': 'Roboto, sans-serif',
  'Outfit': 'Outfit, sans-serif',
};

const RADIUS_MAP: Record<string, string> = {
  'Quadrado': '0px',
  'Pequeno': '4px',
  'Médio': '8px',
  'Grande': '12px',
  'Maior': '20px',
  'Pílula': '9999px'
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const localPref = localStorage.getItem('theme-preference');
        let theme: any = null;

        if (localPref) {
          // Fetch all themes to find the one matching the preference
          const res = await fetch(`${API_BASE}/admin_themes.php`, {
            credentials: 'include'
          });
          const allThemes = await res.json();
          if (Array.isArray(allThemes)) {
            theme = allThemes.find((t: any) => t.name.toLowerCase() === localPref.toLowerCase());
          }
        }

        // If no preference or theme not found, fetch active theme from DB
        if (!theme) {
          const res = await fetch(`${API_BASE}/admin_themes.php?active=1`, {
            credentials: 'include'
          });
          theme = await res.json();
        }
        
        if (theme && !theme.error) {
          const root = document.documentElement;
          root.style.setProperty('--bg-primary', theme.color_background);
          root.style.setProperty('--bg-secondary', theme.color_background_alt);
          root.style.setProperty('--accent', theme.color_accent);
          root.style.setProperty('--text-primary', theme.color_foreground);
          
          // Dynamic glass and glow
          root.style.setProperty('--glass-bg', `${theme.color_background_alt}cc`);
          root.style.setProperty('--accent-glow', `${theme.color_accent}66`);
          
          // Apply font family to body
          const fontFamily = FONTS[theme.font_family] || FONTS['Sistema'];
          document.body.style.fontFamily = fontFamily;
          
          // Global radii
          root.style.setProperty('--radius-buttons', RADIUS_MAP[theme.border_radius_buttons] || '8px');
          root.style.setProperty('--radius-inputs', RADIUS_MAP[theme.border_radius_inputs] || '8px');
          root.style.setProperty('--radius-panels', RADIUS_MAP[theme.border_radius_panels] || '12px');

          // Apply theme name class to root and body
          const themeName = theme.name.toLowerCase();
          document.documentElement.classList.remove('theme-light', 'theme-dark');
          document.documentElement.classList.add(`theme-${themeName}`);
          
          document.body.classList.remove('theme-light', 'theme-dark');
          document.body.classList.add(`theme-${themeName}`);

          // Set dynamic text-secondary
          root.style.setProperty('--text-secondary', themeName === 'light' ? '#555555' : '#b3b3b3');
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      }
    };

    applyTheme();
    
    // Custom event to refresh theme when changed in admin
    const handleThemeUpdate = () => applyTheme();
    window.addEventListener('refreshTheme', handleThemeUpdate);
    return () => window.removeEventListener('refreshTheme', handleThemeUpdate);
  }, []);

  return <>{children}</>;
}
