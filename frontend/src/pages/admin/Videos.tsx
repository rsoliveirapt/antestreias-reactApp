import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Plus, Pencil, BarChart3,
  Trash2, Play, X, Eye, Flag, CheckCircle, XCircle, Film, Calendar
} from 'lucide-react';
import { API_BASE, apiFetch , PLACEHOLDER_IMG } from '../../config';
import { showToast } from '../../components/Toast';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useTranslation } from '../../context/LanguageContext';

interface Video {
  id: number;
  name: string;
  src: string;
  type: string;
  thumbnail: string;
  category: string;
  approved: number;
  views: number;
  reports: number;
  created_at: string;
  updated_at: string;
  title_name: string;
  title_id?: number;
  title_type?: string;
  title_poster?: string;
  title_backdrop?: string;
}

export default function AdminVideos() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statsVideo, setStatsVideo] = useState<Video | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'approved' | 'pending'
  const [filterCategory, setFilterCategory] = useState('');

  // Add video modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title_id: null as number | null, title_name: '', name: '', src: '', category: 'trailer', type: 'embed' });
  const [titleSearch, setTitleSearch] = useState('');
  const [titleResults, setTitleResults] = useState<{ id: number; name: string; type: string }[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [search]);

  const fetchVideos = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_videos.php?search=${search}`);
      const data = await res.json();
      setVideos(data);
      setLoading(false);
    } catch (err) {
      showToast('Erro ao carregar vídeos.', 'error');
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_videos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggle_status: id })
      });
      const data = await res.json();
      if (data.success) {
        setVideos(videos.map(v => v.id === id ? { ...v, approved: v.approved === 1 ? 0 : 1 } : v));
        showToast(t('admin_estado_do_video_atualizado', 'Estado do vídeo atualizado!'));
      }
    } catch (err) {
      showToast('Erro ao atualizar estado.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('admin_tem_a_certeza_que_deseja_remover_este_vi', 'Tem a certeza que deseja remover este vídeo?'))) return;
    try {
      const res = await apiFetch(`${API_BASE}/admin_videos.php?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setVideos(videos.filter(v => v.id !== id));
        showToast(t('admin_video_removido', 'Vídeo removido!'));
      }
    } catch (err) {
      showToast('Erro ao remover vídeo.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(t('admin_tem_a_certeza_que_deseja_remover_selecte', 'Tem a certeza que deseja remover ${selectedIds.length} vídeos?'))) return;
    try {
      const res = await apiFetch(`${API_BASE}/admin_videos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk_delete: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        setVideos(videos.filter(v => !selectedIds.includes(v.id)));
        setSelectedIds([]);
        showToast(t('admin_videos_removidos_com_sucesso', 'Vídeos removidos com sucesso!'));
      }
    } catch (err) {
      showToast('Erro ao remover vídeos.', 'error');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === videos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(videos.map(v => v.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getYoutubeId = (src: string) => {
    if (!src) return null;
    if (src.length === 11 && !src.includes('/') && !src.includes('.')) {
      return src;
    }
    const match = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
    return match ? match[1] : null;
  };

  const getVideoLink = (src: string) => {
    if (!src) return '#';
    const ytId = getYoutubeId(src);
    if (ytId) {
      return `https://www.youtube.com/watch?v=${ytId}`;
    }
    return src.startsWith('http') ? src : `https://${src}`;
  };

  const getThumbnail = (video: Video) => {
    if (video.thumbnail) return video.thumbnail;

    const ytId = getYoutubeId(video.src);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    }

    if (video.title_backdrop) {
      return video.title_backdrop.startsWith('http') ? video.title_backdrop : `https://image.tmdb.org/t/p/w300${video.title_backdrop}`;
    }
    if (video.title_poster) {
      return video.title_poster.startsWith('http') ? video.title_poster : `https://image.tmdb.org/t/p/w185${video.title_poster}`;
    }

    return PLACEHOLDER_IMG;
  };

  // Derived: categories present in loaded videos
  const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));

  // Filtered list (client-side)
  const filteredVideos = videos.filter(v => {
    if (filterStatus === 'approved' && v.approved !== 1) return false;
    if (filterStatus === 'pending' && v.approved === 1) return false;
    if (filterCategory && v.category?.toLowerCase() !== filterCategory) return false;
    return true;
  });

  // Title search for add-video modal
  const searchTitles = async (q: string) => {
    setTitleSearch(q);
    if (!q.trim()) { setTitleResults([]); return; }
    try {
      const res = await apiFetch(`${API_BASE}/admin_videos.php?mode=search_titles&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setTitleResults(Array.isArray(data) ? data : []);
    } catch { setTitleResults([]); }
  };

  const handleCreateVideo = async () => {
    if (!addForm.title_id || !addForm.name.trim() || !addForm.src.trim()) {
      showToast('Preenche todos os campos obrigatórios.', 'error');
      return;
    }
    setAddLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_videos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...addForm }),
      });
      const data = await res.json();
      if (data.success && data.video) {
        setVideos(prev => [data.video, ...prev]);
        setShowAddModal(false);
        setAddForm({ title_id: null, title_name: '', name: '', src: '', category: 'trailer', type: 'embed' });
        setTitleSearch('');
        setTitleResults([]);
        showToast(t('admin_video_adicionado_com_sucesso', 'Vídeo adicionado com sucesso!'));
      } else {
        showToast(data.error || t('admin_erro_ao_criar_video', 'Erro ao criar vídeo.'), 'error');
      }
    } catch {
      showToast(t('admin_erro_ao_criar_video', 'Erro ao criar vídeo.'), 'error');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader 
        title={t('admin_videos', 'Vídeos')}
        subtitle={t('admin_gerir_catalogo_de_videos_e_trailers_asso', 'Gerir catálogo de vídeos e trailers associados a filmes e séries.')}
        actions={
          <>
            <button className={`btn-secondary${showFilter ? ' active' : ''}`} onClick={() => setShowFilter(f => !f)} style={showFilter ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}>
              <Filter size={18} color={showFilter ? 'var(--accent)' : undefined} /> {t('admin_filtrar', 'Filtrar')}
            </button>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> {t('admin_adicionar_video', 'Adicionar vídeo')}
            </button>
          </>
        }
      />

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Search & Filter Bar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-box" style={{ width: 350, background: 'rgba(255,255,255,0.03)' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder={t('admin_escreve_para_pesquisar', 'Escreve para pesquisar...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{selectedIds.length} selecionados</span>
              <button onClick={handleBulkDelete} className="action-btn-circle delete" title={t('admin_remover_selecionados', 'Remover selecionados')}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_estado', 'Estado')}</span>
              {(['', 'approved', 'pending'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                    background: filterStatus === s ? (s === 'pending' ? 'rgba(239,68,68,0.15)' : s === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.1)') : 'transparent',
                    borderColor: filterStatus === s ? (s === 'pending' ? t('admin_ef4444', '#ef4444') : s === 'approved' ? t('admin_10b981', '#10b981') : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.1)',
                    color: filterStatus === s ? (s === 'pending' ? t('admin_ef4444', '#ef4444') : s === 'approved' ? t('admin_10b981', '#10b981') : 'white') : 'var(--text-secondary)',
                  }}>
                  {s === '' ? 'Todos' : s === 'approved' ? 'Aprovados' : 'Pendentes'}
                </button>
              ))}
            </div>
            {categories.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_categoria', 'Categoria')}</span>
                <button onClick={() => setFilterCategory('')}
                  style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: `1px solid ${filterCategory === '' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`, background: filterCategory === '' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterCategory === '' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Todas
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                    style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: `1px solid ${filterCategory === cat ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, background: filterCategory === cat ? 'rgba(229,9,20,0.12)' : 'transparent', color: filterCategory === cat ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner"></div></div>
        ) : filteredVideos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>{t('admin_nenhum_video_encontrado', 'Nenhum vídeo encontrado.')}</div>
        ) : isMobile ? (
          <>
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
              <input
                type="checkbox"
                checked={selectedIds.length === filteredVideos.length && filteredVideos.length > 0}
                onChange={toggleSelectAll}
                className="custom-checkbox"
                id="selectAllMobile"
              />
              <label htmlFor="selectAllMobile" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Selecionar Todos ({filteredVideos.length})
              </label>
            </div>
            <div className="video-cards-container">
              {filteredVideos.map(video => (
                <div key={video.id} className={`video-card ${selectedIds.includes(video.id) ? 'selected' : ''}`}>
                  <div className="video-card-thumbnail-wrapper">
                    <a href={getVideoLink(video.src)} target="_blank" rel="noreferrer" className="video-card-thumbnail-link">
                      <img src={getThumbnail(video)} alt="" className="video-card-thumbnail" />
                      <div className="video-card-play-overlay">
                        <Play size={20} color="white" fill="white" />
                      </div>
                    </a>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(video.id)}
                      onChange={() => toggleSelect(video.id)}
                      className={t('admin_custom_checkbox_video_card_checkbox', 'custom-checkbox video-card-checkbox')}
                    />
                    <span className="video-card-category-badge">
                      {video.category}
                    </span>
                  </div>

                  <div className="video-card-content">
                    <div className="video-card-title">{video.title_name || t('admin_titulo_desconhecido', 'Título Desconhecido')}</div>
                    <div className="video-card-name" title={video.name}>{video.name}</div>
                    
                    <div className="video-card-meta">
                      <div className="video-card-meta-item">
                        <span className="meta-label">{t('admin_tipo', 'Tipo')}</span>
                        <span className={t('admin_meta_value_text_lowercase', 'meta-value text-lowercase')}>{video.type || 'embed'}</span>
                      </div>
                      <div className="video-card-meta-item">
                        <span className="meta-label">{t('admin_estado', 'Estado')}</span>
                        <div
                          onClick={() => toggleStatus(video.id)}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: video.approved === 1 ? t('admin_10b981', '#10b981') : t('admin_ef4444', '#ef4444'),
                            boxShadow: `0 0 10px ${video.approved === 1 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                            cursor: 'pointer'
                          }}
                          title={video.approved === 1 ? t('admin_aprovado', 'Aprovado') : t('admin_pendente', 'Pendente')}
                        ></div>
                      </div>
                      <div className="video-card-meta-item">
                        <span className="meta-label">{t('admin_reproducoes', 'Reproduções')}</span>
                        <span className="meta-value">{video.views}</span>
                      </div>
                      <div className="video-card-meta-item">
                        <span className="meta-label">{t('admin_denuncias', 'Denúncias')}</span>
                        <span className={`meta-value ${video.reports > 0 ? 'text-danger' : ''}`}>{video.reports}</span>
                      </div>
                    </div>
                  </div>

                  <div className="video-card-actions">
                    <button className="action-btn-circle" title={t('admin_estatisticas', 'Estatísticas')} onClick={() => setStatsVideo(video)}>
                      <BarChart3 size={16} />
                    </button>
                    <Link
                      to={`/admin/${video.title_type === 'series' ? 'series' : 'movies'}/${video.title_id}?tab=videos`}
                      className="action-btn-circle"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button onClick={() => handleDelete(video.id)} className="action-btn-circle delete" title="Remover">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="admin-table-wrapper" style={{ border: 'none', background: 'transparent' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === videos.length && videos.length > 0}
                      onChange={toggleSelectAll}
                      className="custom-checkbox"
                    />
                  </th>
                  <th>{t('admin_video', 'Vídeo')}</th>
                  <th>{t('admin_tipo', 'Tipo')}</th>
                  <th>{t('admin_categoria', 'Categoria')}</th>
                  <th>{t('admin_aprovado', 'Aprovado')}</th>
                  <th>{t('admin_reproducoes', 'Reproduções')}</th>
                  <th>{t('admin_denuncias', 'Denúncias')}</th>
                  <th>{t('admin_ultima_atualizacao', 'Última atualização')}</th>
                  <th style={{ textAlign: 'right' }}>{t('admin_acoes', 'Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map(video => (
                  <tr key={video.id} className={selectedIds.includes(video.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(video.id)}
                        onChange={() => toggleSelect(video.id)}
                        className="custom-checkbox"
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <a href={getVideoLink(video.src)} target="_blank" rel="noreferrer" style={{
                          width: 48,
                          height: 32,
                          borderRadius: 4,
                          overflow: 'hidden',
                          background: 'var(--bg-primary)',
                          flexShrink: 0,
                          position: 'relative',
                          border: '1px solid var(--glass-border)',
                          display: 'block'
                        }}>
                          <img src={getThumbnail(video)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                            <Play size={10} color="white" fill="white" />
                          </div>
                        </a>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{video.title_name || t('admin_titulo_desconhecido', 'Título Desconhecido')}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {video.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, textTransform: 'lowercase' }}>{video.type || 'embed'}</td>
                    <td>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-secondary)'
                      }}>
                        {video.category}
                      </span>
                    </td>
                    <td>
                      <div
                        onClick={() => toggleStatus(video.id)}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: video.approved === 1 ? t('admin_10b981', '#10b981') : t('admin_ef4444', '#ef4444'),
                          boxShadow: `0 0 10px ${video.approved === 1 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                          cursor: 'pointer'
                        }}
                        title={video.approved === 1 ? t('admin_aprovado', 'Aprovado') : t('admin_pendente', 'Pendente')}
                      ></div>
                    </td>
                    <td style={{ fontSize: 13 }}>{video.views}</td>
                    <td style={{ fontSize: 13 }}>{video.reports}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Date(video.updated_at || video.created_at).toLocaleDateString()}
                    </td>
                    <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button className="action-btn-circle" title={t('admin_estatisticas', 'Estatísticas')} onClick={() => setStatsVideo(video)}>
                          <BarChart3 size={14} />
                        </button>
                        <Link to={`/admin/${video.title_type === 'series' ? 'series' : 'movies'}/${video.title_id}?tab=videos`} className="action-btn-circle" title="Editar">
                          <Pencil size={14} />
                        </Link>
                        <button onClick={() => handleDelete(video.id)} className="action-btn-circle delete" title="Remover">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── STATS MODAL ── */}
      {statsVideo && (
        <div
          onClick={() => setStatsVideo(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 460, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={18} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{t('admin_estatisticas_do_video', 'Estatísticas do Vídeo')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{statsVideo.title_name}</div>
                </div>
              </div>
              <button onClick={() => setStatsVideo(null)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Thumbnail + name */}
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ width: 80, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>
                <img src={getThumbnail(statsVideo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{statsVideo.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 10, background: 'rgba(120, 120, 120, 0.1)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 4 }}>{statsVideo.category}</span>
                  <span style={{ textTransform: 'lowercase', fontSize: 11 }}>{statsVideo.type || 'embed'}</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Views */}
              <div style={{ background: 'rgba(120, 120, 120, 0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Eye size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_reproducoes', 'Reproduções')}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{statsVideo.views ?? 0}</div>
              </div>

              {/* Reports */}
              <div style={{ background: (statsVideo.reports ?? 0) > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(120, 120, 120, 0.05)', border: `1px solid ${(statsVideo.reports ?? 0) > 0 ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}`, borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Flag size={14} color={(statsVideo.reports ?? 0) > 0 ? t('admin_ef4444', '#ef4444') : 'var(--text-secondary)'} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: (statsVideo.reports ?? 0) > 0 ? t('admin_ef4444', '#ef4444') : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_denuncias', 'Denúncias')}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: (statsVideo.reports ?? 0) > 0 ? t('admin_ef4444', '#ef4444') : 'var(--text-primary)', lineHeight: 1 }}>{statsVideo.reports ?? 0}</div>
              </div>

              {/* Status */}
              <div style={{ background: 'rgba(120, 120, 120, 0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Film size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_estado', 'Estado')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {statsVideo.approved === 1
                    ? <><CheckCircle size={18} color={t('admin_10b981', '#10b981')} /><span style={{ fontWeight: 700, color: t('admin_10b981', '#10b981'), fontSize: 14 }}>{t('admin_aprovado', 'Aprovado')}</span></>
                    : <><XCircle size={18} color={t('admin_ef4444', '#ef4444')} /><span style={{ fontWeight: 700, color: t('admin_ef4444', '#ef4444'), fontSize: 14 }}>{t('admin_pendente', 'Pendente')}</span></>}
                </div>
              </div>

              {/* Date */}
              <div style={{ background: 'rgba(120, 120, 120, 0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Calendar size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_adicionado', 'Adicionado')}</span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                  {new Date(statsVideo.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Footer action */}
            <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                to={`/admin/${statsVideo.title_type === 'series' ? 'series' : 'movies'}/${statsVideo.title_id}?tab=videos`}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={() => setStatsVideo(null)}
              >
                <Pencil size={14} /> {t('admin_editar_video', 'Editar vídeo')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD VIDEO MODAL ── */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color="var(--accent)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{t('admin_adicionar_video', 'Adicionar Vídeo')}</div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Title search */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('admin_filme_serie', 'Filme / Série *')}</label>
                {addForm.title_id ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.25)', borderRadius: 10, padding: '10px 14px' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{addForm.title_name}</span>
                    <button onClick={() => setAddForm(f => ({ ...f, title_id: null, title_name: '' }))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div className="search-box" style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>
                      <Search size={16} color="var(--text-secondary)" />
                      <input type="text" placeholder={t('admin_pesquisar_filme_ou_serie', 'Pesquisar filme ou série...')} value={titleSearch} onChange={e => searchTitles(e.target.value)} style={{ width: '100%' }} autoFocus />
                    </div>
                    {titleResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 10, marginTop: 4, overflow: 'hidden', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                        {titleResults.map(res => (
                          <button key={res.id} onClick={() => { setAddForm(f => ({ ...f, title_id: res.id, title_name: res.name })); setTitleSearch(''); setTitleResults([]); }}
                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontSize: 14, transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(120, 120, 120, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(120, 120, 120, 0.1)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', color: 'var(--text-secondary)', flexShrink: 0 }}>{res.type}</span>
                            {res.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Video name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('admin_nome_do_video', 'Nome do Vídeo *')}</label>
                <input className="form-input" placeholder={t('admin_ex_official_trailer', 'Ex: Official Trailer')} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%' }} />
              </div>

              {/* Video URL */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('admin_url_do_youtube', 'URL do YouTube *')}</label>
                <input className="form-input" placeholder="https://youtube.com/watch?v=..." value={addForm.src} onChange={e => setAddForm(f => ({ ...f, src: e.target.value }))} style={{ width: '100%' }} />
              </div>

              {/* Category + Type row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('admin_categoria', 'Categoria')}</label>
                  <select className="form-input" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', height: 46 }}>
                    {['trailer', 'teaser', 'clip', 'featurette', 'behind-the-scenes', 'bloopers'].map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('admin_tipo', 'Tipo')}</label>
                  <select className="form-input" value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', height: 46 }}>
                    <option value="embed">{t('admin_embed', 'Embed')}</option>
                    <option value="youtube">{t('admin_youtube', 'YouTube')}</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>{t('btn_cancel', 'Cancelar')}</button>
                <button className="btn-primary" onClick={handleCreateVideo} disabled={addLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {addLoading ? t('admin_a_guardar', 'A guardar...') : <><Plus size={16} /> {t('admin_adicionar', 'Adicionar')}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .video-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          padding: 20px;
        }

        @media (max-width: 640px) {
          .video-cards-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            padding: 10px;
          }
        }

        @media (max-width: 359px) {
          .video-cards-container {
            grid-template-columns: 1fr;
          }
        }

        .video-card-thumbnail-link {
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
        }

        .video-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .video-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
        }

        .video-card.selected {
          border-color: var(--accent);
          background: rgba(229, 9, 21, 0.03);
        }

        .video-card-thumbnail-wrapper {
          position: relative;
          aspect-ratio: 16/9;
          width: 100%;
          background: #000;
          overflow: hidden;
          border-bottom: 1px solid var(--glass-border);
        }

        .video-card-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .video-card:hover .video-card-thumbnail {
          transform: scale(1.05);
        }

        .video-card-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          transition: background 0.3s;
        }

        .video-card:hover .video-card-play-overlay {
          background: rgba(0, 0, 0, 0.2);
        }

        .video-card-checkbox {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 5;
          transform: scale(1.1);
          cursor: pointer;
        }

        .video-card-category-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .video-card-content {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .video-card-title {
          font-size: 16px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .video-card-name {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 36px;
        }

        .video-card-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          padding: 10px;
        }

        .video-card-meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .video-card-meta-item .meta-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .video-card-meta-item .meta-value {
          color: white;
          font-weight: 600;
        }

        .video-card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 12px 16px;
          border-top: 1px solid var(--glass-border);
        }

        @media (max-width: 640px) {
          .video-card {
            border-radius: 12px;
          }
          .video-card-content {
            padding: 10px;
            gap: 8px;
          }
          .video-card-title {
            font-size: 13px;
          }
          .video-card-name {
            font-size: 11px;
            height: auto;
            line-clamp: 1;
            -webkit-line-clamp: 1;
            margin-bottom: 2px;
          }
          .video-card-meta {
            grid-template-columns: 1fr;
            gap: 4px;
            padding: 6px;
            border-radius: 8px;
          }
          .video-card-meta-item {
            font-size: 10px;
          }
          .video-card-actions {
            padding: 8px 10px;
            gap: 8px;
          }
          .video-card-actions .action-btn-circle {
            width: 28px;
            height: 28px;
          }
          .video-card-actions .action-btn-circle svg {
            width: 13px;
            height: 13px;
          }
          .video-card-category-badge {
            top: 8px;
            right: 8px;
            padding: 2px 6px;
            font-size: 9px;
          }
          .video-card-checkbox {
            top: 8px;
            left: 8px;
            transform: scale(0.9);
          }
        }
      `}} />
    </div>
  );
}
