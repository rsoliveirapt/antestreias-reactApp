import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Languages, Trash2, Search, Calendar, Globe, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { API_BASE, apiFetch } from '../../config';
import ConfirmModal from '../../components/ConfirmModal';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useTranslation } from '../../context/LanguageContext';

interface Localization {
  id: number;
  name: string;
  language: string;
  updated_at: string;
}

export default function AdminTranslations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [localizations, setLocalizations] = useState<Localization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Custom Modals states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLangCode, setNewLangCode] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchLocalizations();
    
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLocalizations = () => {
    setLoading(true);
    apiFetch(`${API_BASE}/admin_translations.php`)
      .then(res => res.json())
      .then(data => {
        setLocalizations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        showToast(t('admin_erro_ao_carregar_localizacoes', 'Erro ao carregar localizações'), 'error');
        setLoading(false);
      });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newLangCode) {
      showToast(t('admin_por_favor_preencha_todos_os_campos', 'Por favor preencha todos os campos.'), 'error');
      return;
    }
    
    apiFetch(`${API_BASE}/admin_translations.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, language: newLangCode.toLowerCase().trim() })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(t('admin_localizacao_adicionada_com_sucesso', 'Localização adicionada com sucesso!'), 'success');
        setShowAddModal(false);
        setNewName('');
        setNewLangCode('');
        fetchLocalizations();
      } else {
        showToast(data.error || t('admin_erro_ao_adicionar_localizacao', 'Erro ao adicionar localização'), 'error');
      }
    })
    .catch(() => {
      showToast(t('admin_erro_ao_adicionar_localizacao', 'Erro ao adicionar localização'), 'error');
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiFetch(`${API_BASE}/admin_translations.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId, delete: true })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_localizacao_eliminada', 'Localização eliminada.'), 'success');
        fetchLocalizations();
      } else {
        showToast(data.error || t('admin_erro_ao_eliminar_localizacao', 'Erro ao eliminar localização.'), 'error');
      }
    } catch {
      showToast(t('admin_erro_ao_eliminar_localizacao_toast', 'Erro ao eliminar localização'), 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const filtered = localizations.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-page">
      <AdminPageHeader 
        title={t('admin_localizacoes', 'Localizações')}
        subtitle={t('admin_gere_os_idiomas_e_traducoes_do_site', 'Gere os idiomas e traduções do site.')}
        actions={
          <button 
            className="btn-primary" 
            onClick={() => setShowAddModal(true)} 
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> {t('admin_adicionar_nova_localizacao', 'Adicionar nova localização')}
          </button>
        }
      />

      {/* Search Input Bar */}
      <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          className="form-input"
          placeholder={t('admin_escreve_para_pesquisar', 'Escreve para pesquisar...')} 
          style={{ paddingLeft: 44 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {t('admin_nenhuma_localizacao_encontrada', 'Nenhuma localização encontrada.')}
          </div>
        ) : isMobile ? (
          /* Mobile Card list view */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map(l => (
              <div 
                key={l.id} 
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
                    <Globe size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.name}
                      </span>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        background: 'rgba(120, 120, 120, 0.08)', 
                        border: '1px solid var(--glass-border)', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace'
                      }}>
                        {l.language}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Calendar size={12} /> {formatDate(l.updated_at)}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button 
                    className="action-btn-circle" 
                    title={t('admin_traduzir', 'Traduzir')} 
                    onClick={() => navigate(`/admin/translations/${l.id}`)}
                  >
                    <Languages size={15} />
                  </button>
                  <button 
                    className="action-btn-circle delete" 
                    title={t('btn_delete', 'Eliminar')} 
                    onClick={() => setDeleteId(l.id)}
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
                  <th style={{ width: 50 }}><input type="checkbox" className="custom-checkbox" /></th>
                  <th>{t('admin_nome', 'Nome')}</th>
                  <th>{t('admin_codigo_do_idioma', 'Código do idioma')}</th>
                  <th>{t('admin_ultima_atualizacao', 'Última atualização')}</th>
                  <th style={{ width: 120, textAlign: 'right' }}>{t('admin_acoes', 'Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td><input type="checkbox" className="custom-checkbox" /></td>
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
                          <Globe size={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{l.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        background: 'rgba(120, 120, 120, 0.08)', 
                        padding: '3px 8px', 
                        borderRadius: 4, 
                        border: '1px solid var(--glass-border)' 
                      }}>
                        {l.language}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(l.updated_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          className="action-btn" 
                          title={t('admin_traduzir', 'Traduzir')} 
                          onClick={() => navigate(`/admin/translations/${l.id}`)}
                        >
                          <Languages size={18} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => setDeleteId(l.id)} 
                          title={t('btn_delete', 'Eliminar')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_itens_por_pagina', 'Itens por página')}</span>
            <select className="form-input" style={{ width: 70, padding: '4px 8px', fontSize: 13 }}>
              <option>15</option>
              <option>30</option>
              <option>50</option>
            </select>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>1 - {filtered.length} {t('admin_de_of', 'de')} {localizations.length}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="action-btn" disabled><ChevronLeft size={18} /></button>
            <button className="action-btn" disabled><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
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
            {/* Close button */}
            <button 
              onClick={() => setShowAddModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
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
              {t('admin_nova_localizacao', 'Nova Localização')}
            </h2>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">{t('admin_nome_da_localizacao', 'Nome da Localização')}</label>
                <input 
                  className="form-input" 
                  required 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t('admin_ex_english_francais', 'Ex: English, Français...')}
                />
              </div>
              <div style={{ marginBottom: 30 }}>
                <label className="form-label">{t('admin_codigo_do_idioma', 'Código do Idioma')}</label>
                <input 
                  className="form-input" 
                  required 
                  value={newLangCode} 
                  onChange={e => setNewLangCode(e.target.value)}
                  placeholder={t('admin_ex_en_fr', 'Ex: en, fr...')}
                />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, display: 'block' }}>
                  {t('admin_codigo_iso_de_duas_letras_do_idioma', 'Código ISO de duas letras do idioma.')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>{t('btn_cancel', 'Cancelar')}</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{t('admin_criar_localizacao', 'Criar Localização')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        title={t('admin_eliminar_localizacao', 'Eliminar Localização')}
        message={t('admin_tem_a_certeza_que_deseja_eliminar_esta_l', 'Tem a certeza que deseja eliminar esta localização? Esta ação também eliminará todas as traduções associadas.')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <style>{`
        .form-label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }
      `}</style>
    </div>
  );
}
