import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Pencil, Trash2, Filter, Plus, ExternalLink } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminCelebrities() {
  const { t } = useTranslation();
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState<{open: boolean, id: any, name: string}>({ open: false, id: null, name: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_people.php?search=${search}&page=${page}`, { credentials: 'include' });
      const data = await res.json();
      setPeople(data.people || []);
      setTotalPages(data.pages || 1);
    } catch {
      showToast('Erro ao carregar celebridades.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPeople, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleDelete = async () => {
    try {
      const isAll = modal.id === 'all';
      const url = isAll 
        ? `${API_BASE}/admin_people.php?all=true`
        : `${API_BASE}/admin_people.php?id=${modal.id}`;

      const res = await apiFetch(url, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        showToast(isAll ? t('admin_todas_as_celebridades_foram_eliminadas', 'Todas as celebridades foram eliminadas.') : t('admin_ator_eliminado_com_sucesso', 'Ator eliminado com sucesso.'), 'success');
        if (isAll) setPage(1);
        fetchPeople();
      } else {
        showToast('Erro ao eliminar.', 'error');
      }
    } catch {
      showToast('Erro de ligação.', 'error');
    }
    setModal({ open: false, id: null, name: '' });
  };

  return (
    <div className="admin-media-page">
      <AdminPageHeader 
        title={t('menu_celebrities', 'Celebridades')} 
        subtitle={t('admin_gere_todos_os_atores_e_equipa_tecnica_im', 'Gere todos os atores e equipa técnica importada')} 
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="btn-danger" 
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 16px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setModal({ open: true, id: 'all', name: t('admin_todas_as_celebridades', 'TODAS as celebridades') })}
            >
              <Trash2 size={18} /> {t('admin_eliminar_todos', 'Eliminar Todos')}
            </button>
            <Link to="/admin/celebrities/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Plus size={18} /> {t('admin_adicionar_celebridade', 'Adicionar Celebridade')}
            </Link>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder={t('admin_pesquisar_por_nome', 'Pesquisar por nome...')} 
            className="form-input" 
            style={{ paddingLeft: 44, height: 48, background: 'rgba(255,255,255,0.03)' }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="btn-secondary"><Filter size={18} /></button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>{t('admin_carregando_artistas', 'Carregando artistas...')}</div>
      ) : (
        <>
          {isMobile ? (
            /* Mobile Card View */
            <div className="celebrities-cards-container">
              {people.map(p => (
                <div key={p.id} className="celebrity-card">
                  <div className="celebrity-card-header">
                    <Link to={`/admin/celebrities/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
                      <div className="celebrity-card-avatar">
                        {p.poster ? <img src={p.poster} alt="" /> : <Users size={22} style={{ margin: 13, opacity: 0.2 }} />}
                      </div>
                      <div className="celebrity-card-info">
                        <div className="celebrity-card-name">{p.name}</div>
                        <div className="celebrity-card-birth">{p.place_of_birth || t('admin_local_desconhecido', 'Local desconhecido')}</div>
                      </div>
                    </Link>
                    <div className="celebrity-card-actions">
                      <Link to={`/celebrity/${p.slug || p.id}`} target="_blank" className="action-btn" title={t('admin_ver_pagina_publica', 'Ver Página Pública')}><ExternalLink size={16} /></Link>
                      <Link to={`/admin/celebrities/${p.id}`} className="action-btn" title="Editar"><Pencil size={16} /></Link>
                      <button className="action-btn delete" title="Eliminar" onClick={() => setModal({ open: true, id: p.id, name: p.name })}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="celebrity-card-details">
                    <div className="celebrity-detail-item">
                      <span className="celebrity-detail-label">{t('admin_slug', 'Slug')}</span>
                      <code className="celebrity-detail-value" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.slug || '—'}</code>
                    </div>
                    <div className="celebrity-detail-item">
                      <span className="celebrity-detail-label">{t('admin_tmdb_id', 'TMDB ID')}</span>
                      <span className="celebrity-detail-value">{p.tmdb_id || '—'}</span>
                    </div>
                    <div className="celebrity-popularity-wrapper">
                      <span className="celebrity-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{t('admin_popularidade', 'Popularidade')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end', maxWidth: '70%' }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, maxWidth: 60 }}>
                          <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${Math.min(p.popularity, 100)}%` }}></div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{parseFloat(p.popularity).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {people.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
                  {t('admin_nenhuma_celebridade_encontrada', 'Nenhuma celebridade encontrada.')}
                </div>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>{t('admin_celebridade', 'CELEBRIDADE')}</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>{t('admin_slug_tmdb', 'SLUG / TMDB')}</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>{t('admin_popularidade', 'POPULARIDADE')}</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textAlign: 'right' }}>{t('admin_acoes', 'AÇÕES')}</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 20px' }}>
                        <Link to={`/admin/celebrities/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                            {p.poster ? <img src={p.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: 12, opacity: 0.2 }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.place_of_birth || t('admin_local_desconhecido', 'Local desconhecido')}</div>
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, width: 'fit-content' }}>{p.slug || '—'}</code>
                          <code style={{ fontSize: 10, opacity: 0.6 }}>TMDB: {p.tmdb_id || '—'}</code>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, maxWidth: 60 }}>
                            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${Math.min(p.popularity, 100)}%` }}></div>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{parseFloat(p.popularity).toFixed(1)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <Link to={`/celebrity/${p.slug || p.id}`} target="_blank" className="action-btn" title={t('admin_ver_pagina_publica', 'Ver Página Pública')}><ExternalLink size={16} /></Link>
                          <Link to={`/admin/celebrities/${p.id}`} className="action-btn" title="Editar"><Pencil size={16} /></Link>
                          <button className="action-btn delete" title="Eliminar" onClick={() => setModal({ open: true, id: p.id, name: p.name })}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {people.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>{t('admin_nenhuma_celebridade_encontrada', 'Nenhuma celebridade encontrada.')}</div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">{t('admin_anterior', 'Anterior')}</button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14 }}>Página {page} de {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary">{t('admin_proxima', 'Próxima')}</button>
            </div>
          )}

          <style>{`
            .celebrities-cards-container {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .celebrity-card {
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid var(--glass-border);
              border-radius: 12px;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .celebrity-card-header {
              display: flex;
              gap: 12px;
              align-items: center;
            }
            .celebrity-card-avatar {
              width: 48px;
              height: 48px;
              border-radius: 10px;
              overflow: hidden;
              background: rgba(255, 255, 255, 0.05);
              flex-shrink: 0;
            }
            .celebrity-card-avatar img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .celebrity-card-info {
              flex: 1;
              min-width: 0;
            }
            .celebrity-card-name {
              font-weight: 600;
              font-size: 15px;
              color: white;
              margin-bottom: 2px;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
            }
            .celebrity-card-birth {
              font-size: 12px;
              color: var(--text-secondary);
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
            }
            .celebrity-card-actions {
              display: flex;
              gap: 6px;
              align-self: flex-start;
            }
            .celebrity-card-details {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
              padding-top: 12px;
            }
            .celebrity-detail-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
              background: rgba(255, 255, 255, 0.015);
              padding: 8px 10px;
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.03);
              min-width: 0;
            }
            .celebrity-detail-label {
              font-size: 9px;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .celebrity-detail-value {
              font-size: 11px;
              color: white;
              font-weight: 600;
            }
            .celebrity-popularity-wrapper {
              grid-column: span 2;
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: rgba(255, 255, 255, 0.015);
              padding: 8px 12px;
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.03);
            }
          `}</style>
        </>
      )}

      <ConfirmModal 
        isOpen={modal.open}
        title={modal.id === 'all' ? t('admin_eliminar_todas_as_celebridades', 'Eliminar TODAS as Celebridades') : t('admin_eliminar_celebridade', 'Eliminar Celebridade')}
        message={modal.id === 'all' 
          ? t('admin_tem_a_certeza_absoluta_que_deseja_eliminar_todas_a', 'Tem a CERTEZA absoluta que deseja eliminar todas as celebridades da base de dados? Esta ação é irreversível e removerá todos os créditos associados.')
          : `Tem a certeza que deseja eliminar "${modal.name}"? Esta ação também removerá todos os seus créditos em filmes e séries.`}
        onConfirm={handleDelete}
        onCancel={() => setModal({ open: false, id: null, name: '' })}
      />
    </div>
  );
}
