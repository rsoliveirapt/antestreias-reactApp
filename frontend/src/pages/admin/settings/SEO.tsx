import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../components/Toast';
import { ChevronRight, X, Globe, Plus, Trash2 } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

interface SEOSetting {
  id: number;
  page_type: string;
  page_label: string;
  title_template: string;
  description_template: string;
  raw_code: string;
}

export default function SEO() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SEOSetting[]>([]);
  const [selectedSetting, setSelectedSetting] = useState<SEOSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_seo.php`);
      const data = await res.json();
      setSettings(data);
      setLoading(false);
    } catch (err) {
      showToast(t('admin_erro_ao_carregar_definicoes_seo', 'Erro ao carregar definições SEO.'), 'error');
    }
  };

  const openEditor = (setting: SEOSetting) => {
    setSelectedSetting({ ...setting });
    setHasChanges(false);
    setView('edit');
  };

  const addSetting = () => {
    const newSetting: SEOSetting = {
      id: 0,
      page_type: 'new_page',
      page_label: t('admin_nova_pagina', 'Nova Página'),
      title_template: t('admin_title_site_name', '{title} - {site_name}'),
      description_template: t('admin_descricao_da_pagina', 'Descrição da página...'),
      raw_code: '<meta property="og:type" content="website" />'
    };
    setSelectedSetting(newSetting);
    setHasChanges(true);
    setView('edit');
    setActiveTab('basic');
  };

  const deleteSetting = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (id === 0) return;
    if (!confirm(t('admin_tem_a_certeza_que_deseja_remover_este_te', 'Tem a certeza que deseja remover este template SEO?'))) return;

    try {
      const res = await apiFetch(`${API_BASE}/admin_seo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_id: id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_template_seo_removido', 'Template SEO removido!'));
        fetchSettings();
        if (selectedSetting?.id === id) {
          setSelectedSetting(null);
          setView('list');
        }
      }
    } catch (err) {
      showToast(t('admin_erro_ao_remover_template_seo', 'Erro ao remover template SEO.'), 'error');
    }
  };

  const updateField = (field: keyof SEOSetting, value: string) => {
    if (!selectedSetting) return;
    setSelectedSetting({ ...selectedSetting, [field]: value });
    setHasChanges(true);
  };

  const getPreviewData = () => {
    if (!selectedSetting) return { title: '', desc: '' };

    let title = selectedSetting.title_template;
    let desc = selectedSetting.description_template;

    if (activeTab === 'advanced' && selectedSetting.raw_code) {
      // Try to extract title from <title> tag
      const titleMatch = selectedSetting.raw_code.match(/<title>(.*?)<\/title>/s);
      if (titleMatch) title = titleMatch[1];

      // Try to extract description from meta description tag
      const descMatch = selectedSetting.raw_code.match(/<meta name="description" content="(.*?)"/s) || 
                        selectedSetting.raw_code.match(/@php.*?\$seoDescription\s*=\s*(.*?);.*?@endphp/s);
      
      if (descMatch) {
        desc = descMatch[1].replace(/['"]/g, '').trim();
      }
    }

    const mockTitle = selectedSetting.page_label || t('admin_pagina', 'Página');

    // Clean up Blade/PHP tags and replace with mock data
    const process = (str: string) => {
      if (!str) return '';
      return str
        // Replace simple placeholders {tag}
        .replace(/\{title\}|\{name\}|\{channel_name\}|\{news_title\}/g, mockTitle)
        .replace(/\{year\}/g, '2024')
        .replace(/\{site_name\}/g, 'Antestreias')
        .replace(/\{season_number\}/g, '1')
        .replace(/\{episode_name\}/g, t('admin_episodio_1', 'Episódio 1'))
        .replace(/\{news_excerpt\}/g, '...')
        
        // Replace Blade/PHP placeholders {{ tag }}
        .replace(/\{\{.*?\}\}/g, (match) => {
          if (match.includes('$title->name') || match.includes('$name')) return mockTitle;
          if (match.includes('$title->year')) return '2024';
          if (match.includes('settings')) return 'Antestreias';
          return '';
        })
        .replace(/@if.*?@endif/gs, '')
        .replace(/@php.*?@endphp/gs, '')
        .replace(/<script.*?>.*?<\/script>/gs, '')
        .replace(/<.*?>/g, '')
        .trim();
    };

    return { 
      title: process(title) || mockTitle, 
      desc: process(desc) || '...'
    };
  };

  const preview = getPreviewData();

  const handleSave = async () => {
    if (!selectedSetting) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_seo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSetting)
      });
      
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new Error(text); }

      if (data.success) {
        showToast(t('admin_definicoes_seo_guardadas', 'Definições SEO guardadas!'));
        setHasChanges(false);
        fetchSettings();
      } else {
        throw new Error(data.error || t('admin_erro_ao_processar_pedido', 'Erro ao processar pedido'));
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(`${t('admin_erro_ao_guardar', 'Erro ao guardar')}: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_seo', 'A carregar SEO...')}</div>;

  return (
    <div className="menu-customizer-layout">
      {/* Sidebar Editor */}
      <div className="customizer-sidebar" style={{ width: 400 }}>
        <div className="customizer-header">
            <button className="icon-btn" title={t('admin_fechar', 'Fechar')} onClick={() => navigate('/admin/settings')}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t('admin_definicoes_seo', 'Definições SEO')}</h2>
            {view === 'edit' && (
              <button 
                className={`save-btn ${isSaving ? 'loading' : ''}`} 
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? '...' : (hasChanges ? t('admin_guardar', 'Guardar') : t('admin_guardado', 'Guardado'))}
              </button>
            )}
        </div>

        <div className="customizer-breadcrumb">
          {view === 'edit' && (
            <button className="back-btn" onClick={() => setView('list')}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <div style={{ flex: 1, paddingLeft: view === 'edit' ? 0 : 40 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('admin_a_personalizar', 'A personalizar')}</p>
            <h3 style={{ fontSize: 15, margin: 0, color: 'var(--accent)' }}>
              {view === 'edit' && selectedSetting ? selectedSetting.page_label : 'SEO'}
            </h3>
          </div>
        </div>

        {view === 'edit' && (
          <div className="customizer-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => setActiveTab('basic')}
              className={activeTab === 'basic' ? 'active' : ''}
              style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, borderBottom: activeTab === 'basic' ? '2px solid var(--accent)' : 'none', cursor: 'pointer' }}
            >
              {t('admin_basico', 'BÁSICO')}
            </button>
            <button 
              onClick={() => setActiveTab('advanced')}
              className={activeTab === 'advanced' ? 'active' : ''}
              style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, borderBottom: activeTab === 'advanced' ? '2px solid var(--accent)' : 'none', cursor: 'pointer' }}
            >
              {t('admin_codigo_raiz', 'CÓDIGO RAIZ')}
            </button>
          </div>
        )}

        <div className="customizer-content">
          {view === 'list' ? (
            <div className="menu-selection-list">
              {settings.map(setting => (
                <div 
                  key={setting.id} 
                  className={`menu-list-item ${selectedSetting?.id === setting.id ? 'active' : ''}`}
                  onClick={() => openEditor(setting)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{setting.page_label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="delete-menu-btn" 
                      onClick={(e) => deleteSetting(e, setting.id)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#666', 
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#666'}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}
              
              <button className="add-menu-custom-btn" onClick={addSetting} style={{ marginTop: 10 }}>
                <Plus size={16} />
                <span>{t('admin_novo_template_seo', 'Novo template SEO')}</span>
              </button>
            </div>
          ) : (
            <div className="menu-items-custom-editor" style={{ padding: 20 }}>
              {activeTab === 'basic' ? (
                <>
                  {selectedSetting?.id === 0 && (
                    <div className="field-group" style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{t('admin_identificador_slug', 'Identificador (Slug)')}</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder={t('admin_ex_my_page', 'ex: my_page')}
                        value={selectedSetting?.page_type || ''} 
                        onChange={e => updateField('page_type', e.target.value)}
                      />
                    </div>
                  )}
                  <div className="field-group" style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{t('admin_etiqueta', 'Etiqueta')}</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={selectedSetting?.page_label || ''} 
                      onChange={e => updateField('page_label', e.target.value)}
                    />
                  </div>

                  <div className="field-group" style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{t('admin_template_do_titulo', 'Template do Título')}</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={selectedSetting?.title_template || ''} 
                      onChange={e => updateField('title_template', e.target.value)}
                    />
                    <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{t('admin_tags_disponiveis', 'Tags disponíveis:')} {'{title}'}, {'{year}'}, {'{site_name}'}, {'{name}'}</p>
                  </div>

                  <div className="field-group">
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{t('admin_template_da_descricao', 'Template da Descrição')}</label>
                    <textarea 
                      rows={4}
                      className="form-input"
                      value={selectedSetting?.description_template || ''} 
                      onChange={e => updateField('description_template', e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              ) : (
                <div className="field-group">
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{t('admin_codigo_html_meta_tags', 'Código HTML / Meta Tags')}</label>
                  <textarea 
                    rows={20}
                    value={selectedSetting?.raw_code || ''} 
                    onChange={e => updateField('raw_code', e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, resize: 'vertical' }}
                  />
                  <p style={{ fontSize: 11, color: '#666', marginTop: 10 }}>{t('admin_pode_adicionar_qualquer_codigo_html_q', 'Pode adicionar qualquer código HTML que será inserido na tag <head> desta página.')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Preview Area */}
      <div className="customizer-preview">
        <div className="preview-toolbar">
          <div className="preview-url">
            <Globe size={14} />
            <span>google.com/search?q={selectedSetting?.page_label.toLowerCase().replace(/ /g, '-')}</span>
          </div>
        </div>
        
        <div className="preview-container" style={{ justifyContent: 'center', alignItems: 'center', padding: 60 }}>
           {/* Mock Google Search Result */}
           <div className="mock-google-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div className="mock-google-icon-wrapper">
                   <Film size={14} />
                </div>
                <div>
                  <div className="mock-google-url">antestreias.com › {selectedSetting?.page_type}</div>
                  <div className="mock-google-title">
                    {preview.title}
                  </div>
                </div>
              </div>
              <div className="mock-google-snippet">
                <span className="mock-google-date">{t('admin_14_de_nov_de_2014', '14 de nov. de 2014 —')}</span>
                {preview.desc}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function Film({ size, color, ...props }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color || "currentColor"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18" /><path d="M17 3v18" /><path d="M3 7h4" /><path d="M3 12h4" /><path d="M3 17h4" /><path d="M17 7h4" /><path d="M17 12h4" /><path d="M17 17h4" />
    </svg>
  );
}
