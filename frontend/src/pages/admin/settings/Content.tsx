import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Database } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Geral State
  const [ratingSource, setRatingSource] = useState('tmdb');
  const [reviewsEnabled, setReviewsEnabled] = useState(true);

  // Automação State
  const [searchMethod, setSearchMethod] = useState('tmdb');
  const [titleAutomation, setTitleAutomation] = useState(false);
  const [seasonUpdate, setSeasonUpdate] = useState(false);
  const [personAutomation, setPersonAutomation] = useState(false);
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [tmdbLanguage, setTmdbLanguage] = useState('pt-PT');
  const [adultContent, setAdultContent] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['content.rating_column']) setRatingSource(data['content.rating_column']);
        if (data['content.enable_reviews']) setReviewsEnabled(data['content.enable_reviews'] === 'true');
        if (data['content.search_provider']) setSearchMethod(data['content.search_provider']);
        if (data['content.title_automation']) setTitleAutomation(data['content.title_automation'] === 'true');
        if (data['content.season_automation']) setSeasonUpdate(data['content.season_automation'] === 'true');
        if (data['content.people_automation']) setPersonAutomation(data['content.people_automation'] === 'true');
        if (data['tmdb.api_key']) setTmdbApiKey(data['tmdb.api_key']);
        if (data['tmdb.language']) setTmdbLanguage(data['tmdb.language']);
        if (data['tmdb.includeAdult']) setAdultContent(data['tmdb.includeAdult'] === 'true');
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar definições:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'content.rating_column': ratingSource,
      'content.enable_reviews': reviewsEnabled,
      'content.search_provider': searchMethod,
      'content.title_automation': titleAutomation,
      'content.season_automation': seasonUpdate,
      'content.people_automation': personAutomation,
      'tmdb.api_key': tmdbApiKey,
      'tmdb.language': tmdbLanguage,
      'tmdb.includeAdult': adultContent,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_settings_saved', 'Definições guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_settings_save_err', 'Erro ao guardar definições.'));
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_settings_loading', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Database size={28} color="var(--accent)" /> {t('admin_content_title', 'Conteúdo')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('admin_content_subtitle', 'Configura como os filmes e séries são importados e exibidos.')}</p>
      </div>

      <div className="settings-tabs">
        <button className={`settings-tab ${activeTab === 'geral' ? 'active' : ''}`} onClick={() => setActiveTab('geral')}>{t('admin_content_tab_general', 'Geral')}</button>
        <button className={`settings-tab ${activeTab === 'automacao' ? 'active' : ''}`} onClick={() => setActiveTab('automacao')}>{t('admin_content_tab_automation', 'Automação')}</button>
      </div>

      <div style={{ marginBottom: 40 }}>
        {activeTab === 'geral' && (
          <div>
            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_content_rating_label', 'Classificação usada para ordenação')}</label>
              <select value={ratingSource} onChange={e => setRatingSource(e.target.value)} className="form-input">
                <option value="tmdb">TheMovieDB</option>
                <option value="local">{t('admin_content_local_rating', 'Antestreias User Rating')}</option>
              </select>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                {t('admin_content_rating_hint', 'Ao ordenar títulos por classificação, deve ser usada a classificação dos utilizadores locais ou a média do TheMovieDB.')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
              <label className="toggle-switch">
                <input type="checkbox" checked={reviewsEnabled} onChange={e => setReviewsEnabled(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_content_enable_reviews', 'Ativar críticas')}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_content_enable_reviews_hint', 'Ativar ou desativar todas as funcionalidades de crítica no site.')}</span>
              </div>
            </div>
            </div>
        )}

        {activeTab === 'automacao' && (
          <div>
            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_content_search_method', 'Método de pesquisa')}</label>
              <select value={searchMethod} onChange={e => setSearchMethod(e.target.value)} className="form-input">
                <option value="tmdb">TheMovieDB</option>
                <option value="local">Antestreias</option>
              </select>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                {t('admin_content_search_hint', 'Qual o método que deve ser utilizado para a pesquisa dos utilizadores no site.')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
              <label className="toggle-switch">
                <input type="checkbox" checked={titleAutomation} onChange={e => setTitleAutomation(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_content_title_automation', 'Automação de títulos')}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_content_title_automation_hint', 'Isto irá importar automaticamente, e atualizar periodicamente, todos os metadados disponíveis no TheMovieDB sobre o título quando um utilizador visitar a página desse título.')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30, borderBottom: '1px solid var(--glass-border)', paddingBottom: 30 }}>
              <label className="toggle-switch">
                <input type="checkbox" checked={seasonUpdate} onChange={e => setSeasonUpdate(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_content_season_update', 'Atualizar sempre temporadas')}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_content_season_update_hint', 'Quando isto está ativado, os episódios da temporada serão atualizados automaticamente, mesmo que a automação de títulos esteja desativada.')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30, borderBottom: '1px solid var(--glass-border)', paddingBottom: 30 }}>
              <label className="toggle-switch">
                <input type="checkbox" checked={personAutomation} onChange={e => setPersonAutomation(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_content_person_automation', 'Automação de pessoas')}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_content_person_automation_hint', 'Isto irá importar automaticamente, e atualizar periodicamente, todos os metadados disponíveis no TheMovieDB sobre uma pessoa, quando um utilizador visitar a página dessa pessoa.')}</span>
              </div>
            </div>

            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_content_tmdb_key', 'Chave API do TheMovieDB')}</label>
              <input type="text" value={tmdbApiKey} onChange={e => setTmdbApiKey(e.target.value)} className="form-input" />
              <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 8, cursor: 'pointer' }}>{t('admin_content_learn_more', '🔗 Saber mais')}</p>
            </div>

            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_content_tmdb_lang', 'Idioma do TheMovieDB')}</label>
              <select value={tmdbLanguage} onChange={e => setTmdbLanguage(e.target.value)} className="form-input">
                <option value="pt-PT">{t('admin_content_lang_pt', 'Português')}</option>
                <option value="en-US">{t('admin_content_lang_en', 'Inglês')}</option>
                <option value="bilingual">{t('admin_content_lang_bilingual', 'Bilingue (Português + Inglês)')}</option>
              </select>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                {t('admin_content_tmdb_lang_hint', 'Em que idioma deve o conteúdo ser obtido do TMDb. Ao selecionar a opção Bilingue, os dados serão importados tanto em Português como em Inglês de forma a permitir a tradução dinâmica no frontend.')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
              <label className="toggle-switch">
                <input type="checkbox" checked={adultContent} onChange={e => setAdultContent(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <div>
                <strong style={{ display: 'block' }}>{t('admin_content_adult_content', 'Importar conteúdo para adultos')}</strong>
              </div>
            </div>
          </div>
        )}

        <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSave}>
          {t('admin_settings_save_btn', 'Guardar alterações')}
        </button>
      </div>
    </div>
  );
}
