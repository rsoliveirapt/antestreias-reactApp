import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Save, ArrowLeft, ExternalLink, RefreshCw, Globe, Users, Star, Ticket, Image, Film, Play, Trash2,
  Search, Plus, Pencil, GripVertical, X, Tag
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { API_BASE, apiFetch } from '../../config';
import { sanitizeHTML } from '../../utils/sanitize';
import { useTranslation } from '../../context/LanguageContext';

// v2.1 - Added Cast, Crew, Genres, Countries, Reviews UI


const CERTIFICATIONS = ['', 'G', 'PG', 'PG-13', 'R', 'NC-17', 'NR', 'M/3', 'M/6', 'M/12', 'M/14', 'M/16', 'M/18'];
export default function AdminMediaEdit() {
  const { t } = useTranslation();
  const LANGUAGES = [
    { code: 'en', label: t('admin_english', 'English') }, { code: 'pt', label: t('admin_portuguese', 'Português') },
    { code: 'fr', label: t('admin_francais', 'Français') }, { code: 'es', label: t('admin_espanol', 'Español') },
    { code: 'de', label: t('admin_deutsch', 'Deutsch') }, { code: 'it', label: t('admin_italiano', 'Italiano') },
    { code: 'ja', label: t('admin_japanese', 'Japanese') }, { code: 'ko', label: t('admin_korean', 'Korean') },
  ];
  const SECTIONS = [
    { id: 'main',     label: t('admin_factos_principais', 'Factos Principais') },
    { id: 'images',   label: t('admin_imagens', 'Imagens') },
    { id: 'videos',   label: t('admin_videos', 'Vídeos') },
    { id: 'cast',     label: t('admin_elenco', 'Elenco') },
    { id: 'crew',     label: t('admin_equipa_tecnica', 'Equipa técnica') },
    { id: 'genres',   label: t('admin_categorias', 'Categorias') },
    { id: 'countries',label: t('admin_paises', 'Países') },
    { id: 'reviews',  label: t('admin_criticas', 'Críticas') },
    { id: 'contests', label: 'Passatempos' },
  ];
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSeries = location.pathname.includes('series');
  const activeSections = id === 'new' 
    ? SECTIONS.filter(s => s.id === 'main' || s.id === 'images') 
    : SECTIONS;

  const [media, setMedia] = useState<any>(null);
  const [details, setDetails] = useState<any>({ cast: [], crew: [], genres: [], countries: [], reviews: [], videos: [] });
  const [allGenres, setAllGenres] = useState<any[]>([]);
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState('main');
  const [syncing, setSyncing] = useState(false);
  
  // Modal State
  const [modal, setModal] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const [newContestName, setNewContestName] = useState('');
  const [isAddingContest, setIsAddingContest] = useState(false);
  const [castSearch, setCastSearch] = useState('');
  const [crewSearch, setCrewSearch] = useState('');

  // Add Credit State
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditType, setCreditType] = useState<'cast' | 'crew'>('cast');
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [newCreditData, setNewCreditData] = useState({ character: '', job: '', department: '', order: 0 });
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);

  const loadData = () => {
    if (id === 'new') {
      setMedia({
        name: '',
        original_title: '',
        description: '',
        release_date: new Date().toISOString().split('T')[0],
        poster: '',
        backdrop: '',
        type: isSeries ? 'series' : 'movie',
        is_series: isSeries ? 1 : 0,
        runtime: 0,
        tagline: '',
        certification: '',
        language: 'en',
        budget: 0,
        revenue: 0,
        popularity: 0,
        tmdb_vote_average: 0,
        tmdb_id: '',
        imdb_id: ''
      });
      setDetails({ cast: [], crew: [], genres: [], countries: [], reviews: [], videos: [] });
      setContests([]);
      
      apiFetch(`${API_BASE}/admin_categories.php`, { credentials: 'include' })
        .then(res => res.json()).then(setAllGenres).catch(err => console.error(t('admin_all_genres_load_error', 'All genres load error:'), err));
      apiFetch(`${API_BASE}/admin_production_countries.php`, { credentials: 'include' })
        .then(res => res.json()).then(setAllCountries).catch(err => console.error(t('admin_all_countries_load_error', 'All countries load error:'), err));
    } else {
      apiFetch(`${API_BASE}/admin_media.php?id=${id}`, { credentials: 'include' })
        .then(res => res.json()).then(setMedia).catch(err => console.error(t('admin_media_load_error', 'Media load error:'), err));
      
      apiFetch(`${API_BASE}/title_details.php?id=${id}`, { credentials: 'include' })
        .then(res => res.json()).then(setDetails).catch(err => console.error(t('admin_details_load_error', 'Details load error:'), err));
      
      apiFetch(`${API_BASE}/contests.php?title_id=${id}`, { credentials: 'include' })
        .then(res => res.json()).then(data => setContests(Array.isArray(data) ? data : [])).catch(err => console.error(t('admin_contests_load_error', 'Contests load error:'), err));
      apiFetch(`${API_BASE}/admin_categories.php`, { credentials: 'include' })
        .then(res => res.json()).then(setAllGenres).catch(err => console.error(t('admin_all_genres_load_error', 'All genres load error:'), err));
      apiFetch(`${API_BASE}/admin_production_countries.php`, { credentials: 'include' })
        .then(res => res.json()).then(setAllCountries).catch(err => console.error(t('admin_all_countries_load_error', 'All countries load error:'), err));
    }
  };

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && SECTIONS.some(s => s.id === tab)) {
      setSection(tab);
    } else {
      setSection('main');
    }
  }, [id, location.search]);

  useEffect(() => {
    if (peopleSearchQuery.length < 2) { setPeopleResults([]); return; }
    setIsSearchingPeople(true);
    const delayDebounceFn = setTimeout(() => {
      apiFetch(`${API_BASE}/admin_people.php?search=${peopleSearchQuery}`)
        .then(res => res.json())
        .then(data => {
          setPeopleResults(data.people || []);
          setIsSearchingPeople(false);
        })
        .catch(() => setIsSearchingPeople(false));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [peopleSearchQuery]);

  const handleAddCredit = async () => {
    if (!selectedPerson) return;
    try {
      const res = await apiFetch(`${API_BASE}/admin_credits.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: selectedPerson.id,
          title_id: id,
          type: 'title',
          department: creditType === 'cast' ? 'Acting' : newCreditData.department,
          job: creditType === 'cast' ? 'Actor' : newCreditData.job,
          character: newCreditData.character,
          order: newCreditData.order
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Crédito adicionado!', 'success');
        loadData();
        setShowAddCredit(false);
        setSelectedPerson(null);
        setPeopleSearchQuery('');
        setNewCreditData({ character: '', job: '', department: '', order: 0 });
      }
    } catch { showToast('Erro ao adicionar crédito.', 'error'); }
  };

  const set = (key: string, val: any) => setMedia((m: any) => ({ ...m, [key]: val }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = id === 'new' ? 'POST' : 'PUT';
      const res = await apiFetch(`${API_BASE}/admin_media.php`, {
        method, 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify(media)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Guardado com sucesso!', 'success');
        if (id === 'new') {
          navigate(`/admin/${isSeries ? 'series' : 'movies'}/${data.id}`, { replace: true });
        } else {
          loadData();
        }
      } else showToast('Erro: ' + (data.error || t('admin_erro_ao_guardar', 'Erro ao guardar.')), 'error');
    } catch (err) { 
      console.error(t('admin_save_error', 'Save error:'), err);
      showToast('Erro de ligação.', 'error'); 
    }
    setSaving(false);
  };

  const handleTmdbSync = async () => {
    if (!media?.tmdb_id) { showToast('Este título não tem ID do TMDB.', 'error'); return; }
    setSyncing(true);
    try {
      const res = await apiFetch(`${API_BASE}/tmdb_import.php`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tmdb_id: media.tmdb_id, type: media.type, force: true })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Sincronizado com o TMDB!', 'success');
        loadData();
      } else showToast('Erro: ' + (data.error || t('admin_falha_na_sincronizacao', 'Falha na sincronização')), 'error');
    } catch (err) { 
      console.error(t('admin_sync_error', 'Sync error:'), err);
      showToast('Erro de ligação.', 'error'); 
    }
    setSyncing(false);
  };

  if (!media) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-secondary)' }}>
      {t('admin_a_carregar', 'A carregar...')}
    </div>
  );

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Bar */}
      <div className="media-edit-header">
        <div className="media-edit-header-left">
          <button type="button" onClick={() => navigate(-1)} className="icon-btn"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="media-edit-header-title">
              {id === 'new' ? `Adicionar Nov${isSeries ? 'a Série' : t('admin_o_filme', 'o Filme')}` : `Editar "${media.name}"`}
            </h1>
            <span className="media-edit-header-subtitle">
              {id === 'new' 
                ? (isSeries ? t('admin_serie', 'Série') : 'Filme') 
                : `${isSeries ? t('admin_serie', 'Série') : 'Filme'} · ID #${id} ${media.tmdb_id ? t('admin_tmdb_media_tmdb_id', '· TMDB #${media.tmdb_id}') : ''}`
              }
            </span>
          </div>
        </div>
        <div className="media-edit-header-actions">
          {media.slug && (
            <Link to={`/movie/${media.slug}`} target="_blank" className="btn-secondary">
              <ExternalLink size={16} /> {t('admin_ver_pagina', 'Ver página')}
            </Link>
          )}
          {media.tmdb_id && (
            <button type="button" className="btn-secondary" onClick={handleTmdbSync} disabled={syncing}>
              <RefreshCw size={16} style={{ animation: syncing ? t('admin_spin_1s_linear_infinite', 'spin 1s linear infinite') : 'none' }} />
              {syncing ? t('admin_a_sincronizar', 'A sincronizar...') : t('admin_sincronizar_tmdb', 'Sincronizar TMDB')}
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? t('admin_a_guardar', 'A guardar...') : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Body: Sidebar + Content */}
      <div className="media-edit-layout">
        {/* Sidebar */}
        <aside className="media-edit-sidebar">
          <div className="media-edit-sidebar-title">
            {t('admin_menu_de_edicao', 'Menu de Edição')}
          </div>
          
          {/* Desktop Navigation */}
          <div className={t('admin_media_edit_sidebar_nav_desktop_nav', 'media-edit-sidebar-nav desktop-nav')}>
            {activeSections.map(s => (
              <button 
                key={s.id} 
                type="button" 
                onClick={() => setSection(s.id)}
                className={`media-edit-sidebar-btn ${section === s.id ? 'active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Mobile Navigation Dropdown */}
          <div className={t('admin_media_edit_sidebar_select_wrapper_mobile', 'media-edit-sidebar-select-wrapper mobile-nav')}>
            <select 
              value={section} 
              onChange={e => setSection(e.target.value)}
              className={t('admin_form_input_media_edit_sidebar_select', 'form-input media-edit-sidebar-select')}
            >
              {activeSections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Content Panel */}
        <div className="media-edit-content">

          {/* ── FACTOS PRINCIPAIS ── */}
          {section === 'main' && (
            <div className="media-edit-main-grid">
              {/* Full-width fields */}
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">{t('admin_titulo', 'Título')}</label>
                <input className="form-input" value={media.name || ''} onChange={e => set('name', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">{t('admin_titulo_original', 'Título Original')}</label>
                <input className="form-input" value={media.original_title || ''} onChange={e => set('original_title', e.target.value)} />
              </div>

              {/* Toggle série */}
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="toggle-switch">
                  <input type="checkbox" checked={!!media.is_series} onChange={e => set('is_series', e.target.checked ? 1 : 0)} />
                  <span className="toggle-slider" />
                </label>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('nav_series', 'Séries')}</span>
              </div>

              <div>
                <label className="form-label">{t('admin_data_de_lancamento', 'Data de lançamento')}</label>
                <input type="date" className="form-input" value={media.release_date || ''} onChange={e => set('release_date', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('admin_certificacao', 'Certificação')}</label>
                <select className="form-input" value={media.certification || ''} onChange={e => set('certification', e.target.value)}>
                  {CERTIFICATIONS.map(c => <option key={c} value={c}>{c || t('admin_sem_certificacao', '— Sem certificação —')}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">{t('admin_duracao_minutos', 'Duração (minutos)')}</label>
                <input type="number" className="form-input" value={media.runtime || ''} onChange={e => set('runtime', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('admin_idioma', 'Idioma')}</label>
                <select className="form-input" value={media.language || ''} onChange={e => set('language', e.target.value)}>
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">{t('admin_orcamento_usd', 'Orçamento (USD)')}</label>
                <input type="number" className="form-input" value={media.budget || ''} onChange={e => set('budget', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('admin_receita_usd', 'Receita (USD)')}</label>
                <input type="number" className="form-input" value={media.revenue || ''} onChange={e => set('revenue', e.target.value)} />
              </div>

              <div>
                <label className="form-label">{t('admin_popularidade', 'Popularidade')}</label>
                <input type="number" className="form-input" value={media.popularity || ''} onChange={e => set('popularity', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('admin_classificacao_tmdb', 'Classificação TMDB')}</label>
                <input type="number" step="0.1" min="0" max="10" className="form-input" value={media.tmdb_vote_average || ''} onChange={e => set('tmdb_vote_average', e.target.value)} />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">{t('admin_slogan_tagline', 'Slogan (Tagline)')}</label>
                <input className="form-input" value={media.tagline || ''} onChange={e => set('tagline', e.target.value)} />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">{t('admin_resumo', 'Resumo')}</label>
                <textarea className="form-input" rows={5} value={media.description || ''} onChange={e => set('description', e.target.value)} />
              </div>

              <div>
                <label className="form-label">{t('admin_id_tmdb', 'ID TMDB')}</label>
                <input className="form-input" value={media.tmdb_id || ''} onChange={e => set('tmdb_id', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('admin_id_imdb', 'ID IMDB')}</label>
                <input className="form-input" value={media.imdb_id || ''} onChange={e => set('imdb_id', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── IMAGENS ── */}
          {section === 'images' && (
            <div className="media-edit-images-grid">
              {/* Cartaz */}
              <div>
                <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>{t('admin_cartaz', 'Cartaz')}</label>
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {media.poster
                    ? <img src={media.poster} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Film size={40} opacity={0.2} />}
                </div>
                <label className="form-label">{t('admin_url_do_cartaz', 'URL do Cartaz')}</label>
                <input className="form-input" value={media.poster || ''} onChange={e => set('poster', e.target.value)} placeholder="https://..." />
              </div>

              {/* Backdrop */}
              <div>
                <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>{t('admin_imagem_de_fundo_backdrop', 'Imagem de Fundo (Backdrop)')}</label>
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {media.backdrop
                    ? <img src={media.backdrop} alt="Backdrop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Image size={40} opacity={0.2} />}
                </div>
                <label className="form-label">{t('admin_url_do_backdrop', 'URL do Backdrop')}</label>
                <input className="form-input" value={media.backdrop || ''} onChange={e => set('backdrop', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* ── ELENCO ── */}
          {section === 'cast' && (
            <div>
              <div className="media-edit-section-header">
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                  onClick={() => { setCreditType('cast'); setShowAddCredit(true); }}
                >
                  <Plus size={18} /> {t('admin_adicionar_credito', 'Adicionar crédito')}
                </button>
                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    className="form-input" 
                    placeholder="Procurar..." 
                    style={{ paddingLeft: 38 }}
                    value={castSearch}
                    onChange={e => setCastSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className={t('admin_media_edit_table_container_desktop_only', 'media-edit-table-container desktop-only')}>
                <table className="media-edit-table">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 16px', width: 50 }}></th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_pessoa', 'Pessoa')}</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>"Personagem"</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_acoes', 'Ações')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(details.cast || [])
                      .filter((p: any) => p.name.toLowerCase().includes(castSearch.toLowerCase()) || p.character.toLowerCase().includes(castSearch.toLowerCase()))
                      .map((person: any) => (
                      <tr key={`${person.id}-${person.order}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          <GripVertical size={16} style={{ cursor: 'grab' }} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                              {person.poster ? <img src={person.poster} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ margin: '11px', opacity: 0.2 }} />}
                            </div>
                            <span style={{ fontWeight: 600 }}>{person.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {person.character}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              className="action-btn" 
                              title={t('admin_editar_pessoa', 'Editar Pessoa')}
                              onClick={() => navigate(`/admin/celebrities/${person.person_id}`)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              type="button" 
                              className="action-btn delete" 
                              title={t('admin_eliminar_credito', 'Eliminar Crédito')}
                              onClick={() => {
                                setModal({
                                  open: true,
                                  title: t('admin_eliminar_credito', 'Eliminar Crédito'),
                                  message: `Tem a certeza que deseja remover "${person.name}" como "${person.character}" deste título?`,
                                  onConfirm: async () => {
                                    try {
                                      const res = await apiFetch(`${API_BASE}/admin_credits.php?id=${person.credit_id}`, { method: 'DELETE' });
                                      const data = await res.json();
                                      if (data.success) {
                                        showToast('Crédito removido.', 'success');
                                        setDetails((prev: any) => ({ ...prev, cast: prev.cast.filter((c: any) => c.credit_id !== person.credit_id) }));
                                      }
                                    } catch { showToast('Erro ao eliminar.', 'error'); }
                                    setModal(m => ({ ...m, open: false }));
                                  }
                                });
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={t('admin_media_edit_cards_container_mobile_only', 'media-edit-cards-container mobile-only')}>
                {(details.cast || [])
                  .filter((p: any) => p.name.toLowerCase().includes(castSearch.toLowerCase()) || p.character.toLowerCase().includes(castSearch.toLowerCase()))
                  .map((person: any) => (
                    <div key={`${person.id}-${person.order}`} className="media-edit-card">
                      <div className="media-edit-card-left">
                        <div className="media-edit-card-avatar">
                          {person.poster ? <img src={person.poster} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ opacity: 0.2 }} />}
                        </div>
                        <div className="media-edit-card-details">
                          <span className="media-edit-card-name">{person.name}</span>
                          <span className="media-edit-card-role">{person.character}</span>
                        </div>
                      </div>
                      <div className="media-edit-card-actions">
                        <button 
                          type="button" 
                          className="action-btn" 
                          title={t('admin_editar_pessoa', 'Editar Pessoa')}
                          onClick={() => navigate(`/admin/celebrities/${person.person_id}`)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          type="button" 
                          className="action-btn delete" 
                          title={t('admin_eliminar_credito', 'Eliminar Crédito')}
                          onClick={() => {
                            setModal({
                              open: true,
                              title: t('admin_eliminar_credito', 'Eliminar Crédito'),
                              message: `Tem a certeza que deseja remover "${person.name}" como "${person.character}" deste título?`,
                              onConfirm: async () => {
                                try {
                                  const res = await apiFetch(`${API_BASE}/admin_credits.php?id=${person.credit_id}`, { method: 'DELETE' });
                                  const data = await res.json();
                                  if (data.success) {
                                    showToast('Crédito removido.', 'success');
                                    setDetails((prev: any) => ({ ...prev, cast: prev.cast.filter((c: any) => c.credit_id !== person.credit_id) }));
                                  }
                                } catch { showToast('Erro ao eliminar.', 'error'); }
                                setModal(m => ({ ...m, open: false }));
                              }
                            });
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── EQUIPA TÉCNICA ── */}
          {section === 'crew' && (
            <div>
              <div className="media-edit-section-header">
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                  onClick={() => { setCreditType('crew'); setShowAddCredit(true); }}
                >
                  <Plus size={18} /> {t('admin_adicionar_membro', 'Adicionar membro')}
                </button>
                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    className="form-input" 
                    placeholder={t('admin_procurar_na_equipa', 'Procurar na equipa...')} 
                    style={{ paddingLeft: 38 }}
                    value={crewSearch}
                    onChange={e => setCrewSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className={t('admin_media_edit_table_container_desktop_only', 'media-edit-table-container desktop-only')}>
                <table className="media-edit-table">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_pessoa', 'Pessoa')}</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_funcao_departamento', 'Função / Departamento')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_acoes', 'Ações')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(details.crew || [])
                      .filter((p: any) => p.name.toLowerCase().includes(crewSearch.toLowerCase()) || p.job.toLowerCase().includes(crewSearch.toLowerCase()) || p.department.toLowerCase().includes(crewSearch.toLowerCase()))
                      .map((person: any) => (
                      <tr key={`${person.credit_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                              {person.poster ? <img src={person.poster} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ margin: '11px', opacity: 0.2 }} />}
                            </div>
                            <span style={{ fontWeight: 600 }}>{person.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{person.job}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{person.department}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              className="action-btn" 
                              title={t('admin_editar_pessoa', 'Editar Pessoa')}
                              onClick={() => navigate(`/admin/celebrities/${person.person_id}`)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              type="button" 
                              className="action-btn delete" 
                              title={t('admin_eliminar_credito', 'Eliminar Crédito')}
                              onClick={() => {
                                setModal({
                                  open: true,
                                  title: t('admin_eliminar_credito', 'Eliminar Crédito'),
                                  message: `Tem a certeza que deseja remover "${person.name}" como "${person.job}" deste título?`,
                                  onConfirm: async () => {
                                    try {
                                      const res = await apiFetch(`${API_BASE}/admin_credits.php?id=${person.credit_id}`, { method: 'DELETE' });
                                      const data = await res.json();
                                      if (data.success) {
                                        showToast('Crédito removido.', 'success');
                                        setDetails((prev: any) => ({ ...prev, crew: prev.crew.filter((c: any) => c.credit_id !== person.credit_id) }));
                                      }
                                    } catch { showToast('Erro ao eliminar.', 'error'); }
                                    setModal(m => ({ ...m, open: false }));
                                  }
                                });
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={t('admin_media_edit_cards_container_mobile_only', 'media-edit-cards-container mobile-only')}>
                {(details.crew || [])
                  .filter((p: any) => p.name.toLowerCase().includes(crewSearch.toLowerCase()) || p.job.toLowerCase().includes(crewSearch.toLowerCase()) || p.department.toLowerCase().includes(crewSearch.toLowerCase()))
                  .map((person: any) => (
                    <div key={`${person.credit_id}`} className="media-edit-card">
                      <div className="media-edit-card-left">
                        <div className="media-edit-card-avatar">
                          {person.poster ? <img src={person.poster} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ opacity: 0.2 }} />}
                        </div>
                        <div className="media-edit-card-details">
                          <span className="media-edit-card-name">{person.name}</span>
                          <span className="media-edit-card-job">{person.job}</span>
                          <span className="media-edit-card-dept">{person.department}</span>
                        </div>
                      </div>
                      <div className="media-edit-card-actions">
                        <button 
                          type="button" 
                          className="action-btn" 
                          title={t('admin_editar_pessoa', 'Editar Pessoa')}
                          onClick={() => navigate(`/admin/celebrities/${person.person_id}`)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          type="button" 
                          className="action-btn delete" 
                          title={t('admin_eliminar_credito', 'Eliminar Crédito')}
                          onClick={() => {
                            setModal({
                              open: true,
                              title: t('admin_eliminar_credito', 'Eliminar Crédito'),
                              message: `Tem a certeza que deseja remover "${person.name}" como "${person.job}" deste título?`,
                              onConfirm: async () => {
                                try {
                                  const res = await apiFetch(`${API_BASE}/admin_credits.php?id=${person.credit_id}`, { method: 'DELETE' });
                                  const data = await res.json();
                                  if (data.success) {
                                    showToast('Crédito removido.', 'success');
                                    setDetails((prev: any) => ({ ...prev, crew: prev.crew.filter((c: any) => c.credit_id !== person.credit_id) }));
                                  }
                                } catch { showToast('Erro ao eliminar.', 'error'); }
                                setModal(m => ({ ...m, open: false }));
                              }
                            });
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── CATEGORIAS ── */}
          {section === 'genres' && (
            <div>
              <div className="media-edit-section-header">
                <h3 style={{ margin: 0 }}>Categorias ({details.genres?.length || 0})</h3>
                <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 200 }}>
                  <select 
                    className="form-input" 
                    style={{ width: '100%', padding: '8px 12px' }}
                    onChange={async (e) => {
                      const categoryId = e.target.value;
                      if (!categoryId) return;
                      try {
                        const res = await apiFetch(`${API_BASE}/admin_title_categories.php`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title_id: id, category_id: categoryId })
                        });
                        const data = await res.json();
                        if (data.success) {
                          showToast('Categoria adicionada!', 'success');
                          loadData();
                        }
                      } catch { showToast('Erro ao adicionar.', 'error'); }
                      e.target.value = '';
                    }}
                  >
                    <option value="">{t('admin_adicionar_categoria', '+ Adicionar categoria')}</option>
                    {allGenres
                      .filter(ag => !details.genres?.some((g: any) => g.id === ag.id))
                      .map(ag => <option key={ag.id} value={ag.id}>{ag.display_name}</option>)
                    }
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {details.genres?.map((g: any) => (
                  <span 
                    key={g.id} 
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid var(--glass-border)', 
                      color: 'white', 
                      padding: '8px 12px 8px 16px', 
                      borderRadius: 20, 
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Tag size={14} style={{ opacity: 0.6 }} />
                    {g.display_name || g.name}
                    <button 
                      type="button"
                      onClick={() => {
                        setModal({
                          open: true,
                          title: t('admin_remover_categoria', 'Remover Categoria'),
                          message: `Tem a certeza que deseja remover a categoria "${g.display_name}" deste título?`,
                          onConfirm: async () => {
                            try {
                              const res = await apiFetch(`${API_BASE}/admin_title_categories.php?title_id=${id}&category_id=${g.id}`, { method: 'DELETE' });
                              const data = await res.json();
                              if (data.success) {
                                showToast('Categoria removida.', 'success');
                                loadData();
                              }
                            } catch { showToast('Erro ao remover.', 'error'); }
                            setModal(m => ({ ...m, open: false }));
                          }
                        });
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', padding: 2, borderRadius: '50%' }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── PAÍSES ── */}
          {section === 'countries' && (
            <div>
              <div className="media-edit-section-header">
                <h3 style={{ margin: 0 }}>Países de Produção ({details.countries?.length || 0})</h3>
                <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 200 }}>
                  <select 
                    className="form-input" 
                    style={{ width: '100%', padding: '8px 12px' }}
                    onChange={async (e) => {
                      const countryId = e.target.value;
                      if (!countryId) return;
                      try {
                        const res = await apiFetch(`${API_BASE}/admin_title_countries.php`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title_id: id, country_id: countryId })
                        });
                        const data = await res.json();
                        if (data.success) {
                          showToast('País adicionado!', 'success');
                          loadData();
                        }
                      } catch { showToast('Erro ao adicionar.', 'error'); }
                      e.target.value = '';
                    }}
                  >
                    <option value="">{t('admin_adicionar_pais', '+ Adicionar país')}</option>
                    {allCountries
                      .filter(ac => !details.countries?.some((c: any) => c.id === ac.id))
                      .map(ac => <option key={ac.id} value={ac.id}>{ac.display_name}</option>)
                    }
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {details.countries?.map((c: any) => (
                  <span 
                    key={c.id} 
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid var(--glass-border)', 
                      color: 'white', 
                      padding: '8px 12px 8px 16px', 
                      borderRadius: 20, 
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Globe size={14} style={{ opacity: 0.6 }} />
                    {c.display_name}
                    <button 
                      type="button"
                      onClick={() => {
                        setModal({
                          open: true,
                          title: t('admin_remover_pais', 'Remover País'),
                          message: `Tem a certeza que deseja remover "${c.display_name}" deste título?`,
                          onConfirm: async () => {
                            try {
                              const res = await apiFetch(`${API_BASE}/admin_title_countries.php?title_id=${id}&country_id=${c.id}`, { method: 'DELETE' });
                              const data = await res.json();
                              if (data.success) {
                                showToast('País removido.', 'success');
                                loadData();
                              }
                            } catch { showToast('Erro ao remover.', 'error'); }
                            setModal(m => ({ ...m, open: false }));
                          }
                        });
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', padding: 2, borderRadius: '50%' }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── CRÍTICAS ── */}
          {section === 'reviews' && (
            <div>
              <div className="media-edit-section-header">
                <h3 style={{ margin: 0 }}>Críticas ({details.reviews?.length || 0})</h3>
                <Link to="/admin/reviews" className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px', textAlign: 'center' }}>{t('admin_gerir_todas_as_criticas', 'Gerir todas as críticas')}</Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {details.reviews?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--glass-border)' }}>
                    <Pencil size={40} opacity={0.2} style={{ marginBottom: 12 }} />
                    <p>{t('admin_ainda_nao_foram_adicionadas_criticas_a_e', 'Ainda não foram adicionadas críticas a este título.')}</p>
                  </div>
                ) : details.reviews.map((r: any) => (
                  <div key={r.id} className="glass-panel" style={{ padding: 24, border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                          {r.avatar ? <img src={r.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>{r.username?.[0].toUpperCase()}</div>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{r.username || 'Sistema'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString('pt-PT')}</div>
                        </div>
                      </div>
                      {r.score && (
                        <div style={{ background: 'rgba(229,9,20,0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Star size={14} fill="var(--accent)" /> {Number(r.score).toFixed(1)} / 10
                        </div>
                      )}
                    </div>
                    
                    <div 
                      style={{ 
                        fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', 
                        maxHeight: 120, overflow: 'hidden', position: 'relative'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(r.body) }} />
                      {r.body.length > 300 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: t('admin_linear_gradient_to_top_1a1a1a_transparent', 'linear-gradient(to top, #1a1a1a, transparent)') }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PASSATEMPOS ── */}
          {section === 'contests' && (
            <div>
              <div className="media-edit-section-header" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>"Passatempos"</h3>
                {!isAddingContest ? (
                  <button type="button" className="btn-primary" onClick={() => setIsAddingContest(true)}>
                    {t('admin_novo_passatempo', '+ Novo Passatempo')}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 300 }}>
                    <input 
                      autoFocus
                      placeholder={t('admin_nome_do_passatempo', 'Nome do passatempo...')} 
                      className="form-input" 
                      style={{ padding: '8px 12px', flex: 1, minWidth: 0 }}
                      value={newContestName}
                      onChange={e => setNewContestName(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter') {
                          if (!newContestName) return;
                          await apiFetch('${API_BASE}/admin_contests.php', {
                            method: 'POST', body: JSON.stringify({ title_id: id, name: newContestName, details: '', link: '' })
                          });
                          apiFetch(`${API_BASE}/contests.php?title_id=${id}`, { credentials: 'include' })
                            .then(r => r.json()).then(d => setContests(Array.isArray(d) ? d : []));
                          showToast('Passatempo criado!', 'success');
                          setNewContestName('');
                          setIsAddingContest(false);
                        }
                        if (e.key === 'Escape') setIsAddingContest(false);
                      }}
                    />
                    <button type="button" className="icon-btn" onClick={() => setIsAddingContest(false)}><ArrowLeft size={16} /></button>
                  </div>
                )}
              </div>
              {contests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                  <Ticket size={40} opacity={0.3} style={{ marginBottom: 12 }} />
                  <p>{t('admin_nenhum_passatempo_ativo_para_este_titulo', 'Nenhum passatempo ativo para este título.')}</p>
                </div>
              ) : contests.map(c => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.name}</strong>
                    {c.details && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{c.details}</p>}
                  </div>
                  <button type="button" className="action-btn delete" onClick={() => {
                    setModal({
                      open: true,
                      title: 'Eliminar Passatempo',
                      message: `Tem a certeza que deseja eliminar "${c.name}"?`,
                      onConfirm: async () => {
                        await apiFetch(`${API_BASE}/admin_contests.php?id=${c.id}`, { method: 'DELETE' });
                        setContests(contests.filter((x: any) => x.id !== c.id));
                        showToast('Passatempo eliminado.', 'success');
                        setModal(m => ({ ...m, open: false }));
                      }
                    });
                  }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {/* ── VÍDEOS ── */}
          {section === 'videos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Vídeos ({details.videos?.length || 0})</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {details.videos?.map((v: any) => (
                  <div key={v.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <div style={{ aspectRatio: '16/9', position: 'relative', background: '#000' }}>
                      <img 
                        src={`https://img.youtube.com/vi/${v.src}/mqdefault.jpg`} 
                        alt={v.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(229,9,20,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={20} fill="white" />
                        </div>
                      </div>
                      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({
                              open: true,
                              title: t('admin_eliminar_video', 'Eliminar Vídeo'),
                              message: `Deseja eliminar o vídeo "${v.name}"?`,
                              onConfirm: async () => {
                                try {
                                  const res = await apiFetch(`${API_BASE}/admin_videos.php?id=${v.id}`, { method: 'DELETE' });
                                  const data = await res.json();
                                  if (data.success) {
                                    showToast('Vídeo eliminado.', 'success');
                                    setDetails((prev: any) => ({ ...prev, videos: prev.videos.filter((vid: any) => vid.id !== v.id) }));
                                  }
                                } catch { showToast('Erro ao eliminar.', 'error'); }
                                setModal(m => ({ ...m, open: false }));
                              }
                            });
                          }}
                          style={{ background: 'rgba(229,9,20,0.8)', border: 'none', color: 'white', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'white', textTransform: 'uppercase' }}>
                        {v.category}
                      </div>
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>YouTube ID: {v.src}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── OUTROS ── */}


        </div>
      </div>

      <ConfirmModal 
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />

      {/* Add Credit Modal */}
      {showAddCredit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: 500, borderRadius: 20, border: '1px solid var(--glass-border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{creditType === 'cast' ? t('admin_adicionar_credito_elenco', 'Adicionar Crédito (Elenco)') : t('admin_adicionar_membro_equipa', 'Adicionar Membro (Equipa)')}</h2>
              <button type="button" onClick={() => setShowAddCredit(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <div style={{ padding: 30 }}>
              {!selectedPerson ? (
                <div>
                  <label className="form-label">{t('admin_procurar_pessoa', 'Procurar Pessoa')}</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      autoFocus
                      className="form-input" 
                      placeholder={t('admin_nome_da_celebridade', 'Nome da celebridade...')} 
                      style={{ paddingLeft: 44 }}
                      value={peopleSearchQuery}
                      onChange={e => setPeopleSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto', borderRadius: 10, background: 'rgba(120,120,120,0.05)' }}>
                    {isSearchingPeople && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_a_procurar', 'A procurar...')}</div>}
                    {peopleResults.map(p => (
                      <button 
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPerson(p)}
                        style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>
                          {p.poster ? <img src={p.poster} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={14} style={{ margin: 9, opacity: 0.2 }} />}
                        </div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</span>
                      </button>
                    ))}
                    {!isSearchingPeople && peopleSearchQuery.length >= 2 && peopleResults.length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_nenhum_resultado_encontrado', 'Nenhum resultado encontrado.')}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden' }}>
                      {selectedPerson.poster ? <img src={selectedPerson.poster} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: 14, opacity: 0.2 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{selectedPerson.name}</div>
                      <button type="button" onClick={() => setSelectedPerson(null)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 12, padding: 0, cursor: 'pointer' }}>{t('admin_alterar_pessoa', 'Alterar pessoa')}</button>
                    </div>
                  </div>

                  {creditType === 'cast' ? (
                    <>
                      <div>
                        <label className="form-label">"Personagem"</label>
                        <input className="form-input" placeholder={t('admin_ex_tony_stark', 'Ex: Tony Stark')} value={newCreditData.character} onChange={e => setNewCreditData({...newCreditData, character: e.target.value})} />
                      </div>
                      <div>
                        <label className="form-label">{t('admin_ordem_de_exibicao', 'Ordem de exibição')}</label>
                        <input type="number" className="form-input" value={newCreditData.order} onChange={e => setNewCreditData({...newCreditData, order: parseInt(e.target.value) || 0})} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="form-label">{t('admin_departamento', 'Departamento')}</label>
                        <select className="form-input" value={newCreditData.department} onChange={e => setNewCreditData({...newCreditData, department: e.target.value})}>
                          <option value="">{t('admin_selecionar', '— Selecionar —')}</option>
                          <option value="Directing">{t('admin_directing_realizacao', 'Directing (Realização)')}</option>
                          <option value="Writing">{t('admin_writing_argumento', 'Writing (Argumento)')}</option>
                          <option value="Production">{t('admin_production_producao', 'Production (Produção)')}</option>
                          <option value="Sound">{t('admin_sound_som', 'Sound (Som)')}</option>
                          <option value="Editing">{t('admin_editing_edicao', 'Editing (Edição)')}</option>
                          <option value="Art">{t('admin_art_arte', 'Art (Arte)')}</option>
                          <option value="Camera">{t('admin_camera_camara', 'Camera (Câmara)')}</option>
                          <option value={t('admin_visual_effects', 'Visual Effects')}>{t('admin_visual_effects_efeitos_visuais', 'Visual Effects (Efeitos Visuais)')}</option>
                          <option value={t('admin_costume_make_up', 'Costume & Make-Up')}>{t('admin_costume_make_up_guarda_roupa_maquilhagem', 'Costume & Make-Up (Guarda-Roupa / Maquilhagem)')}</option>
                          <option value="Crew">{t('admin_crew_outros', 'Crew (Outros)')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">{t('admin_funcao_job', 'Função (Job)')}</label>
                        <input className="form-input" placeholder={t('admin_ex_director_producer_editor', 'Ex: Director, Producer, Editor...')} value={newCreditData.job} onChange={e => setNewCreditData({...newCreditData, job: e.target.value})} />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddCredit(false)}>{t('btn_cancel', 'Cancelar')}</button>
                    <button type="button" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAddCredit}>{t('admin_adicionar', 'Adicionar')}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.1); border-radius: 24px; cursor: pointer; transition: .3s; border: 1px solid var(--glass-border); }
        .toggle-slider:before { content: ''; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; }
        input:checked + .toggle-slider { background: var(--accent); border-color: var(--accent); }
        input:checked + .toggle-slider:before { transform: translateX(20px); }

        /* Media Edit Layout */
        .media-edit-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
        }
        .media-edit-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .media-edit-header-title {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
        }
        .media-edit-header-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .media-edit-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .media-edit-layout {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 32px;
          flex: 1;
          align-items: start;
          width: 100%;
          min-width: 0;
        }

        .media-edit-sidebar {
          padding: 0 10px;
          position: sticky;
          top: 20px;
          min-width: 0;
        }

        .media-edit-sidebar-title {
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          padding-left: 14px;
        }

        .media-edit-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .media-edit-sidebar-select-wrapper {
          position: relative;
          width: 100%;
        }
        
        .media-edit-sidebar-select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke={t('admin_rgba282552552550629', 'rgba%28255,255,255,0.6%29')} stroke-width='2t('admin_3e_3cpath_stroke_linecap', '%3E%3Cpath stroke-linecap=')round' stroke-linejoin='round' d="M19 9l-7 7-7-7"/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 16px;
          padding-right: 40px;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }

        .mobile-nav {
          display: none !important;
        }

        .media-edit-sidebar-btn {
          width: 100%;
          padding: 12px 14px;
          text-align: left;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 450;
          transition: all 0.2s ease;
          display: block;
        }
        .media-edit-sidebar-btn:hover {
          color: var(--text-primary);
          background: rgba(120, 120, 120, 0.1);
        }
        .media-edit-sidebar-btn.active {
          color: var(--text-primary);
          font-weight: 600;
          background: rgba(120, 120, 120, 0.15);
        }

        .media-edit-content {
          background: var(--bg-secondary);
          border-radius: 14px;
          padding: 30px;
          border: 1px solid var(--glass-border);
          min-width: 0;
          width: 100%;
        }

        .media-edit-main-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          width: 100%;
          min-width: 0;
        }

        .media-edit-images-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
          gap: 30px;
          width: 100%;
          min-width: 0;
        }

        .media-edit-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 20px;
        }

        .media-edit-table-container {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .media-edit-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
          min-width: 600px;
        }

        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }

        .media-edit-cards-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        
        .media-edit-card {
          background: rgba(120, 120, 120, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: background 0.2s, border-color 0.2s;
        }
        
        .media-edit-card:hover {
          background: rgba(120, 120, 120, 0.08);
          border-color: var(--glass-border);
        }
        
        .media-edit-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }
        
        .media-edit-card-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--bg-primary);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--glass-border);
        }
        
        .media-edit-card-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .media-edit-card-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        
        .media-edit-card-name {
          font-weight: 600;
          font-size: 14.5px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .media-edit-card-role {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-edit-card-job {
          font-size: 13px;
          color: var(--accent);
          font-weight: 600;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-edit-card-dept {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .media-edit-card-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Responsive Queries */
        @media (max-width: 1024px) {
          .media-edit-layout {
            grid-template-columns: minmax(0, 1fr);
            align-content: start;
            gap: 24px;
            width: 100%;
            min-width: 0;
          }
          
          .media-edit-sidebar {
            position: static;
            padding: 0;
            width: 100%;
            min-width: 0;
            overflow: visible;
          }
          
          .media-edit-sidebar-title {
            display: none;
          }

          .desktop-nav {
            display: none !important;
          }

          .mobile-nav {
            display: block !important;
          }
        }

        @media (max-width: 768px) {
          .media-edit-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .media-edit-header-actions {
            width: 100%;
            justify-content: flex-start;
          }
          
          .media-edit-header-actions .btn-primary,
          .media-edit-header-actions .btn-secondary {
            flex: 1 1 auto;
            min-width: fit-content;
            justify-content: center;
            font-size: 13px;
            padding: 10px 14px;
            white-space: nowrap;
          }
          
          .media-edit-content {
            padding: 20px;
          }
          
          .media-edit-main-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 16px;
          }
          
          .media-edit-images-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 20px;
          }
          
          .media-edit-section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          
          .media-edit-section-header button {
            width: 100%;
            justify-content: center;
          }
          
          .media-edit-section-header > div {
            max-width: none !important;
          }
        }
      `}</style>
    </form>
  );
}
