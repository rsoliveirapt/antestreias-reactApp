import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Film, Tv, Star, Eye, TrendingUp, Search, RefreshCw, Calendar, Clock } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { API_BASE, apiFetch } from '../../config';
import ConfirmModal from '../../components/ConfirmModal';
import InputModal from '../../components/InputModal';
import { useTranslation } from '../../context/LanguageContext';

interface Media {
  id: number;
  name: string;
  type: string;
  slug: string;
  poster: string | null;
  release_date: string;
  rating: number | null;
  local_vote_average: number | null;
  page_views: number | null;
  popularity: number | null;
  updated_at: string;
  tmdb_id: number | null;
}

export default function AdminMedia() {
  const { t } = useTranslation();
  const location = useLocation();
  const isSeries = location.pathname.includes('series');
  const type = isSeries ? 'series' : 'movie';
  const titleText = isSeries ? t('nav_series', 'Séries') : t('nav_movies', 'Filmes');
  const Icon = isSeries ? Tv : Film;

  const [media, setMedia] = useState<Media[]>([]);
  const [filtered, setFiltered] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: 0, bulk: false });
  const [importModal, setImportModal] = useState({ open: false });
  const [resultModal, setResultModal] = useState({ open: false, data: null as any });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchMedia = () => {
    setLoading(true);
    apiFetch(`${API_BASE}/admin_media.php?type=${type}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const titles = data.titles || data;
        setMedia(titles);
        setFiltered(titles);
        setLoading(false);
      });
  };

  useEffect(() => { fetchMedia(); }, [type]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(media.filter(m => m.name.toLowerCase().includes(q)));
  }, [search, media]);

  const handleDelete = (id: number) => {
    setDeleteModal({ open: true, id, bulk: false });
  };

  const confirmDelete = () => {
    const id = deleteModal.id;
    apiFetch(`${API_BASE}/admin_media.php?id=${id}`, { method: 'DELETE', credentials: 'include' })
      .then(() => { fetchMedia(); showToast('Eliminado com sucesso.', 'success'); });
    setDeleteModal({ open: false, id: 0, bulk: false });
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setDeleteModal({ open: true, id: 0, bulk: true });
  };

  const confirmBulkDelete = () => {
    Promise.all(selected.map(id =>
      apiFetch(`${API_BASE}/admin_media.php?id=${id}`, { method: 'DELETE', credentials: 'include' })
    )).then(() => { setSelected([]); fetchMedia(); showToast(t('admin_selectedlength_itens_eliminados', '${selected.length} itens eliminados.').replace('${selected.length}', selected.length.toString()), 'success'); });
    setDeleteModal({ open: false, id: 0, bulk: false });
  };

  const handleTmdbSearch = async (q: string) => {
    setImportModal({ open: false });
    setLoading(true);
    try {
      const searchRes = await apiFetch(`${API_BASE}/tmdb_search.php?q=${q}&type=${type}`, { credentials: 'include' });
      const searchData = await searchRes.json();
      if (searchData.error) {
        showToast(searchData.error, 'error');
        setLoading(false);
        return;
      }
      if (searchData.results?.length > 0) {
        setResultModal({ open: true, data: searchData.results[0] });
        setLoading(false);
      } else {
        showToast('Nenhum resultado encontrado no TMDB.', 'error');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de ligação ao servidor.', 'error');
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    const first = resultModal.data;
    const name = isSeries ? first.name : first.title;
    setResultModal({ open: false, data: null });
    setLoading(true);
    try {
      const importRes = await apiFetch(`${API_BASE}/tmdb_import.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_id: first.id, type }),
        credentials: 'include'
      });
      const importData = await importRes.json();
      if (importData.success) {
        fetchMedia();
        showToast(`"${name}" importado com sucesso!`, 'success');
      } else {
        showToast('Erro: ' + importData.error, 'error');
        setLoading(false);
      }
    } catch {
      showToast('Erro ao importar.', 'error');
      setLoading(false);
    }
  };

  const handleRefresh = async (item: Media) => {
    if (!item.tmdb_id) {
      showToast('Este título não tem um ID TMDB associado.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/tmdb_import.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_id: item.tmdb_id, type: item.type }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        fetchMedia();
        showToast(`"${item.name}" atualizado com sucesso!`, 'success');
      } else {
        showToast('Erro: ' + data.error, 'error');
        setLoading(false);
      }
    } catch {
      showToast('Erro ao atualizar.', 'error');
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map(m => m.id));
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-PT') : '—';

  return (
    <div>
      {/* Header */}
      <div className="media-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <Icon color="var(--accent)" /> {titleText}
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>({filtered.length})</span>
        </h1>
        <div className="media-header-actions">
          {selected.length > 0 && (
            <button className="btn-secondary" onClick={handleBulkDelete}>
              <Trash2 size={16} /> {t('btn_delete', 'Eliminar')} {selected.length}
            </button>
          )}
          <button className="btn-secondary" onClick={() => setImportModal({ open: true })}>
            {t('admin_importar_do_tmdb', 'Importar do TMDB')}
          </button>
          <Link to={`/admin/${isSeries ? 'series' : 'movies'}/new`} className="btn-primary">
            <Plus size={18} /> {isSeries ? t('admin_adicionar_nova_serie', 'Nova Série') : t('admin_adicionar_novo_filme', 'Novo Filme')}
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="media-search-container">
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isSeries ? t('admin_filtrar_series', 'Filtrar séries...') : t('admin_filtrar_filmes', 'Filtrar filmes...')}
          style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_a_carregar', 'A carregar...')}</div>
      ) : (
        <>
          {/* Mobile Select All */}
          {isMobile && filtered.length > 0 && (
            <div className="mobile-select-all" style={{ alignItems: 'center', gap: 10, padding: '0 4px 12px 4px' }}>
              <input
                id="select-all-mobile"
                type="checkbox"
                checked={selected.length === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                style={{ accentColor: 'var(--accent)' }}
              />
              <label htmlFor="select-all-mobile" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                {t('admin_selecionar_todos', 'Selecionar Todos')} ({selected.length} {t('admin_de_count', 'de')} {filtered.length})
              </label>
            </div>
          )}

          {isMobile ? (
            /* Mobile Cards View */
            <div className="admin-cards-wrapper">
              {filtered.map(item => (
                <div 
                  key={item.id} 
                  className="media-card" 
                  style={{ 
                    background: selected.includes(item.id) ? 'rgba(229,9,20,0.05)' : 'var(--bg-secondary)',
                    border: selected.includes(item.id) ? '1px solid rgba(229,9,20,0.3)' : '1px solid var(--glass-border)',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: t('admin_all_0_2s_ease', 'all 0.2s ease')
                  }}
                >
                  {/* Top row: Checkbox, Poster, Title & ID & Ratings, Actions */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 65, flexShrink: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={selected.includes(item.id)} 
                        onChange={() => toggleSelect(item.id)} 
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} 
                      />
                    </div>
                    
                    {/* Mini Poster */}
                    <div style={{ width: 45, height: 65, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                      {item.poster
                        ? <img src={item.poster} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} opacity={0.3} /></div>
                      }
                    </div>

                    {/* Name, ID & Ratings Badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.2, wordBreak: 'break-word' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {item.type === 'series' ? t('admin_serie', 'Série') : t('admin_filme', 'Filme')} · ID #{item.id}
                      </div>
                      
                      {/* Ratings Badges inline under Title info */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {item.rating != null && item.rating > 0 ? (
                          <span title={t('admin_tmdb', 'TMDB')} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(255,200,0,0.1)', color: t('admin_ffc800', '#ffc800'), padding: '2px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            <Star size={9} fill={t('admin_ffc800', '#ffc800')} /> {Number(item.rating).toFixed(1)} <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 9 }}>{t('admin_tmdb', 'TMDB')}</span>
                          </span>
                        ) : null}
                        {item.local_vote_average != null && item.local_vote_average > 0 ? (
                          <span title="Antestreias" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(229,9,20,0.1)', color: 'var(--accent)', padding: '2px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            <Star size={9} fill="var(--accent)" /> {Number(item.local_vote_average).toFixed(1)} <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 9 }}>{t('admin_local', 'Local')}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {item.tmdb_id && (
                        <button className="action-btn" onClick={() => handleRefresh(item)} title={t('admin_atualizar_do_tmdb', 'Atualizar do TMDB')}>
                          <RefreshCw size={15} />
                        </button>
                      )}
                      <Link to={`/admin/${isSeries ? 'series' : 'movies'}/${item.id}`} className="action-btn" title="Editar"><Edit size={15} /></Link>
                      <button className="action-btn delete" onClick={() => handleDelete(item.id)} title="Apagar"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  {/* Grid of stats - Uses custom class to bypass global 1024px grid-to-vertical CSS reset */}
                  <div className="media-card-stats-grid">
                    <div className="media-card-stat">
                      <span className="stat-label">
                        <Calendar size={11} style={{ opacity: 0.6 }} /> {t('admin_lancamento', 'Lançamento')}
                      </span>
                      <span className="stat-value">{formatDate(item.release_date)}</span>
                    </div>
                    <div className="media-card-stat">
                      <span className="stat-label">
                        <Clock size={11} style={{ opacity: 0.6 }} /> {t('admin_atualizacao', 'Atualização')}
                      </span>
                      <span className="stat-value">{formatDate(item.updated_at)}</span>
                    </div>
                    <div className="media-card-stat">
                      <span className="stat-label">
                        <Eye size={11} style={{ opacity: 0.6 }} /> {t('admin_visualizacoes', 'Visualizações')}
                      </span>
                      <span className="stat-value">{item.page_views != null ? item.page_views.toLocaleString('pt-PT') : '—'}</span>
                    </div>
                    <div className="media-card-stat">
                      <span className="stat-label">
                        <TrendingUp size={11} style={{ opacity: 0.6 }} /> {t('admin_popularidade', 'Popularidade')}
                      </span>
                      <span className="stat-value">{item.popularity != null ? Math.round(item.popularity) : '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
                  {t('admin_nenhum_resultado_encontrado', 'Nenhum resultado encontrado.')}
                </div>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--accent)' }} />
                    </th>
                    <th>{t('admin_titulo', 'Título')}</th>
                    <th style={{ width: 120 }}>{t('admin_lancamento', 'Lançamento')}</th>
                    <th style={{ width: 140 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={13} /> {t('admin_classificacao', 'Classificação')}</span>
                    </th>
                    <th style={{ width: 110 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} /> {t('admin_visualizacoes', 'Visualizações')}</span>
                    </th>
                    <th style={{ width: 100 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={13} /> {t('admin_popularidade', 'Popularidade')}</span>
                    </th>
                    <th style={{ width: 120 }}>{t('admin_atualizacao', 'Atualização')}</th>
                    <th style={{ width: 80 }}>{t('admin_acoes', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} style={{ background: selected.includes(item.id) ? 'rgba(229,9,20,0.05)' : undefined }}>
                      <td>
                        <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} style={{ accentColor: 'var(--accent)' }} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Mini Poster */}
                          <div style={{ width: 36, height: 52, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                            {item.poster
                              ? <img src={item.poster} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} opacity={0.3} /></div>
                            }
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {item.type === 'series' ? t('admin_serie', 'Série') : t('admin_filme', 'Filme')} · ID #{item.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(item.release_date)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {item.rating != null && item.rating > 0 ? (
                            <span title={t('admin_tmdb', 'TMDB')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,200,0,0.1)', color: t('admin_ffc800', '#ffc800'), padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              <Star size={9} fill={t('admin_ffc800', '#ffc800')} /> {Number(item.rating).toFixed(1)}
                            </span>
                          ) : null}
                          {item.local_vote_average != null && item.local_vote_average > 0 ? (
                            <span title="Antestreias" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(229,9,20,0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              <Star size={9} fill="var(--accent)" /> {Number(item.local_vote_average).toFixed(1)}
                            </span>
                          ) : null}
                          {(!item.rating || item.rating <= 0) && (!item.local_vote_average || item.local_vote_average <= 0) && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {item.page_views != null ? item.page_views.toLocaleString('pt-PT') : '—'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {item.popularity != null ? Math.round(item.popularity) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(item.updated_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {item.tmdb_id && (
                            <button className="action-btn" onClick={() => handleRefresh(item)} title={t('admin_atualizar_do_tmdb', 'Atualizar do TMDB')} style={{ display: 'inline-flex' }}>
                              <RefreshCw size={16} />
                            </button>
                          )}
                          <Link to={`/admin/${isSeries ? 'series' : 'movies'}/${item.id}`} className="action-btn" title="Editar" style={{ display: 'inline-flex' }}><Edit size={16} /></Link>
                          <button className="action-btn delete" onClick={() => handleDelete(item.id)} title="Apagar"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                        {t('admin_nenhum_resultado_encontrado', 'Nenhum resultado encontrado.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <style>{`
            .media-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 24px;
              gap: 16px;
            }
            .media-header-actions {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
            }
            .media-search-container {
              position: relative;
              margin-bottom: 20px;
              width: 100%;
              max-width: 380px;
            }
            .admin-cards-wrapper {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .mobile-select-all {
              display: flex;
            }

            /* Custom class to force a 2-column side-by-side layout in mobile views, bypassing global grid overrides */
            .media-card-stats-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px;
              border-top: 1px solid var(--glass-border);
              padding-top: 12px;
              margin-top: 4px;
            }
            .media-card-stat {
              display: flex;
              flex-direction: column;
              gap: 3px;
              background: var(--bg-primary);
              padding: 8px 10px;
              border-radius: 8px;
              border: 1px solid var(--glass-border);
            }
            .stat-label {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 9px;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stat-value {
              font-size: 12px;
              color: var(--text-primary);
              font-weight: 600;
            }

            @media (max-width: 1024px) {
              .media-header {
                flex-direction: column;
                align-items: stretch;
                gap: 16px;
              }
              .media-header-actions {
                width: 100%;
                justify-content: flex-start;
              }
              .media-header-actions > * {
                flex: 1;
                justify-content: center;
                white-space: nowrap;
              }
              .media-search-container {
                max-width: 100%;
              }
            }
          `}</style>
        </>
      )}
      {/* Modals */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title={deleteModal.bulk ? t('admin_eliminar_em_massa', 'Eliminar em massa') : `${t('btn_delete', 'Eliminar')} ${isSeries ? t('admin_serie', 'Série') : t('admin_filme', 'Filme')}`}
        message={deleteModal.bulk ? t('admin_deseja_eliminar_selected_length_itens_selecionados', 'Deseja eliminar ${selected.length} itens selecionados?').replace('${selected.length}', selected.length.toString()) : (isSeries ? t('admin_confirm_delete_series', 'Tem a certeza que deseja eliminar esta série?') : t('admin_confirm_delete_movie', 'Tem a certeza que deseja eliminar este filme?'))}
        onConfirm={deleteModal.bulk ? confirmBulkDelete : confirmDelete}
        onCancel={() => setDeleteModal({ open: false, id: 0, bulk: false })}
      />

      <InputModal
        isOpen={importModal.open}
        title={t('admin_pesquisar_titletext_no_tmdb', 'Pesquisar ${titleText} no TMDB').replace('${titleText}', titleText)}
        placeholder={t('admin_nome_ou_id_do_titulo', 'Nome ou ID do título...')}
        onConfirm={handleTmdbSearch}
        onCancel={() => setImportModal({ open: false })}
      />

      {resultModal.open && (
        <ConfirmModal
          isOpen={true}
          variant="info"
          title={t('admin_titulo_encontrado', 'Título Encontrado')}
          message={t('admin_media_import_confirm', 'Encontrado: "{name}" ({date}). Deseja importar este título?')
            .replace('{name}', isSeries ? resultModal.data.name : resultModal.data.title)
            .replace('{date}', resultModal.data.release_date || resultModal.data.first_air_date)}
          confirmLabel={t('admin_importar_agora', 'Importar Agora')}
          onConfirm={confirmImport}
          onCancel={() => setResultModal({ open: false, data: null })}
        />
      )}
    </div>
  );
}
