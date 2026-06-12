import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ExternalLink, User, Calendar } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { showToast } from '../../components/Toast';
import AdminPageHeader from '../../components/AdminPageHeader';
import ConfirmModal from '../../components/ConfirmModal';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
  owner: string;
  type: string;
  updated_at: string;
}

export default function AdminPages() {
  const { t } = useTranslation();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPages();
    
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_pages.php`);
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(t('admin_failed_to_fetch_pages', 'Failed to fetch pages'));
      showToast('Erro ao carregar páginas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`${API_BASE}/admin_pages.php?id=${deleteId}`, { method: 'DELETE' });
      setPages(pages.filter(p => p.id !== deleteId));
      showToast(t('admin_pagina_eliminada_com_sucesso', 'Página eliminada com sucesso.'));
    } catch (err) {
      showToast('Erro ao eliminar página.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'institucional':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case t('admin_juridico', 'jurídico'):
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'artigo':
        return { background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)' };
      case 'campanha':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
      default:
        return { background: 'rgba(120, 120, 120, 0.08)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' };
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return date;
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = 
      page.slug.toLowerCase().includes(search.toLowerCase()) ||
      (page.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (page.owner || '').toLowerCase().includes(search.toLowerCase());
      
    const matchesType = !selectedType || page.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="admin-page">
      <AdminPageHeader 
        title={t('admin_paginas_personalizadas', 'Páginas Personalizadas')}
        subtitle={t('admin_gira_as_paginas_institucionais_e_persona', 'Gira as páginas institucionais e personalizadas do sistema.')}
        actions={
          <>
            <button 
              className={`btn-secondary ${isFilterOpen ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, borderColor: isFilterOpen ? 'var(--accent)' : 'var(--glass-border)' }}
            >
              <Filter size={18} color="var(--accent)" /> {t('admin_filtrar', 'Filtrar')}
            </button>

            <button 
              className="btn-primary" 
              onClick={() => navigate('/admin/pages/new')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', border: 'none' }}
            >
              <Plus size={18} /> {t('admin_nova_pagina', 'Nova página')}
            </button>
          </>
        }
      />

      {/* Filter panel */}
      {isFilterOpen && (
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5 }}>{t('admin_tipo_de_pagina', 'Tipo de Página')}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Todos', 'Institucional', 'Jurídico', 'Artigo', 'Campanha'].map(type => {
              const isActive = (type === 'Todos' && !selectedType) || selectedType === type;
              const labels: Record<string, string> = {
                'Todos': t('admin_todos', 'Todos'),
                'Institucional': t('admin_institucional', 'Institucional'),
                'Jurídico': t('admin_juridico', 'Jurídico'),
                'Artigo': t('admin_artigo', 'Artigo'),
                'Campanha': t('admin_campanha', 'Campanha')
              };
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type === 'Todos' ? '' : type)}
                  className={`chip ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                    background: isActive ? 'var(--accent)' : 'rgba(120, 120, 120, 0.05)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {labels[type] || type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          className="form-input" 
          placeholder={t('admin_escreve_para_pesquisar', 'Escreve para pesquisar...')} 
          style={{ paddingLeft: 44 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : filteredPages.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_nenhuma_pagina_encontrada', 'Nenhuma página encontrada.')}</div>
        ) : isMobile ? (
          /* Mobile Card View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderBottom: '1px solid var(--glass-border)' }}>
            {filteredPages.map(page => {
              const badgeStyle = getBadgeStyle(page.type);
              return (
                <div key={page.id} style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid var(--glass-border)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.title || t('admin_pagina_sem_titulo', 'Página Sem Título')}
                      </h3>
                      <Link 
                        to={`/admin/pages/${page.id}`} 
                        style={{ 
                          color: 'var(--accent)', 
                          fontWeight: 600, 
                          textDecoration: 'none', 
                          fontSize: 13, 
                          display: 'block', 
                          marginTop: 4,
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        /{page.slug}
                      </Link>
                    </div>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 700, 
                      padding: '3px 8px', 
                      borderRadius: 6,
                      flexShrink: 0,
                      ...badgeStyle
                    }}>
                      {page.type}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={13} /> {page.owner}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> {formatDate(page.updated_at)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
                    <a 
                      href={`/${page.slug}`} 
                      target="_blank" 
                      rel={t('admin_noopener_noreferrer', 'noopener noreferrer')} 
                      className="action-btn-circle" 
                      title="Visualizar"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ExternalLink size={15} />
                    </a>
                    <button className="action-btn-circle" onClick={() => navigate(`/admin/pages/${page.id}`)} title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button className="action-btn-circle delete" onClick={() => setDeleteId(page.id)} title="Apagar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}><input type="checkbox" className="custom-checkbox" /></th>
                  <th>{t('admin_titulo_url_slug', 'Título / URL (Slug)')}</th>
                  <th>{t('admin_proprietario', 'Proprietário')}</th>
                  <th>{t('admin_tipo', 'Tipo')}</th>
                  <th>{t('admin_ultima_atualizacao', 'Última atualização')}</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map(page => {
                  const badgeStyle = getBadgeStyle(page.type);
                  return (
                    <tr key={page.id}>
                      <td><input type="checkbox" className="custom-checkbox" /></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{page.title || t('admin_sem_titulo', 'Sem Título')}</span>
                          <Link to={`/admin/pages/${page.id}`} style={{ color: 'var(--accent)', fontSize: 12, textDecoration: 'none', fontFamily: 'monospace', marginTop: 2 }}>
                            /{page.slug}
                          </Link>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{page.owner}</td>
                      <td>
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 700, 
                          padding: '3px 8px', 
                          borderRadius: 6,
                          ...badgeStyle
                        }}>
                          {page.type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(page.updated_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <a 
                            href={`/${page.slug}`} 
                            target="_blank" 
                            rel={t('admin_noopener_noreferrer', 'noopener noreferrer')} 
                            className="action-btn" 
                            title="Visualizar"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button className="action-btn" onClick={() => navigate(`/admin/pages/${page.id}`)} title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => setDeleteId(page.id)} title="Apagar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination bar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_itens_por_pagina', 'Itens por página')}</span>
            <select className="form-input" style={{ width: 70, padding: '4px 8px', fontSize: 13 }}>
              <option>15</option>
              <option>30</option>
              <option>50</option>
            </select>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>1 - {filteredPages.length} de {filteredPages.length}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="action-btn" disabled><ChevronLeft size={18} /></button>
            <button className="action-btn" disabled><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        title={t('admin_eliminar_pagina', 'Eliminar Página')}
        message={t('admin_tem_a_certeza_que_deseja_eliminar_esta_p', 'Tem a certeza que deseja eliminar esta página? Esta ação não pode ser desfeita.')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
