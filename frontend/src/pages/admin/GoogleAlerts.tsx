import { useState, useEffect } from 'react';
import { Bell, ExternalLink, RefreshCw, Trash2, CheckCircle, Plus, Clock } from 'lucide-react';
import { API_BASE, apiFetch } from '../../config';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useTranslation } from '../../context/LanguageContext';

interface Feed {
  id: number;
  name: string;
  url: string;
  created_at: string;
}

interface AlertItem {
  id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  is_read: number;
}

export default function AdminGoogleAlerts() {
  const { t } = useTranslation();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: '', url: '' });
  const [visibleCount, setVisibleCount] = useState(6);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedsRes, itemsRes] = await Promise.all([
        apiFetch(`${API_BASE}/admin_google_alerts.php`),
        apiFetch(`${API_BASE}/admin_google_alerts.php?action=items&limit=100`)
      ]);
      const feedsData = await feedsRes.json();
      const itemsData = await itemsRes.json();
      setFeeds(feedsData);
      setItems(itemsData);
    } catch (err) {
      showToast('Erro ao carregar alertas.', 'error');
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_google_alerts.php?action=sync`);
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_sincronizacao_concluida_datanew_items_no', 'Sincronização concluída! ${data.new_items} novos alertas.'));
        fetchData();
      }
    } catch (err) {
      showToast('Erro ao sincronizar alertas.', 'error');
    }
    setSyncing(false);
  };

  const handleAddFeed = async () => {
    if (!newFeed.name || !newFeed.url) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }
    try {
      const res = await apiFetch(`${API_BASE}/admin_google_alerts.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_feed: newFeed })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_feed_adicionado', 'Feed adicionado!'));
        setNewFeed({ name: '', url: '' });
        setShowAddFeed(false);
        fetchData();
      }
    } catch (err) {
      showToast('Erro ao adicionar feed.', 'error');
    }
  };

  const handleDeleteFeed = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: t('admin_remover_feed_rss', 'Remover Feed RSS'),
      message: t('admin_tem_a_certeza_que_deseja_remover_este_feed_os_aler', 'Tem a certeza que deseja remover este feed? Os alertas não serão apagados.'),
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await apiFetch(`${API_BASE}/admin_google_alerts.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delete_feed: id })
          });
          const data = await res.json();
          if (data.success) {
            showToast(t('admin_feed_removido', 'Feed removido.'));
            fetchData();
          }
        } catch (err) {
          showToast('Erro ao remover feed.', 'error');
        }
      }
    });
  };

  const handleMarkRead = async (id: number) => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_google_alerts.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_read: id })
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.map(item => item.id === id ? { ...item, is_read: 1 } : item));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_google_alerts.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true })
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.map(item => ({ ...item, is_read: 1 })));
        showToast(t('admin_todos_marcados_como_lidos', 'Todos marcados como lidos.'));
      }
    } catch (err) {
      showToast('Erro ao marcar como lidos.', 'error');
    }
  };

  const handleDeleteAlert = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: t('admin_eliminar_alerta', 'Eliminar Alerta'),
      message: t('admin_tem_a_certeza_que_deseja_eliminar_este_alerta', 'Tem a certeza que deseja eliminar este alerta?'),
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await apiFetch(`${API_BASE}/admin_google_alerts.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delete_alert: id })
          });
          const data = await res.json();
          if (data.success) {
            setItems(items.filter(item => item.id !== id));
            showToast(t('admin_alerta_eliminado', 'Alerta eliminado.'));
          }
        } catch (err) {
          showToast('Erro ao eliminar alerta.', 'error');
        }
      }
    });
  };

  const handleDeleteAllAlerts = () => {
    setConfirmModal({
      isOpen: true,
      title: t('admin_eliminar_todos', 'Eliminar todos'),
      message: t('admin_tem_a_certeza_que_deseja_eliminar_todos_os_alertas', 'Tem a certeza que deseja eliminar TODOS os alertas? Esta ação é irreversível.'),
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await apiFetch(`${API_BASE}/admin_google_alerts.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delete_all_alerts: true })
          });
          const data = await res.json();
          if (data.success) {
            setItems([]);
            showToast(t('admin_todos_os_alertas_foram_eliminados', 'Todos os alertas foram eliminados.'));
          }
        } catch (err) {
          showToast('Erro ao eliminar alertas.', 'error');
        }
      }
    });
  };

  const cleanDescription = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  };

  return (
    <div className="admin-page">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title">{t('admin_google_alerts_notificacoes', 'Google Alerts & Notificações')}</h1>
          <p className="admin-subtitle">{t('admin_gere_os_teus_feeds_rss_e_recebe_alertas_', 'Gere os teus feeds RSS e recebe alertas em tempo real.')}</p>
        </div>
        <div className="alerts-page-header-actions">
          <button onClick={() => setShowAddFeed(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> {t('admin_configurar_feed_rss', 'Configurar Feed RSS')}
          </button>
          <button onClick={handleSync} className="btn-primary" disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={18} className={syncing ? 'spin' : ''} /> {syncing ? 'A sincronizar...' : t('admin_sincronizar_agora', 'Sincronizar Agora')}
          </button>
        </div>
      </div>

      <div className="admin-grid">
        
        {/* Alerts List */}
        <div className={t('admin_glass_alerts_list_card', 'glass alerts-list-card')}>
          <div className="alerts-header">
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t('admin_ultimos_alertas', 'Últimos Alertas')}</h2>
            <div className="alerts-header-actions">
              {items.some(i => !i.is_read) && (
                <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {t('admin_marcar_tudo_como_lido', 'Marcar tudo como lido')}
                </button>
              )}
              {items.length > 0 && (
                <button onClick={handleDeleteAllAlerts} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {t('admin_eliminar_todos', 'Eliminar todos')}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {items.length > 0 ? (
              <>
                {items.slice(0, visibleCount).map(item => (
                  <div key={item.id} className="alert-item-card" style={{ 
                    background: item.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(229, 9, 20, 0.05)',
                    border: item.is_read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(229, 9, 20, 0.2)',
                  }}>
                    <div className="alert-title-row">
                      <h3 
                        className="alert-title"
                        style={{ color: 'var(--text-primary)' }}
                        dangerouslySetInnerHTML={{ __html: item.title }}
                      />
                      <div className="alert-actions">
                        <button onClick={() => handleMarkRead(item.id)} title={t('admin_marcar_como_lido', 'Marcar como lido')} style={{ background: 'none', border: 'none', color: item.is_read ? '#444' : 'var(--accent)', cursor: 'pointer' }}>
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleDeleteAlert(item.id)} title="Eliminar" style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', opacity: 0.8 }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cleanDescription(item.description)}
                    </p>

                    <div className="alert-card-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Clock size={12} /> {new Date(item.pub_date).toLocaleString('pt-PT')}
                      </div>
                      <a href={item.link} target="_blank" rel={t('admin_noopener_noreferrer', 'noopener noreferrer')} className="original-link">
                        {t('admin_ver_original', 'Ver Original')} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}

                {items.length > visibleCount && (
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="btn-secondary" 
                    style={{ marginTop: 10, padding: '12px', width: '100%', borderRadius: 12, fontSize: 14, fontWeight: 600 }}
                  >
                    {t('admin_ver_mais_alertas', 'Ver mais alertas')}
                  </button>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                <Bell size={40} style={{ marginBottom: 15 }} />
                <p>{t('admin_nenhum_alerta_disponivel_adiciona_um_fee', 'Nenhum alerta disponível. Adiciona um feed RSS para começar.')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Feeds Management & Help */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }} className="alerts-sidebar-container">
          
          <div className={t('admin_glass_sidebar_card', 'glass sidebar-card')}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{t('admin_os_teus_feeds', 'Os teus Feeds')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {feeds.map(feed => (
                <div key={feed.id} className="feed-card-item">
                  <div className="feed-card-info">
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feed.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feed.url}</div>
                  </div>
                  <button onClick={() => handleDeleteFeed(feed.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 5, opacity: 0.7, flexShrink: 0 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {feeds.length === 0 && <p style={{ fontSize: 13, opacity: 0.5, textAlign: 'center' }}>{t('admin_nenhum_feed_configurado', 'Nenhum feed configurado.')}</p>}
            </div>
          </div>

          <div className={t('admin_glass_sidebar_card', 'glass sidebar-card')} style={{ background: 'rgba(229, 9, 20, 0.03)', border: '1px solid rgba(229, 9, 20, 0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>{t('admin_como_configurar', 'Como configurar?')}</h3>
            <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li style={{ marginBottom: 8 }}>{t('admin_acede_a', 'Acede a')} <a href="https://www.google.com/alerts" target="_blank" rel="noopener" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>{t('admin_google_alerts', 'Google Alerts')}</a>.</li>
              <li style={{ marginBottom: 8 }}>{t('admin_escolhe_um_alerta_e_clica_no_icone_de_la', 'Escolhe um alerta e clica no ícone de lápis (editar).')}</li>
              <li style={{ marginBottom: 8 }}>{t('admin_em_enviar_para_seleciona', 'Em "Enviar para", seleciona')} <strong>{t('admin_feed_rss', 'Feed RSS')}</strong>.</li>
              <li style={{ marginBottom: 8 }}>{t('admin_clica_em_atualizar_alerta', 'Clica em "Atualizar Alerta".')}</li>
              <li>{t('admin_clica_no_icone_de_rss_que_aparece_ao_lad', 'Clica no ícone de RSS que aparece ao lado do alerta e copia o link aqui.')}</li>
            </ol>
          </div>

        </div>
      </div>

      {/* Add Feed Modal */}
      {showAddFeed && (
        <div className="modal-overlay">
          <div className={t('admin_glass_modal_container', 'glass modal-container')}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t('admin_novo_feed_rss', 'Novo Feed RSS')}</h2>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>{t('admin_nome_do_alerta', 'Nome do Alerta')}</label>
              <input 
                type="text" 
                value={newFeed.name}
                onChange={e => setNewFeed({...newFeed, name: e.target.value})}
                placeholder={t('admin_ex_antestreias_passatempos', 'Ex: Antestreias Passatempos')}
                style={{ width: '100%', padding: '12px 15px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>{t('admin_url_do_feed_rss', 'URL do Feed (RSS)')}</label>
              <input 
                type="text" 
                value={newFeed.url}
                onChange={e => setNewFeed({...newFeed, url: e.target.value})}
                placeholder="https://www.google.com/alerts/feeds/..."
                style={{ width: '100%', padding: '12px 15px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="modal-buttons" style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowAddFeed(false)} className="btn-secondary" style={{ flex: 1 }}>{t('btn_cancel', 'Cancelar')}</button>
              <button onClick={handleAddFeed} className="btn-primary" style={{ flex: 1 }}>{t('admin_adicionar', 'Adicionar')}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <style>{`
        .admin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .admin-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .admin-subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }
        .alerts-page-header-actions {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }
        .admin-grid {
          margin-top: 30px;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
        }
        .alerts-list-card {
          padding: 25px;
          border-radius: 20px;
        }
        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          gap: 15px;
        }
        .alerts-header-actions {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          align-items: center;
        }
        .alert-item-card {
          padding: 20px;
          border-radius: 12px;
          transition: 0.3s;
          position: relative;
        }
        .alert-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }
        .alert-title {
          flex: 1;
          min-width: 0;
          font-size: 16px;
          margin: 0;
          line-height: 1.4;
          word-break: break-word;
        }
        .alert-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .alert-actions button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s, transform 0.1s;
        }
        .alert-actions button:active {
          transform: scale(0.9);
        }
        .alert-actions button:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
        .alert-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .original-link {
          font-size: 13px;
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .sidebar-card {
          padding: 25px;
          border-radius: 20px;
        }
        .feed-card-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          gap: 12px;
        }
        .feed-card-info {
          flex: 1;
          min-width: 0;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-container {
          width: 100%;
          max-width: 450px;
          padding: 30px;
          border-radius: 20px;
        }
        .modal-buttons {
          display: flex;
          gap: 12px;
        }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .admin-header-row {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .admin-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 20px !important;
          }
          .alerts-list-card, .sidebar-card {
            padding: 20px;
            min-width: 0 !important;
          }
          .alerts-sidebar-container {
            min-width: 0 !important;
          }
        }

        @media (max-width: 768px) {
          .alerts-page-header-actions {
            width: 100%;
            flex-direction: column;
            gap: 10px;
          }
          .alerts-page-header-actions button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 600px) {
          .admin-title {
            font-size: 22px;
          }
          .admin-subtitle {
            font-size: 13px;
          }
          .alerts-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .alerts-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .alert-item-card {
            padding: 16px;
          }
        }

        @media (max-width: 480px) {
          .alerts-list-card, .sidebar-card {
            padding: 15px !important;
          }
          .alert-item-card {
            padding: 12px !important;
          }
          .alert-title-row {
            gap: 8px;
          }
          .alert-title {
            font-size: 15px;
          }
          .alert-actions {
            gap: 8px;
          }
          .alert-actions button {
            padding: 4px;
          }
          .alert-card-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .original-link {
            width: 100%;
            justify-content: flex-start;
          }
          .modal-container {
            padding: 20px !important;
          }
          .modal-buttons {
            flex-direction: column-reverse;
            gap: 10px;
          }
          .modal-buttons button {
            width: 100% !important;
            flex: none !important;
          }
        }
      `}</style>
    </div>
  );
}
