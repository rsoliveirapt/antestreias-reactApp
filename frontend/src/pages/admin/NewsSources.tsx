import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, ArrowLeft, Save, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE, apiFetch } from '../../config';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useTranslation } from '../../context/LanguageContext';

interface NewsSource {
  id: number;
  name: string;
  url: string;
  is_active: number;
  selector_container?: string;
  selector_title?: string;
}

export default function AdminNewsSources() {
  const { t } = useTranslation();
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_news_sources.php`);
      const data = await res.json();
      setSources(data);
    } catch (err) {
      console.error(t('admin_failed_to_fetch_news_sources', 'Failed to fetch news sources'));
    }
  };

  const handleToggle = async (source: NewsSource) => {
    try {
      const updated = { ...source, is_active: source.is_active === 1 ? 0 : 1 };
      await apiFetch(`${API_BASE}/admin_news_sources.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setSources(sources.map(s => s.id === source.id ? updated : s));
      showToast(`Fonte ${updated.is_active ? 'ativada' : 'desativada'} com sucesso.`);
    } catch (err) {
      showToast('Erro ao atualizar fonte.', 'error');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${API_BASE}/admin_news_sources.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });
      const data = await res.json();
      setSources([...sources, { ...newSource, id: data.id, is_active: 1 }]);
      setNewSource({ name: '', url: '' });
      setShowAdd(false);
      showToast('Fonte adicionada com sucesso.', 'success');
    } catch (err) {
      showToast('Erro ao adicionar fonte.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`${API_BASE}/admin_news_sources.php?id=${deleteId}`, { method: 'DELETE' });
      setSources(sources.filter(s => s.id !== deleteId));
      setDeleteId(null);
      showToast(t('admin_fonte_removida_com_sucesso', 'Fonte removida com sucesso.'));
    } catch (err) {
      showToast('Erro ao apagar fonte.', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <Link to="/admin/news" className="btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1>{t('admin_fontes_de_noticias', 'Fontes de Notícias')}</h1>
            <p>{t('admin_configura_os_sites_de_onde_as_noticias_s', 'Configura os sites de onde as notícias são importadas.')}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
          <Plus size={18} /> {t('admin_adicionar_fonte', 'Adicionar Fonte')}
        </button>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {sources.map(source => (
          <div key={source.id} className={`admin-card ${source.is_active === 0 ? 'opacity-50' : ''}`} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Globe size={20} color={source.is_active ? 'var(--accent)' : 'var(--text-secondary)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.name}</h3>
                  <a href={source.url} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{source.url}</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button 
                  className={`btn-icon ${source.is_active ? 'text-success' : 'text-secondary'}`} 
                  onClick={() => handleToggle(source)}
                  title={source.is_active ? 'Desativar' : 'Ativar'}
                >
                  <Power size={18} />
                </button>
                <button 
                  className={t('admin_btn_icon_text_danger', 'btn-icon text-danger')} 
                  onClick={() => setDeleteId(source.id)}
                  title="Remover"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Status: <span style={{ color: source.is_active ? '#4ade80' : '#f87171' }}>{source.is_active ? 'Ativa' : 'Inativa'}</span>
            </div>
          </div>
        ))}
      </div>

      {deleteId && (
        <ConfirmModal 
          isOpen={!!deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={t('admin_remover_fonte', 'Remover Fonte')}
          message={t('admin_tens_a_certeza_que_pretendes_remover_est', 'Tens a certeza que pretendes remover esta fonte? As notícias já importadas não serão apagadas.')}
        />
      )}

      {showAdd && (
        <div className="custom-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="custom-modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe size={20} className="accent-text" />
                {t('admin_adicionar_nova_fonte', 'Adicionar Nova Fonte')}
              </h3>
              <button className="close-btn" onClick={() => setShowAdd(false)}><ArrowLeft size={18} /></button>
            </div>
            
            <form onSubmit={handleAdd} className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_nome_do_site', 'Nome do Site')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newSource.name} 
                    onChange={e => setNewSource({ ...newSource, name: e.target.value })} 
                    required 
                    placeholder={t('admin_ex_c7nema', 'Ex: C7nema')}
                    autoFocus
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_url_principal', 'URL Principal')}</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    value={newSource.url} 
                    onChange={e => setNewSource({ ...newSource, url: e.target.value })} 
                    required 
                    placeholder="https://site.com/"
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {t('admin_o_url_deve_ser_o_link_direto_para_a_seccao_de_noti', 'O URL deve ser o link direto para a secção de notícias.')}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                  <button type="button" className="btn-secondary" style={{ height: 45, padding: '0 25px' }} onClick={() => setShowAdd(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ height: 45, padding: '0 25px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Save size={18} /> {t('admin_guardar_fonte', 'Guardar Fonte')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
