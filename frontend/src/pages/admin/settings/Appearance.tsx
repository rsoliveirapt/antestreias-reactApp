import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Image as ImageIcon, RotateCcw, Save, Upload, CloudUpload } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function Appearance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ label: string, key: string } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryTargetKey, setGalleryTargetKey] = useState<string | null>(null);

  const openGallery = async (key: string) => {
    setGalleryTargetKey(key);
    setIsGalleryOpen(true);
    setGalleryLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_files.php`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGalleryImages(data.filter(f => f.type === 'Image' || (f.name && f.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))));
      }
    } catch (err) {
      console.error('Error loading files:', err);
      showToast('Erro ao carregar imagens', 'error');
    }
    setGalleryLoading(false);
  };
  
  const [settings, setSettings] = useState({
    'general.site_name': '',
    'general.site_description': '',
    'general.site_description_en': '',
    'appearance.favicon': '',
    'appearance.logo_light': '',
    'appearance.logo_dark': '',
    'appearance.logo_mobile_light': '',
    'appearance.logo_mobile_dark': '',
    'mail.contest_participation_template': '',
  });

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_appearance.php`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_appearance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_definicoes_de_aparencia_guardadas', 'Definições de aparência guardadas!'));
        setHasChanges(false);
      }
    } catch (err) {
      showToast('Erro ao guardar definições.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-primary)' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  const isLightTheme = document.documentElement.classList.contains('theme-light');
  const previewLogo = isLightTheme ? (settings['appearance.logo_dark'] || settings['appearance.logo_light']) : settings['appearance.logo_light'];

  return (
    <div className="menu-customizer-layout">
      {/* Sidebar Editor */}
      <div className="customizer-sidebar">
        <div className="customizer-header">
           <button className="icon-btn" onClick={() => navigate('/admin/settings')}>
             <X size={20} />
           </button>
           <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t('admin_editor_de_aparencia', 'Editor de aparência')}</h2>
           <button 
             className={`save-btn ${isSaving ? 'loading' : ''}`} 
             onClick={handleSave}
             disabled={isSaving || !hasChanges}
           >
             {isSaving ? '...' : (hasChanges ? 'Guardar' : 'Guardado')}
           </button>
        </div>

        <div className="customizer-breadcrumb">
          <button className="back-btn" onClick={() => navigate('/admin/settings')}>
             <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('admin_a_personalizar', 'A personalizar')}</p>
            <h3 style={{ fontSize: 15, margin: 0, color: 'var(--accent)' }}>{t('perm_group_geral', 'Geral')}</h3>
          </div>
        </div>

        <div className="customizer-content" style={{ padding: '20px 24px' }}>
          <ImageSection 
            label="Favicon" 
            description={t('admin_isto_ira_gerar_favicons_de_diferentes_ta', 'Isto irá gerar favicons de diferentes tamanhos. A imagem deve ter pelo menos 512x512 pixels.')}
            value={settings['appearance.favicon']}
            onChange={(val) => handleChange('appearance.favicon', val)}
            onReplace={() => setUploadTarget({ label: 'Favicon', key: 'appearance.favicon' })}
            onSelectFromGallery={() => openGallery('appearance.favicon')}
          />

          <ImageSection 
            label={t('admin_logotipo_claro', 'Logotipo claro')} 
            description={t('admin_sera_utilizado_em_fundos_escuros', 'Será utilizado em fundos escuros.')}
            value={settings['appearance.logo_light']}
            onChange={(val) => handleChange('appearance.logo_light', val)}
            onReplace={() => setUploadTarget({ label: t('admin_logotipo_claro', 'Logotipo claro'), key: 'appearance.logo_light' })}
            onSelectFromGallery={() => openGallery('appearance.logo_light')}
            showReset
          />

          <ImageSection 
            label={t('admin_logotipo_escuro', 'Logotipo escuro')} 
            description={t('admin_sera_utilizado_em_fundos_claros_se_ficar', 'Será utilizado em fundos claros. Se ficar vazio, será usado por defeito o logótipo claro.')}
            value={settings['appearance.logo_dark']}
            onChange={(val) => handleChange('appearance.logo_dark', val)}
            onReplace={() => setUploadTarget({ label: t('admin_logotipo_escuro', 'Logotipo escuro'), key: 'appearance.logo_dark' })}
            onSelectFromGallery={() => openGallery('appearance.logo_dark')}
            showReset
          />

          <ImageSection 
            label={t('admin_logotipo_claro_para_dispositivos_moveis', 'Logotipo claro para dispositivos móveis')} 
            description={t('admin_sera_utilizado_em_fundos_claros_em_dispo', 'Será utilizado em fundos claros em dispositivos móveis. Se ficar vazio, será usado por defeito o logótipo de desktop.')}
            value={settings['appearance.logo_mobile_light']}
            onChange={(val) => handleChange('appearance.logo_mobile_light', val)}
            onReplace={() => setUploadTarget({ label: t('admin_logotipo_mobile_claro', 'Logotipo mobile claro'), key: 'appearance.logo_mobile_light' })}
            onSelectFromGallery={() => openGallery('appearance.logo_mobile_light')}
          />

          <ImageSection 
            label={t('admin_logotipo_escuro_para_dispositivos_moveis', 'Logotipo escuro para dispositivos móveis')} 
            description={t('admin_sera_utilizado_em_fundos_escuros_em_disp', 'Será utilizado em fundos escuros em dispositivos móveis. Se ficar vazio, será usado por defeito o logótipo de desktop.')}
            value={settings['appearance.logo_mobile_dark']}
            onChange={(val) => handleChange('appearance.logo_mobile_dark', val)}
            onReplace={() => setUploadTarget({ label: t('admin_logotipo_mobile_escuro', 'Logotipo mobile escuro'), key: 'appearance.logo_mobile_dark' })}
            onSelectFromGallery={() => openGallery('appearance.logo_mobile_dark')}
          />

          <div className="field-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_nome_do_site', 'Nome do site')}</label>
            <input 
              type="text" 
              className="form-input"
              value={settings['general.site_name']}
              onChange={e => handleChange('general.site_name', e.target.value)}
            />
          </div>

          <div className="field-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_descricao_do_site', 'Descrição do site')}</label>
            <textarea 
              className="form-input"
              value={settings['general.site_description']}
              onChange={e => handleChange('general.site_description', e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="field-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_descricao_do_site_ingles', 'Descrição do site (Inglês)')}</label>
            <textarea 
              className="form-input"
              value={settings['general.site_description_en']}
              onChange={e => handleChange('general.site_description_en', e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {uploadTarget && (
        <UploadModal 
          title={uploadTarget.label} 
          onClose={() => setUploadTarget(null)} 
          onUpload={(url) => {
            handleChange(uploadTarget.key, url);
            setUploadTarget(null);
          }} 
        />
      )}

      {isGalleryOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal" style={{ maxWidth: 600, width: '90%', maxHeight: '80vh' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{t('admin_galeria_de_imagens', 'Galeria de Imagens')}</h3>
              <button className="close-btn" onClick={() => setIsGalleryOpen(false)}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {galleryLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>{t('admin_carregando_imagens', 'Carregando imagens...')}</div>
              ) : galleryImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>{t('admin_nenhuma_imagem_carregada', 'Nenhuma imagem carregada.')}</div>
              ) : (
                <div className="gallery-grid">
                  {galleryImages.map(img => (
                    <div 
                      key={img.id}
                      onClick={() => {
                        if (galleryTargetKey) {
                          handleChange(galleryTargetKey, img.url);
                        }
                        setIsGalleryOpen(false);
                      }}
                      className="gallery-item"
                      title={img.name}
                    >
                      <img src={img.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="customizer-preview">
        <div className="preview-container">
          <div className="preview-browser-header">
            <div className="browser-dots">
              <span></span><span></span><span></span>
            </div>
            <div className="browser-address">
              {settings['general.site_name']} - Preview
            </div>
          </div>
          
          <div className="preview-frame-content">
             <div className="mock-navbar-live">
               <div className="mock-logo-live">
                 {previewLogo ? (
                   <img src={previewLogo} alt="Logo" style={{ maxHeight: 30 }} />
                 ) : (
                   <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 4 }}></div>
                 )}
               </div>
               <div className="mock-links-live">
                 <span>{t('nav_movies', 'Filmes')}</span>
                 <span>{t('nav_series', 'Séries')}</span>
                 <span>{t('admin_listas', 'Listas')}</span>
               </div>
             </div>

             <div className="mock-hero-live">
                <h1 style={{ fontSize: 32, marginBottom: 10 }}>{settings['general.site_name']}</h1>
                <p style={{ maxWidth: 500 }}>{settings['general.site_description'] || t('admin_o_melhor_do_cinema_esta_aqui', 'O melhor do cinema está aqui.')}</p>
             </div>

             <div className="mock-grid-live">
                {[1,2,3].map(i => <div key={i} className="mock-card-live"></div>)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageSection({ label, description, value, onChange, showReset = false, onReplace, onSelectFromGallery }: { label: string, description: string, value: string, onChange: (val: string) => void, showReset?: boolean, onReplace: () => void, onSelectFromGallery: () => void }) {
  const { t } = useTranslation();
  return (
    <div style={{ marginBottom: 32 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{label}</h4>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>{description}</p>
      
      <div className="image-preview-container">
        {value ? (
          <img src={value} alt={label} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
        ) : (
          <ImageIcon size={32} color="var(--text-secondary)" style={{ opacity: 0.2 }} />
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button 
          className="btn-secondary" 
          onClick={onReplace}
          style={{ padding: '8px 16px', fontSize: 12 }}
        >
          {t('admin_substituir', 'Substituir')}
        </button>
        <button 
          className="btn-secondary" 
          onClick={onSelectFromGallery}
          style={{ padding: '8px 16px', fontSize: 12 }}
        >
          {t('admin_procurar_na_galeria', 'Procurar na galeria')}
        </button>
        {showReset && (
          <button 
            className="btn-secondary" 
            onClick={() => onChange('')}
            style={{ padding: '8px 16px', fontSize: 12, opacity: 0.7 }}
          >
            {t('admin_usar_predefinicao', 'Usar predefinição')}
          </button>
        )}
      </div>
      
      <div style={{ marginTop: 20, height: 1, background: 'var(--glass-border)', opacity: 0.5 }}></div>
    </div>
  );
}

function UploadModal({ title, onClose, onUpload }: { title: string, onClose: () => void, onUpload: (url: string) => void }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (selectedFile: File) => {
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch(`${API_BASE}/upload.php`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        onUpload(data.url);
        showToast(t('admin_upload_concluido', 'Upload concluído!'));
      } else {
        showToast(data.error || t('admin_erro_no_upload', 'Erro no upload'), 'error');
      }
    } catch (err) {
      showToast(t('admin_erro_de_conexao', 'Erro de ligação'), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal" style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3>{t('admin_substituir', 'Substituir')} {title}</h3>
          <button className="close-btn" onClick={onClose} disabled={uploading}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            style={{ 
              border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--glass-border)'}`,
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
              background: dragActive ? 'rgba(229, 9, 21, 0.05)' : 'rgba(255,255,255,0.01)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              id="fileInput" 
              type="file" 
              hidden 
              accept="image/*" 
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} 
            />
            
            {preview ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={preview} alt="Preview" style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 8, marginBottom: 15 }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{file?.name}</span>
              </div>
            ) : (
              <>
                <CloudUpload size={48} color="var(--accent)" style={{ marginBottom: 15, opacity: 0.8 }} />
                <h4 style={{ marginBottom: 8 }}>{t('admin_arrasta_ou_clica_para_carregar', 'Arrasta ou clica para carregar')}</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('admin_png_jpg_svg_ou_ico_max_5mb', 'PNG, JPG, SVG ou ICO (Máx. 5MB)')}</p>
              </>
            )}
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>{t('btn_cancel', 'Cancelar')}</button>
          <button 
            className="save-btn" 
            onClick={handleUpload} 
            disabled={!file || uploading}
            style={{ padding: '10px 24px', minWidth: 120 }}
          >
            {uploading ? t('admin_a_enviar', 'A enviar...') : t('admin_confirmar', 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
