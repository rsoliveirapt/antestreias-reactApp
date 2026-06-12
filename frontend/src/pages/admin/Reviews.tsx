import { useState, useEffect } from 'react';
import {
  Search, Trash2, Star, Edit2, Eye,
  Plus, X, Image as ImageIcon, ChevronLeft, ChevronRight, Calendar, User
} from 'lucide-react';
import { API_BASE, apiFetch, PLACEHOLDER_IMG } from '../../config';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import AdminPageHeader from '../../components/AdminPageHeader';
import { sanitizeHTML } from '../../utils/sanitize';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminReviews() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const [editingReview, setEditingReview] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newReview, setNewReview] = useState({ title_id: '', body: '', body_en: '', score: 8.0 });
  const [titleSearch, setTitleSearch] = useState('');
  const [titleResults, setTitleResults] = useState<any[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [langTab, setLangTab] = useState<'pt' | 'en'>('pt');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ── Data fetching ───────────────────────────── */
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_reviews.php?search=${search}`, { credentials: 'include' });
      setReviews(await res.json());
    } catch {
      showToast('Erro ao carregar críticas', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (titleSearch.length < 2) { setTitleResults([]); return; }
    const t = setTimeout(() => {
      apiFetch(`${API_BASE}/admin_media.php?search=${titleSearch}`, { credentials: 'include' })
        .then(r => r.json()).then(d => setTitleResults(d.titles || []));
    }, 500);
    return () => clearTimeout(t);
  }, [titleSearch]);

  useEffect(() => {
    const t = setTimeout(fetchReviews, 300);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Handlers ────────────────────────────────── */
  const handleDelete = (id: number) => {
    setModal({
      open: true,
      title: t('admin_eliminar_critica', 'Eliminar Crítica'),
      message: t('admin_tem_a_certeza_que_deseja_eliminar_esta_critica_est', 'Tem a certeza que deseja eliminar esta crítica? Esta ação não pode ser desfeita.'),
      onConfirm: async () => {
        try {
          const res = await apiFetch(`${API_BASE}/admin_reviews.php?id=${id}`, { method: 'DELETE', credentials: 'include' });
          const data = await res.json();
          if (data.success) { showToast('Crítica eliminada', 'success'); fetchReviews(); }
        } catch { showToast('Erro ao eliminar crítica', 'error'); }
        setModal(m => ({ ...m, open: false }));
      }
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${API_BASE}/admin_reviews.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReview),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) { showToast('Crítica atualizada', 'success'); setEditingReview(null); fetchReviews(); }
    } catch { showToast('Erro ao atualizar crítica', 'error'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTitle) { showToast('Selecione um título', 'error'); return; }
    try {
      const res = await apiFetch(`${API_BASE}/admin_reviews.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newReview, title_id: selectedTitle.id }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Crítica adicionada!', 'success');
        setIsAdding(false); setSelectedTitle(null);
        setNewReview({ title_id: '', body: '', body_en: '', score: 8.0 });
        setTitleSearch(''); fetchReviews();
      }
    } catch { showToast('Erro ao adicionar crítica', 'error'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiFetch(`${API_BASE}/upload_reviews.php`, { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const imgTag = `<img src="${data.url}" style={t('admin_width_100_border_radius_12px_margin_15px', 'width: 100%; border-radius: 12px; margin: 15px 0;')} />`;
        const targetField = langTab === 'en' ? 'body_en' : 'body';
        if (isEditing) setEditingReview({ ...editingReview, [targetField]: (editingReview[targetField] || '') + '\n' + imgTag });
        else setNewReview({ ...newReview, [targetField]: (newReview[targetField] || '') + '\n' + imgTag });
        showToast('Imagem inserida!', 'success');
      } else { showToast(data.error, 'error'); }
    } catch { showToast('Erro ao carregar imagem', 'error'); }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  const scoreColor = (s: number) => s >= 7 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444';

  /* ── Shared: review form body ────────────────── */
  const ReviewForm = ({
    isEdit, form, setForm, onSubmit, onClose
  }: {
    isEdit: boolean;
    form: any;
    setForm: (v: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
  }) => (
    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isEdit ? <Edit2 size={18} color="var(--accent)" /> : <Plus size={18} color="var(--accent)" />}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{isEdit ? t('admin_editar_critica', 'Editar Crítica') : t('admin_nova_critica', 'Nova Crítica')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px', ...(showPreview ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}) }}>
            {showPreview ? <Edit2 size={14} /> : <Eye size={14} />}
            {showPreview ? 'Escrever' : t('admin_pre_visualizar', 'Pré-visualizar')}
          </button>
          <button onClick={onClose} style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        <form onSubmit={onSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title selector (add only) */}
          {!isEdit && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('admin_filme_serie', 'Filme / Série *')}</label>
              {selectedTitle ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.25)', borderRadius: 12, padding: '10px 14px' }}>
                  <img src={selectedTitle.poster || PLACEHOLDER_IMG} style={{ width: 36, height: 52, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTitle.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedTitle.type === 'series' ? t('admin_serie', 'Série') : 'Filme'}</div>
                  </div>
                  <button type="button" onClick={() => setSelectedTitle(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div className="search-box" style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>
                    <Search size={16} color="var(--text-secondary)" />
                    <input type="text" placeholder={t('admin_pesquisar_titulo', 'Pesquisar título...')} value={titleSearch} onChange={e => setTitleSearch(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  {titleResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, marginTop: 4, overflow: 'hidden', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                      {titleResults.map(t => (
                        <button key={t.id} type="button" onClick={() => { setSelectedTitle(t); setTitleSearch(''); setTitleResults([]); }}
                          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)', fontSize: 14, transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(120, 120, 120, 0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <img src={t.poster || PLACEHOLDER_IMG} style={{ width: 28, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} alt="" />
                          <div>
                            <div style={{ fontWeight: 600 }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.type === 'series' ? 'Série' : 'Filme'} • {t.release_date ? new Date(t.release_date).getFullYear() : 'N/A'}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!showPreview ? (
            <>
              {/* Score */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{t('admin_classificacao_010', 'Classificação (0–10)')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <input type="range" min="0" max="10" step="0.1"
                    style={{ flex: 1, accentColor: 'var(--accent)', height: 4 }}
                    value={form.score}
                    onChange={e => setForm({ ...form, score: parseFloat(e.target.value) })}
                  />
                  <div style={{ minWidth: 60, textAlign: 'center', background: 'rgba(120, 120, 120, 0.08)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '6px 12px', fontSize: 18, fontWeight: 800, color: scoreColor(Number(form.score)) }}>
                    {Number(form.score).toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="settings-tabs" style={{ marginBottom: 15 }}>
                <button type="button" className={`settings-tab ${langTab === 'pt' ? 'active' : ''}`} onClick={() => setLangTab('pt')}>{t('admin_portugues', 'Português')}</button>
                <button type="button" className={`settings-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>{t('admin_ingles', 'Inglês')}</button>
              </div>

              {/* Body */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {langTab === 'pt' ? t('admin_conteudo_da_critica_pt', 'Conteúdo da Crítica (PT) *') : t('admin_conteudo_da_critica_en', 'Conteúdo da Crítica (EN) *')}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
                    <ImageIcon size={13} /> {t('admin_inserir_imagem', 'Inserir Imagem')}
                    <input type="file" hidden accept="image/*" onChange={e => handleImageUpload(e, isEdit)} />
                  </label>
                </div>
                <textarea className="form-input" rows={12}
                  placeholder={langTab === 'pt' ? "Escreva aqui a sua análise em Português..." : "Write your review in English here..."}
                  style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.7, width: '100%' }}
                  value={langTab === 'pt' ? (form.body || '') : (form.body_en || '')}
                  onChange={e => setForm({ ...form, [langTab === 'pt' ? 'body' : 'body_en']: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '24px', minHeight: 300, lineHeight: 1.8, fontSize: 15, color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(langTab === 'pt' ? (form.body || '') : (form.body_en || '')) }} />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>{t('btn_cancel', 'Cancelar')}</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {isEdit ? 'Guardar Alterações' : 'Publicar Crítica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────── */
  return (
    <div className="admin-page">
      <AdminPageHeader
        title={t('reviews_title', 'Críticas')}
        subtitle={t('admin_gerir_as_avaliacoes_e_criticas_deixadas_', 'Gerir as avaliações e críticas deixadas pelos utilizadores.')}
        actions={
          <button className="btn-primary" onClick={() => { setIsAdding(true); setShowPreview(false); setLangTab('pt'); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> {t('admin_adicionar_critica', 'Adicionar Crítica')}
          </button>
        }
      />

      {/* Search bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="search-box" style={{ background: 'rgba(255,255,255,0.03)', maxWidth: 480 }}>
          <Search size={18} color="var(--text-secondary)" />
          <input type="text" placeholder={t('admin_pesquisar_por_filme_ou_conteudo', 'Pesquisar por filme ou conteúdo...')} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
          <Star size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0 }}>{t('admin_nenhuma_critica_encontrada', 'Nenhuma crítica encontrada.')}</p>
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(review => (
            <div key={review.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 0 }}>
                {/* Poster */}
                <div style={{ flexShrink: 0, width: 60, background: '#0a0a0a', position: 'relative' }}>
                  <img src={review.title_poster || PLACEHOLDER_IMG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 90 }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.title_name}</h3>
                    {/* Score badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${scoreColor(Number(review.score))}18`, border: `1px solid ${scoreColor(Number(review.score))}40`, borderRadius: 8, padding: '3px 9px', flexShrink: 0 }}>
                      <Star size={11} fill={scoreColor(Number(review.score))} color={scoreColor(Number(review.score))} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(Number(review.score)) }}>{Number(review.score).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={11} /> {review.username || 'Sistema'}
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--glass-border)', flexShrink: 0 }} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {formatDate(review.created_at)}
                    </span>
                  </div>

                  {/* Excerpt */}
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {(review.body || '').replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px', borderLeft: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                  <button className="action-btn-circle" title="Editar" onClick={() => { setEditingReview(review); setShowPreview(false); setLangTab('pt'); }}>
                    <Edit2 size={15} />
                  </button>
                  <button className="action-btn-circle delete" title="Eliminar" onClick={() => handleDelete(review.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}><input type="checkbox" className="custom-checkbox" /></th>
                  <th>{t('admin_titulo', 'Título')}</th>
                  <th>{t('admin_utilizador', 'Utilizador')}</th>
                  <th>{t('admin_classificacao', 'Classificação')}</th>
                  <th>{t('admin_resumo', 'Resumo')}</th>
                  <th>{t('admin_data_de_publicacao', 'Data de Publicação')}</th>
                  <th style={{ width: 120, textAlign: 'right' }}>{t('admin_acoes', 'Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.id}>
                    <td><input type="checkbox" className="custom-checkbox" /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img 
                          src={review.title_poster || PLACEHOLDER_IMG} 
                          alt="" 
                          style={{ width: 36, height: 50, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} 
                        />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                          {review.title_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} style={{ opacity: 0.6 }} />
                        <span>{review.username || 'Sistema'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${scoreColor(Number(review.score))}18`, border: `1px solid ${scoreColor(Number(review.score))}40`, borderRadius: 8, padding: '3px 9px' }}>
                        <Star size={11} fill={scoreColor(Number(review.score))} color={scoreColor(Number(review.score))} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(Number(review.score)) }}>{Number(review.score).toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 350 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={(review.body || '').replace(/<[^>]*>?/gm, '')}>
                        {(review.body || '').replace(/<[^>]*>?/gm, '')}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} style={{ opacity: 0.6 }} />
                        <span>{formatDate(review.created_at)}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="action-btn" title="Editar" onClick={() => { setEditingReview(review); setShowPreview(false); setLangTab('pt'); }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" title="Eliminar" onClick={() => handleDelete(review.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {reviews.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
          <span>1 – {reviews.length} de {reviews.length}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="action-btn-circle" disabled><ChevronLeft size={15} /></button>
            <button className="action-btn-circle" disabled><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReview && (
        <div onClick={() => setEditingReview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ReviewForm
            isEdit
            form={editingReview}
            setForm={setEditingReview}
            onSubmit={handleUpdate}
            onClose={() => setEditingReview(null)}
          />
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div onClick={() => setIsAdding(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ReviewForm
            isEdit={false}
            form={newReview}
            setForm={setNewReview}
            onSubmit={handleCreate}
            onClose={() => setIsAdding(false)}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />
    </div>
  );
}
