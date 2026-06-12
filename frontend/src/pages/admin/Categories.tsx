import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Tag, X } from 'lucide-react';
import { API_BASE, apiFetch } from '../../config';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  
  // Edit/Add state
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>({ name: '', display_name: '', display_name_en: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_categories.php?search=${search}`, { credentials: 'include' });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      showToast('Erro ao carregar categorias', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchCategories, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const res = await apiFetch(`${API_BASE}/admin_categories.php`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCategory),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(isEditing ? t('admin_categoria_atualizada', 'Categoria atualizada') : t('admin_categoria_criada', 'Categoria criada'), 'success');
        setShowForm(false);
        fetchCategories();
      }
    } catch (error) {
      showToast('Erro ao guardar categoria', 'error');
    }
  };

  const handleDelete = (id: number, name: string) => {
    setModal({
      open: true,
      title: t('admin_eliminar_categoria', 'Eliminar Categoria'),
      message: `Tem a certeza que deseja eliminar a categoria "${name}"? Esta ação também removerá esta categoria de todos os filmes/séries.`,
      onConfirm: async () => {
        try {
          const res = await apiFetch(`${API_BASE}/admin_categories.php?id=${id}`, { method: 'DELETE', credentials: 'include' });
          const data = await res.json();
          if (data.success) {
            showToast('Categoria eliminada', 'success');
            fetchCategories();
          }
        } catch (error) {
          showToast('Erro ao eliminar categoria', 'error');
        }
        setModal(m => ({ ...m, open: false }));
      }
    });
  };

  return (
    <div className="admin-page">
      <AdminPageHeader 
        title={t('menu_categories', 'Categorias')}
        subtitle={t('admin_gerir_as_categorias_de_filmes_e_series_d', 'Gerir as categorias de filmes e séries do site.')}
        actions={
          <button 
            className="btn-primary" 
            onClick={() => { setIsEditing(false); setCurrentCategory({ name: '', display_name: '', display_name_en: '' }); setShowForm(true); }} 
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> {t('admin_adicionar_nova', 'Adicionar Nova')}
          </button>
        }
      />

      <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          className="form-input" 
          placeholder={t('admin_pesquisar_categorias', 'Pesquisar categorias...')} 
          style={{ paddingLeft: 44 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spinner" />
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {t('admin_nenhuma_categoria_encontrada', 'Nenhuma categoria encontrada.')}
          </div>
        ) : isMobile ? (
          /* Mobile Card-List View */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map(category => (
              <div 
                key={category.id} 
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid var(--glass-border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 10, 
                    background: 'rgba(229,9,20,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--accent)', 
                    flexShrink: 0 
                  }}>
                    <Tag size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: 'white', display: 'block', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {category.display_name} {category.display_name_en && <span style={{ opacity: 0.5, fontWeight: 400 }}>({category.display_name_en})</span>}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'monospace', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      slug: {category.name}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button 
                    className="action-btn-circle" 
                    onClick={() => { setIsEditing(true); setCurrentCategory(category); setShowForm(true); }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button 
                    className="action-btn-circle delete" 
                    onClick={() => handleDelete(category.id, category.display_name)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin_categoria', 'CATEGORIA')}</th>
                  <th>{t('admin_slug_url', 'SLUG (URL)')}</th>
                  <th style={{ width: 120, textAlign: 'right' }}>{t('admin_acoes', 'AÇÕES')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: 8, 
                          background: 'rgba(229,9,20,0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--accent)' 
                        }}>
                          <Tag size={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{category.display_name} {category.display_name_en && <span style={{ opacity: 0.5, fontWeight: 400 }}>({category.display_name_en})</span>}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {category.name}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          className="action-btn" 
                          onClick={() => { setIsEditing(true); setCurrentCategory(category); setShowForm(true); }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDelete(category.id, category.display_name)}
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
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div 
          onClick={() => setShowForm(false)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.8)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000, 
            padding: 16
          }}
        >
          <div 
            className="glass-panel" 
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '100%', 
              maxWidth: 450, 
              padding: '24px 30px', 
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Close button in header */}
            <button 
              onClick={() => setShowForm(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                borderRadius: 8,
                width: 30,
                height: 30,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>

            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>
              {isEditing ? t('admin_editar_categoria', 'Editar Categoria') : t('admin_nova_categoria', 'Nova Categoria')}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">{t('admin_nome_de_exibicao', 'Nome de Exibição')}</label>
                <input 
                  className="form-input" 
                  required 
                  value={currentCategory.display_name} 
                  onChange={e => setCurrentCategory({ ...currentCategory, display_name: e.target.value })}
                  placeholder={t('admin_ex_acao_comedia', 'Ex: Ação, Comédia...')}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">{t('admin_nome_de_exibicao_en', 'Nome de Exibição (EN)')}</label>
                <input 
                  className="form-input" 
                  required 
                  value={currentCategory.display_name_en || ''} 
                  onChange={e => setCurrentCategory({ ...currentCategory, display_name_en: e.target.value })}
                  placeholder={t('admin_ex_action_comedy', 'Ex: Action, Comedy...')}
                />
              </div>
              <div style={{ marginBottom: 30 }}>
                <label className="form-label">{t('admin_slug_nome_na_url', 'Slug (Nome na URL)')}</label>
                <input 
                  className="form-input" 
                  required 
                  value={currentCategory.name} 
                  onChange={e => setCurrentCategory({ ...currentCategory, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder={t('admin_ex_acao_comedia', 'Ex: acao, comedia...')}
                />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, display: 'block' }}>
                  Será usado no link: antestreias.com/category/<b>{currentCategory.name || 'exemplo'}</b>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>{t('btn_cancel', 'Cancelar')}</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{isEditing ? 'Guardar' : t('admin_criar_categoria', 'Criar Categoria')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />

      <style>{`
        .form-label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }
      `}</style>
    </div>
  );
}
