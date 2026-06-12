import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link2, Image, MoreHorizontal, Type, RotateCcw, RotateCw, Code, Quote, Highlighter, Pencil } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminPageEditor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [owner, setOwner] = useState('');
  const [type, setType] = useState(t('admin_institucional', 'Institucional'));
  const [content, setContent] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [activeTab, setActiveTab] = useState<'pt' | 'en'>('pt');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew && user) {
      setOwner(user.username || 'Admin');
    }
    if (!isNew) {
      fetchPage();
    }
  }, [id, isNew, user]);

  const fetchPage = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_pages.php?id=${id}`);
      const data = await res.json();
      setTitle(data.title || '');
      setTitleEn(data.title_en || '');
      setSlug(data.slug || '');
      setOwner(data.owner || 'default');
      setType(data.type || t('admin_institucional', 'Institucional'));
      setContent(data.content || '');
      setContentEn(data.content_en || '');
    } catch (err) {
      showToast('Erro ao carregar página.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const body = JSON.stringify({
        id,
        title,
        title_en: titleEn,
        slug,
        owner,
        type,
        content,
        content_en: contentEn
      });
      await apiFetch(`${API_BASE}/admin_pages.php`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });
      showToast(t('admin_pagina_guardada_com_sucesso', 'Página guardada com sucesso!'));
      if (isNew) navigate('/admin/pages');
    } catch (err) {
      showToast('Erro ao guardar página.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-primary)' }}>{t('admin_a_carregar_editor', 'A carregar editor...')}</div>;

  return (
    <div className="page-editor-container" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      {/* Editor Toolbar */}
      <div className="editor-toolbar" style={{ padding: '10px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button onClick={() => navigate('/admin/pages')} className="action-btn" title="Voltar" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={18} /> Voltar
          </button>
          
          <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>
             <select className="form-input" style={{ width: 100, padding: '4px 8px', fontSize: 12, background: 'transparent' }}>
                <option>{t('admin_formato', 'Formato')}</option>
                <option>{t('admin_titulo_1', 'Título 1')}</option>
                <option>{t('admin_titulo_2', 'Título 2')}</option>
                <option>{t('admin_paragrafo', 'Parágrafo')}</option>
             </select>
          </div>

          <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="toolbar-btn active"><Bold size={16} /></button>
            <button className="toolbar-btn"><Italic size={16} /></button>
            <button className="toolbar-btn"><Underline size={16} /></button>
          </div>

          <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>
            <button className="toolbar-btn"><AlignLeft size={16} color="red" /></button>
            <button className="toolbar-btn"><AlignCenter size={16} /></button>
            <button className="toolbar-btn"><AlignRight size={16} /></button>
          </div>

          <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="toolbar-btn"><List size={16} /></button>
            <button className="toolbar-btn"><ListOrdered size={16} /></button>
            <button className="toolbar-btn"><Link2 size={16} /></button>
            <button className="toolbar-btn"><Image size={16} /></button>
            <button className="toolbar-btn"><MoreHorizontal size={16} /></button>
          </div>

          <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderLeft: '1px solid var(--glass-border)' }}>
             <button className="toolbar-btn"><Type size={16} /></button>
             <button className="toolbar-btn"><Highlighter size={16} /></button>
             <button className="toolbar-btn"><Code size={16} /></button>
             <button className="toolbar-btn"><Quote size={16} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="toolbar-btn"><RotateCcw size={16} /></button>
            <button className="toolbar-btn"><RotateCw size={16} /></button>
          </div>
          <button className="action-btn" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Code size={16} /> Fonte
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={saving}
            style={{ 
              background: saving ? '#333' : 'var(--accent)', 
              color: 'white', 
              border: 'none', 
              padding: '8px 24px', 
              borderRadius: 6, 
              fontWeight: 700, 
              fontSize: 14,
              boxShadow: saving ? 'none' : '0 0 20px rgba(229, 9, 20, 0.3)',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {saving ? t('admin_a_guardar', 'A guardar...') : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="editor-content" style={{ flex: 1, padding: '40px 10%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 800 }}>
          {/* Language Switcher Tabs */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 30, borderBottom: '1px solid var(--glass-border)', paddingBottom: 15 }}>
            <button
              onClick={() => setActiveTab('pt')}
              style={{
                background: activeTab === 'pt' ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
                color: activeTab === 'pt' ? 'var(--accent)' : 'var(--text-secondary)',
                border: '1px solid ' + (activeTab === 'pt' ? 'var(--accent)' : 'var(--glass-border)'),
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: t('admin_all_0_2s_ease', 'all 0.2s ease'),
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {t('admin_portugues_pt', '🇵🇹 Português (PT)')}
            </button>
            <button
              onClick={() => setActiveTab('en')}
              style={{
                background: activeTab === 'en' ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
                color: activeTab === 'en' ? 'var(--accent)' : 'var(--text-secondary)',
                border: '1px solid ' + (activeTab === 'en' ? 'var(--accent)' : 'var(--glass-border)'),
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: t('admin_all_0_2s_ease', 'all 0.2s ease'),
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {t('admin_english_en', '🇬🇧 English (EN)')}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15, gap: 15 }}>
            <input 
              type="text" 
              placeholder={activeTab === 'pt' ? t('admin_titulo_em_portugues', 'Título em Português') : t('admin_title_in_english', 'Title in English')} 
              value={activeTab === 'pt' ? title : titleEn}
              onChange={(e) => activeTab === 'pt' ? setTitle(e.target.value) : setTitleEn(e.target.value)}
              style={{ background: 'transparent', border: 'none', borderBottom: '2px solid transparent', fontSize: 42, fontWeight: 900, color: 'var(--text-primary)', textAlign: 'center', width: '100%', outline: 'none', letterSpacing: '-0.02em' }}
            />
            <Pencil size={24} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40, gap: 15, flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('admin_url_slug', 'URL (Slug):')}</span>
                   <input 
                    type="text" 
                    placeholder="exemplo-url" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-'))}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '6px 12px', fontSize: 13, color: 'var(--text-primary)', borderRadius: 4, width: 200, outline: 'none' }}
                  />
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('admin_proprietario', 'Proprietário:')}</span>
                  <input 
                    type="text" 
                    placeholder={t('admin_autor_da_pagina', 'Autor da página')} 
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '6px 12px', fontSize: 13, color: 'var(--text-primary)', borderRadius: 4, width: 150, outline: 'none' }}
                  />
             </div>
 
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('admin_tipo', 'Tipo:')}</span>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="form-input"
                    style={{ padding: '6px 12px', fontSize: 13, width: 140 }}
                  >
                     <option value={t('admin_institucional', 'Institucional')}>{t('admin_institucional', 'Institucional')}</option>
                     <option value={t('admin_juridico', 'Jurídico')}>{t('admin_juridico', 'Jurídico')}</option>
                     <option value={t('admin_artigo', 'Artigo')}>{t('admin_artigo', 'Artigo')}</option>
                     <option value={t('admin_campanha', 'Campanha')}>{t('admin_campanha', 'Campanha')}</option>
                  </select>
             </div>
          </div>
 
          <textarea 
            placeholder={activeTab === 'pt' ? t('admin_comece_a_escrever_o_conteudo_da_pagina_em_portugue', 'Comece a escrever o conteúdo da página em Português...') : t('admin_start_writing_the_page_content_in_english', 'Start writing the page content in English...')}
            value={activeTab === 'pt' ? content : contentEn}
            onChange={(e) => activeTab === 'pt' ? setContent(e.target.value) : setContentEn(e.target.value)}
            style={{ width: '100%', minHeight: 400, background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 18, lineHeight: '1.8', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <style>{`
        .toolbar-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .toolbar-btn:hover {
          background: rgba(120, 120, 120, 0.1);
          color: var(--text-primary);
        }
        .toolbar-btn.active {
          background: rgba(120, 120, 120, 0.15);
          color: var(--accent);
        }
        .action-btn {
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: 0.2s;
        }
        .action-btn:hover {
          background: rgba(120, 120, 120, 0.1);
        }
      `}</style>
    </div>
  );
}
