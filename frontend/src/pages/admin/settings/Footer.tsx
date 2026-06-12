import { useState, useEffect } from 'react';
import { Save, Globe, Share2, Play, Link as LinkIcon, Info } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

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

export default function SettingsFooter() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FooterSettings>({
    'footer.copyright': t('admin_2026_antestreias_todos_os_direitos_reservados', '© 2026 Antestreias. Todos os direitos reservados.'),
    'footer.facebook': '',
    'footer.twitter': '',
    'footer.instagram': '',
    'footer.youtube': '',
    'footer.tiktok': '',
    'footer.tmdb': '',
    'footer.imdb': '',
    'footer.links_title': t('admin_links_uteis', 'Links Úteis'),
    'footer.show_theme_toggle': '1'
  });

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php?group=footer`)
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) showToast(t('admin_configuracoes_do_rodape_guardadas', 'Configurações do rodapé guardadas!'), 'success');
      else showToast(t('admin_erro_ao_guardar_configuracoes', 'Erro ao guardar configurações.'), 'error');
    } catch {
      showToast(t('admin_erro_de_ligacao', 'Erro de ligação.'), 'error');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>{t('admin_a_carregar', 'A carregar...')}</div>;

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Info size={20} color="var(--accent)" /> {t('admin_informacoes_gerais', 'Informações Gerais')}
        </h2>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label className="form-label">{t('admin_texto_de_copyright', 'Texto de Copyright')}</label>
            <input 
              className="form-input" 
              value={settings['footer.copyright']} 
              onChange={e => setSettings({...settings, 'footer.copyright': e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label">{t('admin_titulo_da_seccao_de_links', 'Título da Secção de Links')}</label>
            <input 
              className="form-input" 
              value={settings['footer.links_title']} 
              onChange={e => setSettings({...settings, 'footer.links_title': e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="checkbox" 
              id="theme-toggle"
              checked={settings['footer.show_theme_toggle'] === '1'} 
              onChange={e => setSettings({...settings, 'footer.show_theme_toggle': e.target.checked ? '1' : '0'})} 
            />
            <label htmlFor="theme-toggle" style={{ cursor: 'pointer', fontSize: 14 }}>{t('admin_mostrar_botao_de_alternar_tema_darklight', 'Mostrar botão de alternar tema (Dark/Light)')}</label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <LinkIcon size={20} color="var(--accent)" /> {t('admin_redes_sociais', 'Redes Sociais')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} /> {t('admin_facebook_url', 'Facebook (URL)')}
            </label>
            <input 
              className="form-input" 
              placeholder="https://facebook.com/..."
              value={settings['footer.facebook']} 
              onChange={e => setSettings({...settings, 'footer.facebook': e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 size={16} /> Twitter / X (URL)
            </label>
            <input 
              className="form-input" 
              placeholder="https://twitter.com/..."
              value={settings['footer.twitter']} 
              onChange={e => setSettings({...settings, 'footer.twitter': e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 size={16} /> {t('admin_instagram_url', 'Instagram (URL)')}
            </label>
            <input 
              className="form-input" 
              placeholder="https://instagram.com/..."
              value={settings['footer.instagram']} 
              onChange={e => setSettings({...settings, 'footer.instagram': e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={16} /> {t('admin_youtube_url', 'Youtube (URL)')}
            </label>
            <input 
              className="form-input" 
              placeholder="https://youtube.com/..."
              value={settings['footer.youtube']} 
              onChange={e => setSettings({...settings, 'footer.youtube': e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 size={16} /> {t('admin_tiktok_url', 'Tiktok (URL)')}
            </label>
            <input 
              className="form-input" 
              placeholder="https://tiktok.com/@..."
              value={settings['footer.tiktok']} 
              onChange={e => setSettings({...settings, 'footer.tiktok': e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} /> {t('admin_tmdb_url', 'TMDB (URL)')}
            </label>
            <input 
              className="form-input" 
              placeholder="https://themoviedb.org/..."
              value={settings['footer.tmdb']} 
              onChange={e => setSettings({...settings, 'footer.tmdb': e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} /> {t('admin_imdb_url', 'IMDB (URL)')}
            </label>
            <input 
              className="form-input" 
              placeholder="https://imdb.com/..."
              value={settings['footer.imdb']} 
              onChange={e => setSettings({...settings, 'footer.imdb': e.target.value})} 
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={18} /> {saving ? t('admin_a_guardar', 'A guardar...') : t('admin_guardar_alteracoes', 'Guardar Alterações')}
        </button>
      </div>
    </form>
  );
}
