import { useState, useEffect } from 'react';
import { Search, Filter, Image as ImageIcon, Check, Eye, ChevronLeft, ChevronRight, Trash2, ChevronDown } from 'lucide-react';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import AdminPageHeader from '../../components/AdminPageHeader';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

interface FileEntry {
  id: string;
  name: string;
  hash_name: string;
  uploader_name: string;
  uploader_email: string;
  uploader_avatar: string;
  type: string;
  public: boolean;
  size: string;
  updated_at: string;
  url: string;
}

export default function AdminFiles() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{id: string, url: string} | null>(null);
  
  // Filters state
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{
    tipo: string[];
    visibilidade: string[];
    responsavel: string[];
  }>({
    tipo: [],
    visibilidade: [],
    responsavel: []
  });

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_files.php`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(t('admin_failed_to_fetch_files', 'Failed to fetch files:'), err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, url: string) => {
    setDeleteCandidate({ id, url });
  };

  const performDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await apiFetch(`${API_BASE}/admin_files.php?id=${deleteCandidate.id}&url=${encodeURIComponent(deleteCandidate.url)}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== deleteCandidate.id));
      showToast(t('admin_ficheiro_eliminado_com_sucesso', 'Ficheiro eliminado com sucesso.'));
    } catch (err) {
      showToast('Erro ao eliminar ficheiro.', 'error');
    } finally {
      setDeleteCandidate(null);
    }
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedFilters({ tipo: [], visibilidade: [], responsavel: [] });
    setCurrentPage(1);
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.hash_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesTipo = selectedFilters.tipo.length === 0 || selectedFilters.tipo.includes(f.type);
    const matchesVis = selectedFilters.visibilidade.length === 0 || 
      (selectedFilters.visibilidade.includes(t('admin_publico', 'Público')) && f.public) || 
      (selectedFilters.visibilidade.includes(t('admin_privado', 'Privado')) && !f.public);
    const matchesResp = selectedFilters.responsavel.length === 0 || selectedFilters.responsavel.includes(f.uploader_name);

    return matchesSearch && matchesTipo && matchesVis && matchesResp;
  });

  const totalItems = filteredFiles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  const uniqueUploaders = Array.from(new Set(files.map(f => f.uploader_name))).filter(Boolean);

  const filterConfig = [
    { id: 'tipo', label: t('admin_tipo', 'Tipo'), options: ['Image', 'File'] },
    { id: 'visibilidade', label: 'Visibilidade', options: [t('admin_publico', 'Público'), t('admin_privado', 'Privado')] },
    { id: 'responsavel', label: t('admin_responsavel_pelo_carregamento', 'Responsável pelo carregamento'), options: uniqueUploaders },
  ];

  return (
    <div className="admin-page admin-page-files">
      <style>{`
        /* Layout container padding */
        .admin-page-files {
          padding: 0 40px 60px;
        }
        
        /* Controls layout */
        .files-controls {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 15px;
        }
        .files-search-container {
          position: relative;
          width: 400px;
          flex-shrink: 1;
        }
        .files-search-input {
          width: 100%;
          padding: 10px 10px 10px 40px;
          background: var(--bg-primary);
          border: 1px solid var(--glass-border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .files-search-input:focus {
          border-color: var(--accent, #e50914);
        }
        .files-filter-container {
          position: relative;
          display: block;
          width: auto;
        }
        .files-filter-btn {
          width: auto;
          justify-content: flex-start;
        }
        
        /* Dropdown positioning */
        .files-filter-dropdown {
          position: absolute;
          top: 120%;
          right: 0;
          width: 280px;
          z-index: 100;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .files-filter-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: transparent;
          z-index: 99;
        }

        /* List container and scroll behavior */
        .files-list-container {
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          overflow: hidden;
        }
        .files-mobile-view {
          display: none;
        }
        .files-desktop-view {
          display: block;
        }

        /* Pagination controls */
        .files-pagination {
          padding: 16px 24px;
          border-top: 1px solid var(--glass-border);
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
        }
        .files-pagination-section {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: space-between;
          width: auto;
        }

        .action-btn {
          transition: background 0.2s;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .action-btn.delete:hover {
          background: rgba(229, 9, 20, 0.2) !important;
        }

        /* Responsive breakpoints */
        @media (max-width: 1024px) {
          .admin-page-files {
            padding: 0 16px 40px !important;
          }
          .files-controls {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .files-search-container {
            width: 100% !important;
          }
          .files-filter-container {
            display: flex !important;
            width: 100% !important;
          }
          .files-filter-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .files-filter-dropdown {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: calc(100% - 32px) !important;
            max-width: 320px !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8) !important;
          }
          .files-filter-backdrop {
            background: rgba(0,0,0,0.6) !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
          }
          .files-list-container {
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .files-mobile-view {
            display: flex !important;
            flex-direction: column;
            gap: 16px;
          }
          .files-desktop-view {
            display: none !important;
          }
          .files-pagination {
            padding: 16px 16px !important;
            flex-direction: column !important;
            justify-content: stretch !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .files-pagination-section {
            width: 100% !important;
          }
        }
      `}</style>
      <AdminPageHeader
        title={t('admin_ficheiros_carregados', 'Ficheiros Carregados')}
        subtitle={t('admin_gerir_as_imagens_documentos_e_ficheiros_', 'Gerir as imagens, documentos e ficheiros físicos alojados no servidor.')}
      />

      <div className="files-controls">
        <div className="files-search-container">
          <Search size={16} className="files-search-icon" style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888'
          }} />
          <input 
            type="text" 
            placeholder={t('admin_escreve_para_pesquisar', 'Escreve para pesquisar...')} 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="files-search-input"
          />
        </div>

        <div className="files-filter-container">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            style={{ 
              background: isFilterOpen ? 'rgba(229, 9, 20, 0.1)' : 'transparent', 
              border: '1px solid var(--accent)', 
              color: 'var(--accent)', 
              padding: '8px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              transition: '0.2s'
            }}
            className="files-filter-btn"
          >
            <Filter size={16} /> {t('admin_filtrar', 'Filtrar')}
          </button>

          {isFilterOpen && (
            <>
              <div 
                className="files-filter-backdrop"
                onClick={() => setIsFilterOpen(false)}
              />
              <div 
                className={t('admin_files_filter_dropdown_glass', 'files-filter-dropdown glass')}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={clearFilters} style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', transition: '0.2s' }} className="action-btn">{t('admin_limpar', 'Limpar')}</button>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{t('admin_filtrar', 'Filtrar')}</span>
                  <button onClick={() => setIsFilterOpen(false)} style={{ background: 'var(--accent)', border: 'none', color: '#ffffff', fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 6, cursor: 'pointer', transition: '0.2s' }}>{t('admin_aplicar', 'Aplicar')}</button>
                </div>
                <div style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
                  {filterConfig.map((item, i) => {
                    const isActive = expandedFilter === item.id;
                    const hasSelection = selectedFilters[item.id as keyof typeof selectedFilters].length > 0;
                    
                    return (
                      <div key={item.id}>
                        <div 
                          onClick={() => setExpandedFilter(isActive ? null : item.id)}
                          style={{ 
                            padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            borderBottom: i === filterConfig.length - 1 && !isActive ? 'none' : '1px solid rgba(255,255,255,0.05)', 
                            cursor: 'pointer', background: isActive ? 'rgba(255,255,255,0.02)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                              width: 16, height: 16, border: `1px solid ${hasSelection ? 'var(--accent)' : '#555'}`, 
                              borderRadius: 3, background: hasSelection ? 'var(--accent)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {hasSelection && <Check size={12} color="#ffffff" />}
                            </div>
                            <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                          </div>
                          <ChevronDown size={14} color="#888" style={{ transform: isActive ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </div>
                        
                        {isActive && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '8px 16px', borderBottom: i === filterConfig.length - 1 ? 'none' : '1px solid var(--glass-border)' }}>
                            {item.options.map(opt => {
                              const isSelected = selectedFilters[item.id as keyof typeof selectedFilters].includes(opt);
                              return (
                                <div 
                                  key={opt} 
                                  onClick={() => toggleFilter(item.id as keyof typeof selectedFilters, opt)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}
                                >
                                  <div style={{ 
                                    width: 14, height: 14, border: `1px solid ${isSelected ? 'var(--accent)' : '#555'}`, 
                                    borderRadius: 3, background: isSelected ? 'var(--accent)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    {isSelected && <Check size={10} color="#ffffff" />}
                                  </div>
                                  <span style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 13 }}>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="files-list-container">
        {/* Mobile View (Cards) */}
        <div className="files-mobile-view">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_a_carregar_ficheiros', 'A carregar ficheiros...')}</div>
          ) : paginatedFiles.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_nenhum_ficheiro_encontrado', 'Nenhum ficheiro encontrado.')}</div>
          ) : (
            paginatedFiles.map(file => (
              <div 
                key={file.id} 
                className="glass"
                style={{
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} 
                  />
                  
                  {file.type.toLowerCase() === 'image' ? (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={file.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                       <ImageIcon size={18} color="var(--text-secondary)" />
                    </div>
                  )}
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.2 }}>{file.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {file.hash_name}
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 8,
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--glass-border)',
                    borderBottom: '1px solid var(--glass-border)',
                    padding: '8px 0'
                  }}
                >
                  {/* Responsável Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: 'span 2' }}>
                    {file.uploader_avatar ? (
                      <img src={file.uploader_avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'var(--text-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600 }}>
                        {file.uploader_name ? file.uploader_name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>{t('admin_por', 'Por:')} <strong style={{ color: 'var(--text-primary)' }}>{file.uploader_name || 'N/A'}</strong></span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>{t('admin_tamanho', 'Tamanho:')}</span> <span style={{ color: 'var(--text-primary)' }}>{file.size}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>{t('admin_tipo', 'Tipo:')}</span> <span style={{ color: 'var(--text-primary)' }}>{file.type}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>{t('admin_visib', 'Visib.:')}</span> {file.public ? (
                      <span style={{ color: 'var(--accent)' }}>{t('admin_publico', 'Público')}</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>{t('admin_privado', 'Privado')}</span>
                    )}
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>{t('admin_data', 'Data:')}</span> <span style={{ color: 'var(--text-primary)' }}>{file.updated_at}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="action-btn" 
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12,
                      padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: 6,
                      color: 'var(--text-primary)', textDecoration: 'none', transition: '0.2s', fontWeight: 500
                    }}
                  >
                    <Eye size={14} /> Ver
                  </a>
                  <button 
                    className="action-btn delete" 
                    onClick={() => handleDeleteClick(file.id, file.url)} 
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12,
                      padding: '6px 12px', background: 'rgba(229, 9, 20, 0.1)', borderRadius: 6,
                      color: '#e50914', border: 'none', cursor: 'pointer', transition: '0.2s', fontWeight: 500
                    }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="files-desktop-view">
          <div className="admin-table-wrapper" style={{ margin: 0, border: 'none' }}>
            <table className="admin-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} /></th>
                  <th>{t('admin_nome', 'Nome')}</th>
                  <th>{t('admin_responsavel_pelo_carregamento', 'Responsável pelo carregamento')}</th>
                  <th>{t('admin_tipo', 'Tipo')}</th>
                  <th>{t('admin_publico', 'Público')}</th>
                  <th>{t('admin_tamanho_do_ficheiro', 'Tamanho do ficheiro')}</th>
                  <th>{t('admin_ultima_atualizacao', 'Última atualização')}</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_a_carregar_ficheiros', 'A carregar ficheiros...')}</td></tr>
                ) : paginatedFiles.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('admin_nenhum_ficheiro_encontrado', 'Nenhum ficheiro encontrado.')}</td></tr>
                ) : paginatedFiles.map(file => (
                  <tr key={file.id}>
                    <td><input type="checkbox" style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {file.type.toLowerCase() === 'image' ? (
                          <div style={{ width: 32, height: 32, borderRadius: 4, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <img src={file.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 4, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <ImageIcon size={16} color="#888" />
                          </div>
                        )}
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{file.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'monospace' }}>{file.hash_name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {file.uploader_avatar ? (
                          <img src={file.uploader_avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                            {file.uploader_name ? file.uploader_name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{file.uploader_name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{file.uploader_email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ImageIcon size={16} color="var(--accent)" />
                        <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{file.type}</span>
                      </div>
                    </td>
                    <td>
                      {file.public ? <Check size={18} color="var(--accent)" /> : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('admin_privado', 'Privado')}</span>}
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontSize: 13 }}>{file.size}</td>
                    <td style={{ color: 'var(--text-primary)', fontSize: 13 }}>{file.updated_at}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <a href={file.url} target="_blank" rel={t('admin_noopener_noreferrer', 'noopener noreferrer')} className="action-btn" title="Visualizar">
                          <Eye size={18} />
                        </a>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(file.id, file.url)} title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="files-pagination">
          <div className="files-pagination-section">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_itens_por_pagina', 'Itens por página')}</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: 4, width: 70, padding: '4px 8px', fontSize: 13, outline: 'none' }}
            >
              <option value={15} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>15</option>
              <option value={30} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>30</option>
              <option value={50} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>50</option>
            </select>
          </div>
          
          <div className="files-pagination-section">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ background: 'transparent', border: 'none', color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', opacity: currentPage === 1 ? 0.3 : 1, cursor: currentPage === 1 ? 'default' : 'pointer', padding: 4 }}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ background: 'transparent', border: 'none', color: currentPage === totalPages || totalPages === 0 ? 'var(--text-secondary)' : 'var(--text-primary)', opacity: currentPage === totalPages || totalPages === 0 ? 0.3 : 1, cursor: currentPage === totalPages || totalPages === 0 ? 'default' : 'pointer', padding: 4 }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteCandidate}
        title={t('admin_eliminar_ficheiro', 'Eliminar Ficheiro')}
        message={t('admin_tem_a_certeza_que_deseja_eliminar_este_f', 'Tem a certeza que deseja eliminar este ficheiro permanentemente? Esta ação não pode ser desfeita e o ficheiro será apagado do servidor.')}
        confirmLabel={t('admin_eliminar_ficheiro', 'Eliminar Ficheiro')}
        cancelLabel="Cancelar"
        onConfirm={performDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
}
