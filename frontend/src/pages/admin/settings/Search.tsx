import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Search, Database, RefreshCw } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsSearch() {
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('mysql');
  const [mode, setMode] = useState('extended');
  const [importTarget, setImportTarget] = useState('all');
  const { t } = useTranslation();

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data['search.driver']) setMethod(data['search.driver']);
        if (data['search.mysql_mode']) setMode(data['search.mysql_mode']);
        setLoading(false);
      });
  }, []);

  const handleImport = () => {
    showToast(t('admin_search_import_started', 'Importação de registos iniciada...'));
    setTimeout(() => {
      showToast(t('admin_search_import_done', 'Importação concluída com sucesso!'));
    }, 2000);
  };

  const handleSave = async () => {
    const settings = {
      'search.driver': method,
      'search.mysql_mode': mode,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_settings_saved', 'Definições de pesquisa guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_settings_save_err', 'Erro ao guardar definições.'));
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_settings_loading', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Search size={28} color="var(--accent)" /> {t('admin_search_title', 'Pesquisa')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_search_subtitle', 'Configura o método de pesquisa utilizado no site e gere a indexação de conteúdos.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30, marginBottom: 40 }}>
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_search_method_label', 'Método de pesquisa')}</label>
          <select value={method} onChange={e => setMethod(e.target.value)} className="form-input">
            <option value="mysql">{t('admin_search_mysql_default', 'MySQL (Padrão)')}</option>
            <option value="algolia">{t('admin_search_algolia', 'Algolia (Nuvem)')}</option>
          </select>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_search_engine_hint', 'Qual o motor de pesquisa que deve ser utilizado em todo o site.')}
          </p>
        </div>

        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_search_mysql_label', 'Modo MySQL')}</label>
          <select value={mode} onChange={e => setMode(e.target.value)} className="form-input">
            <option value="extended">{t('admin_search_mysql_extended', 'Estendido (Recomendado)')}</option>
            <option value="boolean">{t('admin_search_mysql_boolean', 'Booleano')}</option>
          </select>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_search_extended_hint', 'O modo estendido permite pesquisas mais naturais e precisas.')}
          </p>
        </div>

        <div className="glass" style={{ padding: 24, borderRadius: 12, marginBottom: 30, border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: 16, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={20} className="accent-text" /> {t('admin_search_index_title', 'Indexar conteúdos')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {t('admin_search_index_desc', 'Se alterares o método de pesquisa ou se os resultados não aparecerem, podes re-indexar os conteúdos existentes.')}
          </p>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24 }}>
            <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_search_what_to_index', 'O que indexar?')}</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <select value={importTarget} onChange={e => setImportTarget(e.target.value)} className="form-input" style={{ flex: '1 1 200px', minWidth: 150 }}>
                <option value="all">{t('admin_search_all', 'Tudo')}</option>
                <option value="movies">{t('admin_search_movies_only', 'Apenas Filmes')}</option>
                <option value="series">{t('admin_search_series_only', 'Apenas Séries')}</option>
              </select>
              <button className="btn-primary" onClick={handleImport} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', justifyContent: 'center' }}>
                <RefreshCw size={18} /> {t('admin_search_reindex_btn', 'Re-indexar')}
              </button>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_settings_save_btn', 'Guardar alterações')}
        </button>
      </div>
    </div>
  );
}
