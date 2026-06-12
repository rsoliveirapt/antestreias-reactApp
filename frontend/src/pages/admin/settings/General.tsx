import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Settings } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsGeneral() {
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
  const [baseUrl, setBaseUrl] = useState('https://antestreias.com');
  const [homepageType, setHomepageType] = useState('landingPage');
  const [defaultTheme, setDefaultTheme] = useState('dark');
  const [allowThemeSwitch, setAllowThemeSwitch] = useState(false);
  const [accessMode, setAccessMode] = useState('normal');

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['base_url']) setBaseUrl(data['base_url']);
        if (data['homepage.type']) setHomepageType(data['homepage.type']);
        if (data['themes.default']) setDefaultTheme(data['themes.default']);
        if (data['themes.user_change']) setAllowThemeSwitch(data['themes.user_change'] === 'true');
        if (data['access_mode']) setAccessMode(data['access_mode']);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'base_url': baseUrl,
      'homepage.type': homepageType,
      'themes.default': defaultTheme,
      'themes.user_change': allowThemeSwitch,
      'access_mode': accessMode,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_general_saved', 'Definições gerais guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_settings_save_err', 'Erro ao guardar definições.'));
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/generate_sitemap.php`);
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_general_sitemap_done', 'Sitemap gerado com sucesso!'));
      } else {
        showToast(t('admin_general_sitemap_err', 'Erro ao gerar sitemap.'));
      }
    } catch (err) {
      showToast(t('admin_settings_save_err', 'Erro ao ligar ao servidor.'));
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_settings_loading', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Settings size={28} color="var(--accent)" /> {t('admin_general_title', 'Geral')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_general_subtitle', 'Configurações básicas e globais do site.')}
        </p>
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_general_base_url', 'URL principal do site')}</label>
        <input 
          type="text" 
          value={baseUrl} 
          onChange={e => setBaseUrl(e.target.value)} 
          className="form-input" 
          placeholder="https://antestreias.com"
        />
        <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 8, cursor: 'pointer' }}>{t('admin_general_learn_more', '🔗 Saber mais')}</p>
      </div>

      <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_general_homepage', 'Página inicial do site')}</label>
        <select value={homepageType} onChange={e => setHomepageType(e.target.value)} className="form-input">
          <option value="landingPage">{t('admin_general_page_landing', 'Página inicial')}</option>
          <option value="loginPage">{t('admin_general_page_login', 'Página de início de sessão')}</option>
          <option value="registerPage">{t('admin_general_page_register', 'Página de registo')}</option>
          <option value="customPage">{t('admin_general_page_custom', 'Página personalizada')}</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('admin_general_homepage_hint', 'Que página deve ser utilizada como página inicial do site.')}
        </p>
      </div>

      <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_general_access_mode', 'Estado do Portal')}</label>
        <select value={accessMode} onChange={e => setAccessMode(e.target.value)} className="form-input">
          <option value="normal">{t('admin_general_access_normal', 'Normal (Aberto ao público)')}</option>
          <option value="maintenance">{t('admin_general_access_maintenance', 'Modo de Manutenção')}</option>
          <option value="coming_soon">{t('admin_general_access_coming_soon', 'Modo Brevemente')}</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('admin_general_access_mode_hint', 'Selecione se o portal deve estar aberto, em manutenção para atualizações ou no modo de lançamento.')}
        </p>
      </div>

      <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_general_theme', 'Tema padrão do site')}</label>
        <select value={defaultTheme} disabled className="form-input">
          <option value="dark">{t('admin_general_theme_dark_premium', 'Dark (Premium)')}</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('admin_general_theme_hint', 'Atualmente o site está configurado para utilizar apenas o tema Dark para manter a estética premium.')}
        </p>
      </div>

      <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <button 
          onClick={handleGenerateSitemap}
          style={{ 
            background: 'transparent', 
            border: '1px solid #ff0000', 
            color: '#ff0000', 
            padding: '8px 16px', 
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          {t('admin_general_sitemap_btn', 'Gerar mapa do site (sitemap)')}
        </button>
        <p style={{ fontSize: 14 }}>{t('admin_general_sitemap_url_hint', 'Uma vez gerado, o URL do mapa do site será:')}</p>
        <p style={{ fontSize: 14, color: '#ff0000' }}>{baseUrl}/storage/sitemaps/sitemap-index.xml</p>
      </div>

      <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSave}>
        {t('admin_settings_save_btn', 'Guardar alterações')}
      </button>
    </div>
  );
}
