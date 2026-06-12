import { useState, useEffect } from 'react';
import { RefreshCw, Pencil, Power, Trash2, ExternalLink, Settings, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE, apiFetch } from '../../config';
import ConfirmModal from '../../components/ConfirmModal';
import { showToast } from '../../components/Toast';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useTranslation } from '../../context/LanguageContext';

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  source: string;
  source_url: string;
  status: string;
  created_at: string;
  image: string;
  body?: string;
  byline?: string;
}

export default function AdminNews() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_news.php`);
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      console.error(t('admin_failed_to_fetch_news', 'Failed to fetch news'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await apiFetch(`${API_BASE}/news_import.php`, { method: 'POST' });
      const data = await res.json();
      showToast(`Sucesso! Importadas ${data.imported} novas notícias.`, 'success');
      fetchArticles();
    } catch (err) {
      showToast('Erro ao importar notícias.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleStatusToggle = async (article: NewsArticle) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await apiFetch(`${API_BASE}/admin_news.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, status: newStatus })
      });
      setArticles(articles.map(a => a.id === article.id ? { ...a, status: newStatus } : a));
      showToast(`Notícia ${newStatus === 'published' ? 'publicada' : t('admin_movida_para_rascunho', 'movida para rascunho')}.`);
    } catch (err) {
      showToast('Erro ao atualizar estado.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    try {
      await apiFetch(`${API_BASE}/admin_news.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingArticle)
      });
      setArticles(articles.map(a => a.id === editingArticle.id ? editingArticle : a));
      setEditingArticle(null);
      showToast(t('admin_noticia_atualizada_com_sucesso', 'Notícia atualizada com sucesso.'));
    } catch (err) {
      showToast('Erro ao atualizar notícia.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`${API_BASE}/admin_news.php?id=${deleteId}`, { method: 'DELETE' });
      setArticles(articles.filter(a => a.id !== deleteId));
      setDeleteId(null);
      showToast(t('admin_noticia_apagada_com_sucesso', 'Notícia apagada com sucesso.'));
    } catch (err) {
      showToast('Erro ao apagar notícia.', 'error');
    }
  };

  if (loading && articles.length === 0) return <div className="admin-page">{t('admin_a_carregar', 'A carregar...')}</div>;

  return (
    <div className="admin-page">
      <AdminPageHeader 
        title={t('nav_news', 'Notícias')}
        subtitle={t('admin_gerir_e_importar_noticias_automaticas_do', 'Gerir e importar notícias automáticas do catálogo.')}
        actions={
          <>
            <Link to="/admin/news/sources" className="btn-secondary">
              <Settings size={18} /> {t('admin_fontes', 'Fontes')}
            </Link>
            <button 
              className="btn-primary" 
              onClick={handleImport} 
              disabled={importing}
            >
              <RefreshCw size={18} className={importing ? 'spin' : ''} />
              {importing ? t('admin_a_importar', 'A importar...') : t('admin_importar_noticias', 'Importar Notícias')}
            </button>
          </>
        }
      />

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner"></div></div>
        ) : isMobile ? (
          <div className="news-cards-container">
            {articles.map(article => (
              <div key={article.id} className={`news-card ${article.status === 'draft' ? 'draft-mode' : ''}`}>
                <div className="news-card-header">
                  <div className="news-card-image-wrapper">
                    {article.image ? (
                      <img src={article.image} alt="" className="news-card-image" />
                    ) : (
                      <div className="news-card-image-placeholder" />
                    )}
                  </div>
                  <div className="news-card-info">
                    <div className="news-card-title">{article.title}</div>
                    <div className="news-card-slug">{article.slug}</div>
                  </div>
                </div>

                <div className="news-card-meta">
                  <div className="news-card-meta-item">
                    <span className="meta-label">{t('admin_fonte', 'Fonte:')}</span>
                    <span className="meta-value">
                      {article.source}
                      {article.source_url && (
                        <a href={article.source_url} target="_blank" rel="noreferrer" className="news-source-link">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </span>
                  </div>
                  <div className="news-card-meta-item">
                    <span className="meta-label">{t('admin_data', 'Data:')}</span>
                    <span className="meta-value">{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="news-card-meta-item">
                    <span className="meta-label">{t('admin_estado', 'Estado:')}</span>
                    <span className={`badge ${article.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {article.status === 'published' ? t('admin_publicado', 'Publicado') : t('admin_rascunho', 'Rascunho')}
                    </span>
                  </div>
                </div>

                <div className="news-card-actions">
                  <button
                    className="action-btn"
                    onClick={async () => {
                      try {
                        const res = await apiFetch(`${API_BASE}/news_refresh.php?id=${article.id}`, { method: 'POST' });
                        const data = await res.json();
                        if (data.success) {
                          showToast(t('admin_conteudo_atualizado_com_sucesso', 'Conteúdo atualizado com sucesso.'));
                          fetchArticles();
                        } else {
                          showToast(data.error || t('admin_erro_ao_atualizar', 'Erro ao atualizar.'), 'error');
                        }
                      } catch (err) {
                        showToast('Erro de rede.', 'error');
                      }
                    }}
                    title={t('admin_atualizar_conteudo', 'Atualizar Conteúdo')}
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleStatusToggle(article)}
                    title={article.status === 'published' ? t('admin_mover_para_rascunho', 'Mover para Rascunho') : t('admin_publicar', 'Publicar')}
                  >
                    <Power size={18} />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setEditingArticle(article)}
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => setDeleteId(article.id)}
                    title="Apagar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin_imagem', 'Imagem')}</th>
                <th>{t('admin_titulo', 'Título')}</th>
                <th>{t('admin_fonte', 'Fonte')}</th>
                <th>{t('admin_data', 'Data')}</th>
                <th>{t('admin_estado', 'Estado')}</th>
                <th style={{ textAlign: 'right' }}>{t('admin_acoes', 'Ações')}</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} className={article.status === 'draft' ? 'opacity-60' : ''}>
                  <td style={{ width: 80 }}>
                    <div style={{ width: 60, height: 40, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                      {article.image && <img src={article.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  </td>
                  <td style={{ maxWidth: 400 }}>
                    <div style={{ fontWeight: 600 }}>{article.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{article.slug}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {article.source}
                      {article.source_url && (
                        <a href={article.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{new Date(article.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${article.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {article.status === 'published' ? t('admin_publicado', 'Publicado') : t('admin_rascunho', 'Rascunho')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        className="action-btn"
                        onClick={async () => {
                          try {
                            const res = await apiFetch(`${API_BASE}/news_refresh.php?id=${article.id}`, { method: 'POST' });
                            const data = await res.json();
                            if (data.success) {
                              showToast(t('admin_conteudo_atualizado_com_sucesso', 'Conteúdo atualizado com sucesso.'));
                              fetchArticles();
                            } else {
                              showToast(data.error || t('admin_erro_ao_atualizar', 'Erro ao atualizar.'), 'error');
                            }
                          } catch (err) {
                            showToast('Erro de rede.', 'error');
                          }
                        }}
                        title={t('admin_atualizar_conteudo', 'Atualizar Conteúdo')}
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleStatusToggle(article)}
                        title={article.status === 'published' ? t('admin_mover_para_rascunho', 'Mover para Rascunho') : t('admin_publicar', 'Publicar')}
                      >
                        <Power size={18} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => setEditingArticle(article)}
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteId(article.id)}
                        title="Apagar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={t('admin_apagar_noticia', 'Apagar Notícia')}
          message={t('admin_tens_a_certeza_que_pretendes_apagar_esta', 'Tens a certeza que pretendes apagar esta notícia? Esta ação não pode ser revertida.')}
        />
      )}

      {editingArticle && (
        <div className="custom-modal-overlay" onClick={() => setEditingArticle(null)}>
          <div className="custom-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Pencil size={20} className="accent-text" />
                {t('admin_editar_noticia', 'Editar Notícia')}
              </h3>
              <button className="close-btn" onClick={() => setEditingArticle(null)}><ArrowLeft size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_titulo', 'Título')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingArticle.title}
                    onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_url_da_imagem', 'URL da Imagem')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingArticle.image}
                    onChange={e => setEditingArticle({ ...editingArticle, image: e.target.value })}
                  />
                  {editingArticle.image && (
                    <img src={editingArticle.image} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 5 }} />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_fonte', 'Fonte')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingArticle.source}
                      onChange={e => setEditingArticle({ ...editingArticle, source: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin_estado', 'Estado')}</label>
                    <select
                      className="form-input"
                      value={editingArticle.status}
                      onChange={e => setEditingArticle({ ...editingArticle, status: e.target.value })}
                    >
                      <option value="published">{t('admin_publicado', 'Publicado')}</option>
                      <option value="draft">{t('admin_rascunho', 'Rascunho')}</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                  <button type="button" className="btn-secondary" onClick={() => setEditingArticle(null)}>
                    {t('btn_cancel', 'Cancelar')}
                  </button>
                  <button type="submit" className="btn-primary">
                    <Save size={18} /> {t('admin_guardar_alteracoes', 'Guardar Alterações')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .news-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
          padding: 16px;
        }

        .news-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .news-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .news-card.draft-mode {
          opacity: 0.6;
        }

        .news-card-header {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .news-card-image-wrapper {
          width: 80px;
          height: 54px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .news-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .news-card-image-placeholder {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.05);
        }

        .news-card-info {
          flex: 1;
          min-width: 0;
        }

        .news-card-title {
          font-weight: 700;
          font-size: 15px;
          line-height: 1.4;
          color: white;
          margin-bottom: 4px;
          word-break: break-word;
        }

        .news-card-slug {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .news-card-meta {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.02);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .news-card-meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .meta-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .meta-value {
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .news-source-link {
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          transition: transform 0.2s;
        }

        .news-source-link:hover {
          transform: scale(1.1);
        }

        .news-card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid var(--glass-border);
          padding-top: 12px;
        }
      `}} />
    </div>
  );
}
