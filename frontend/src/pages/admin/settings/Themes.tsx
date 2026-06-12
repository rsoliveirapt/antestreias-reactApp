import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../components/Toast';
import { ChevronRight, X, Droplets, Type, Square, Palette, Moon, Sun, Trash2, Plus, Check } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

interface Theme {
  id: number;
  name: string;
  font_family: string;
  border_radius_buttons: string;
  border_radius_inputs: string;
  border_radius_panels: string;
  color_navbar: string;
  color_background: string;
  color_background_alt: string;
  color_foreground: string;
  color_accent_light: string;
  color_accent: string;
  color_accent_dark: string;
  color_text_on_accent: string;
  color_chip: string;
  is_active: number;
}

const FONTS = [
  { name: 'Sistema', family: 'system-ui, -apple-system, sans-serif' },
  { name: 'Impact', family: 'Impact, Charcoal, sans-serif' },
  { name: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive, sans-serif' },
  { name: 'Century Gothic', family: 'Century Gothic, sans-serif' },
  { name: 'Courier New', family: 'Courier New, Courier, monospace' },
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif' },
  { name: 'Outfit', family: 'Outfit, sans-serif' },
];

const RADIUS_MAP: Record<string, string> = {
  'Quadrado': '0px',
  'Pequeno': '4px',
  'Médio': '8px',
  'Grande': '12px',
  'Maior': '20px',
  'Pílula': '9999px'
};

export default function Themes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [subView, setSubView] = useState<'main' | 'font' | 'radius'>('main');

  const RADIUS_OPTIONS = [
    { value: 'Quadrado', label: t('admin_quadrado', 'Quadrado') },
    { value: 'Pequeno', label: t('admin_pequeno', 'Pequeno') },
    { value: 'Médio', label: t('admin_medio', 'Médio') },
    { value: 'Grande', label: t('admin_grande', 'Grande') },
    { value: 'Maior', label: t('admin_maior', 'Maior') },
    { value: 'Pílula', label: t('admin_pilula', 'Pílula') }
  ];

  const fetchThemes = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_themes.php`);
      const data = await res.json();
      setThemes(data);
      
      // Auto-select active theme for preview if none selected
      if (!selectedTheme) {
        const active = data.find((t: Theme) => t.is_active === 1);
        if (active) setSelectedTheme(active);
      }
      
      setLoading(false);
    } catch (err) {
      showToast(t('admin_erro_ao_carregar_temas', 'Erro ao carregar temas.'), 'error');
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const openEditor = (theme: Theme) => {
    setSelectedTheme({ ...theme });
    setHasChanges(false);
    setView('edit');
    setSubView('main');
  };

  const updateField = (field: keyof Theme, value: any) => {
    if (!selectedTheme) return;
    setSelectedTheme({ ...selectedTheme, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedTheme) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_themes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTheme)
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_tema_guardado_com_sucesso', 'Tema guardado com sucesso!'));
        setHasChanges(false);
        fetchThemes();
        if (selectedTheme.is_active === 1) {
          window.dispatchEvent(new CustomEvent('refreshTheme'));
        }
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_tema', 'Erro ao guardar tema.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const activateTheme = async (id: number) => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_themes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_tema_ativado', 'Tema ativado!'));
        const activated = themes.find(t => t.id === id);
        if (activated) setSelectedTheme(activated);
        fetchThemes();
        // Trigger global theme refresh
        window.dispatchEvent(new CustomEvent('refreshTheme'));
      }
    } catch (err) {
      showToast(t('admin_erro_ao_ativar_tema', 'Erro ao ativar tema.'), 'error');
    }
  };

  const deleteTheme = async (id: number) => {
    if (!confirm(t('admin_tem_a_certeza_que_deseja_eliminar_este_t', 'Tem a certeza que deseja eliminar este tema?'))) return;
    try {
      const res = await apiFetch(`${API_BASE}/admin_themes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_id: id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_tema_eliminado', 'Tema eliminado!'));
        fetchThemes();
        if (selectedTheme?.id === id) setView('list');
      }
    } catch (err) {
      showToast(t('admin_erro_ao_eliminar_tema', 'Erro ao eliminar tema.'), 'error');
    }
  };

  const addNewTheme = () => {
    const newTheme: Theme = {
      id: 0,
      name: t('admin_novo_tema', 'Novo Tema'),
      font_family: 'Sistema',
      border_radius_buttons: 'Médio',
      border_radius_inputs: 'Médio',
      border_radius_panels: 'Médio',
      color_navbar: '#111111',
      color_background: '#000000',
      color_background_alt: '#111111',
      color_foreground: '#ffffff',
      color_accent_light: '#ff4d4d',
      color_accent: '#e50914',
      color_accent_dark: '#b20710',
      color_text_on_accent: '#ffffff',
      color_chip: '#222222',
      is_active: 0
    };
    setSelectedTheme(newTheme);
    setHasChanges(true);
    setView('edit');
    setSubView('main');
  };

  if (loading) return <div className="loading-screen" style={{ color: 'var(--text-primary)' }}>{t('admin_a_carregar_temas', 'A carregar temas...')}</div>;

  return (
    <div className="menu-customizer-layout">
      {/* Sidebar */}
      <div className="customizer-sidebar" style={{ width: 400 }}>
        <div className="customizer-header">
          <button className="icon-btn" onClick={() => navigate('/admin/settings')}>
            <X size={20} />
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t('admin_editor_de_aparencia', 'Editor de aparência')}</h2>
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
            <button className="back-btn" onClick={() => {
              if (subView !== 'main') setSubView('main');
              else setView('list');
            }}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <div style={{ flex: 1, paddingLeft: view === 'edit' ? 0 : 40 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('admin_a_personalizar', 'A personalizar')}</p>
            <h3 style={{ fontSize: 15, margin: 0, color: 'var(--accent)' }}>
              {view === 'list' ? 'Temas' : (subView === 'main' ? selectedTheme?.name : (subView === 'font' ? t('admin_tipo_de_letra', 'Tipo de letra') : t('admin_arredondamento', 'Arredondamento')))}
            </h3>
          </div>
        </div>

        <div className="customizer-content">
          {view === 'list' ? (
            <div className="menu-selection-list">
              <button className="add-theme-btn" onClick={addNewTheme}>
                <Plus size={16} />
                <span>{t('admin_novo_tema', 'Novo tema')}</span>
              </button>
              {themes.map(theme => (
                <div 
                  key={theme.id} 
                  className={`theme-list-card ${theme.is_active ? 'active' : ''}`}
                  onClick={() => openEditor(theme)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="theme-icon-circle">
                      {theme.name === 'Dark' ? <Moon size={16} /> : <Sun size={16} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{theme.name}</span>
                      {theme.is_active === 1 && <span className="active-badge">{t('admin_ativo', 'ATIVO')}</span>}
                    </div>
                  </div>
                  <div className="theme-card-actions">
                    <button className="theme-action-btn" onClick={(e) => { e.stopPropagation(); activateTheme(theme.id); }} title={t('admin_ativar', 'Ativar')}>
                      <Check size={16} color={theme.is_active ? 'var(--accent)' : '#444'} />
                    </button>
                    <button className="theme-action-btn delete" onClick={(e) => { e.stopPropagation(); deleteTheme(theme.id); }} title={t('admin_eliminar', 'Eliminar')}>
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="chevron" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="theme-editor-panels">
              {subView === 'main' && (
                <>
                  <div className="editor-section">
                    <h4 className="section-title">{t('admin_definicoes', 'Definições')}</h4>
                    <div className="editor-control-item" onClick={() => setSubView('font')}>
                      <div className="control-label">
                        <Type size={18} />
                        <span>{t('admin_tipo_de_letra', 'Tipo de letra')}</span>
                      </div>
                      <div className="control-value">
                        <span>{selectedTheme?.font_family}</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                    <div className="editor-control-item" onClick={() => setSubView('radius')}>
                      <div className="control-label">
                        <Square size={18} />
                        <span>{t('admin_arredondamento', 'Arredondamento')}</span>
                      </div>
                      <div className="control-value">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="editor-section">
                    <h4 className="section-title">{t('admin_cores', 'Cores')}</h4>
                    <ColorPicker label={t('admin_barra_de_navegacao_navbar', 'Barra de navegação (Navbar)')} value={selectedTheme?.color_navbar || ''} onChange={v => updateField('color_navbar', v)} />
                    <ColorPicker label={t('admin_fundo', 'Fundo')} value={selectedTheme?.color_background || ''} onChange={v => updateField('color_background', v)} />
                    <ColorPicker label={t('admin_fundo_alternativo', 'Fundo Alternativo')} value={selectedTheme?.color_background_alt || ''} onChange={v => updateField('color_background_alt', v)} />
                    <ColorPicker label={t('admin_primeiro_plano', 'Primeiro Plano')} value={selectedTheme?.color_foreground || ''} onChange={v => updateField('color_foreground', v)} />
                    <ColorPicker label={t('admin_destaque_claro', 'Destaque Claro')} value={selectedTheme?.color_accent_light || ''} onChange={v => updateField('color_accent_light', v)} />
                    <ColorPicker label={t('admin_destaque_accent', 'Destaque (Accent)')} value={selectedTheme?.color_accent || ''} onChange={v => updateField('color_accent', v)} />
                    <ColorPicker label={t('admin_destaque_escuro', 'Destaque Escuro')} value={selectedTheme?.color_accent_dark || ''} onChange={v => updateField('color_accent_dark', v)} />
                    <ColorPicker label={t('admin_texto_sobre_destaque', 'Texto Sobre Destaque')} value={selectedTheme?.color_text_on_accent || ''} onChange={v => updateField('color_text_on_accent', v)} />
                    <ColorPicker label={t('admin_chip', 'Chip')} value={selectedTheme?.color_chip || ''} onChange={v => updateField('color_chip', v)} />
                  </div>
                </>
              )}

              {subView === 'font' && (
                <div className="font-picker-grid">
                  <div className="search-box" style={{ margin: '0 20px 20px 20px' }}>
                    <input type="text" placeholder={t('admin_procurar_tipos_de_letra', 'Procurar tipos de letra')} />
                  </div>
                  <div className="fonts-container">
                    {FONTS.map(font => (
                      <div 
                        key={font.name} 
                        className={`font-card ${selectedTheme?.font_family === font.name ? 'active' : ''}`}
                        onClick={() => updateField('font_family', font.name)}
                      >
                        <div className="font-preview" style={{ fontFamily: font.family }}>{t('admin_aa', 'Aa')}</div>
                        <div className="font-name">{font.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subView === 'radius' && (
                <div className="radius-editor" style={{ padding: 20 }}>
                  <RadiusGroup 
                    label={t('admin_arredondamento_dos_botoes', 'Arredondamento dos botões')} 
                    value={selectedTheme?.border_radius_buttons || ''} 
                    onChange={v => updateField('border_radius_buttons', v)} 
                    radiusOptions={RADIUS_OPTIONS}
                  />
                  <RadiusGroup 
                    label={t('admin_arredondamento_dos_campos_de_entrada', 'Arredondamento dos campos de entrada')} 
                    value={selectedTheme?.border_radius_inputs || ''} 
                    onChange={v => updateField('border_radius_inputs', v)} 
                    radiusOptions={RADIUS_OPTIONS}
                  />
                  <RadiusGroup 
                    label={t('admin_arredondamento_dos_paineis', 'Arredondamento dos painéis')} 
                    value={selectedTheme?.border_radius_panels || ''} 
                    onChange={v => updateField('border_radius_panels', v)} 
                    radiusOptions={RADIUS_OPTIONS}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="customizer-preview themes-preview" style={{ 
        background: selectedTheme?.color_background, 
        fontFamily: FONTS.find(f => f.name === selectedTheme?.font_family)?.family 
      }}>
        <div className="preview-toolbar" style={{ 
          background: selectedTheme?.color_background_alt,
          borderBottom: `1px solid ${selectedTheme?.color_background}` 
        }}>
          <div className="preview-url" style={{ 
            background: selectedTheme?.color_background, 
            color: selectedTheme?.color_foreground,
            border: '1px solid var(--glass-border)'
          }}>
             <span>{t('admin_antestreiascomv2preview', 'antestreias.com/v2/preview')}</span>
          </div>
        </div>

        <div className="theme-live-mockup" style={{ color: selectedTheme?.color_foreground, padding: 40 }}>
           {/* Mock Navbar */}
           <div className="mock-navbar" style={{ 
             background: selectedTheme?.color_navbar, 
             padding: '15px 40px', 
             display: 'flex', 
             justifyContent: 'space-between', 
             alignItems: 'center',
             borderRadius: RADIUS_MAP[selectedTheme?.border_radius_panels || 'Médio'],
             marginBottom: 40,
             border: `1px solid ${selectedTheme?.color_accent_light}22`
           }}>
             <div style={{ fontWeight: 800, fontSize: 20, color: selectedTheme?.color_accent }}>{t('admin_ante', 'ANTE')}<span style={{ color: selectedTheme?.color_foreground }}>{t('admin_streias', 'STREIAS')}</span></div>
             <div style={{ display: 'flex', gap: 20, fontSize: 14 }}>
               <span>{t('admin_inicio', 'Início')}</span>
               <span>{t('nav_movies', 'Filmes')}</span>
               <span>{t('nav_series', 'Séries')}</span>
             </div>
             <div style={{ width: 32, height: 32, borderRadius: '50%', background: selectedTheme?.color_accent }}></div>
           </div>

           {/* Hero Section */}
           <div style={{ display: 'flex', gap: 40 }}>
             <div className="mock-poster" style={{ 
               width: 250, 
               height: 375, 
               background: selectedTheme?.color_background_alt, 
               borderRadius: RADIUS_MAP[selectedTheme?.border_radius_panels || 'Médio'],
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontSize: 40,
               color: `${selectedTheme?.color_foreground}22`
             }}>?</div>
             
             <div style={{ flex: 1 }}>
               <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                 <div style={{ 
                   background: selectedTheme?.color_chip, 
                   padding: '4px 12px', 
                   borderRadius: 4, 
                   fontSize: 10,
                   fontWeight: 700
                 }}>2024</div>
                 <div style={{ 
                   background: selectedTheme?.color_accent, 
                   color: selectedTheme?.color_text_on_accent,
                   padding: '4px 12px', 
                   borderRadius: 4, 
                   fontSize: 10,
                   fontWeight: 700
                 }}>{t('admin_estreia', 'ESTREIA')}</div>
               </div>
               <h1 style={{ fontSize: 48, margin: '0 0 20px 0', fontWeight: 900 }}>{t('admin_gladiador_ii', 'Gladiador II')}</h1>
               <p style={{ color: `${selectedTheme?.color_foreground}99`, lineHeight: 1.6, maxWidth: 500, marginBottom: 30 }}>
                 {t('admin_anos_apos_presenciar_a_morte_do_venerado_heroi_max', 'Anos após presenciar a morte do venerado herói Maximus pelas mãos de seu tio, Lucius é forçado a entrar no Coliseu depois que sua casa é conquistada pelos emperadores tirânicos.')}
               </p>
               
               <div style={{ display: 'flex', gap: 15 }}>
                 <button style={{ 
                   background: selectedTheme?.color_accent, 
                   color: selectedTheme?.color_text_on_accent,
                   border: 'none',
                   padding: '12px 30px',
                   borderRadius: RADIUS_MAP[selectedTheme?.border_radius_buttons || 'Médio'],
                   fontWeight: 700,
                   fontSize: 14,
                   cursor: 'pointer'
                 }}>{t('admin_assistir_agora', 'Assistir Agora')}</button>
                 <button style={{ 
                   background: 'transparent', 
                   color: selectedTheme?.color_foreground,
                   border: `2px solid ${selectedTheme?.color_foreground}22`,
                   padding: '12px 30px',
                   borderRadius: RADIUS_MAP[selectedTheme?.border_radius_buttons || 'Médio'],
                   fontWeight: 700,
                   fontSize: 14,
                   cursor: 'pointer'
                 }}>{t('admin_trailer', 'Trailer')}</button>
               </div>
             </div>
           </div>

           {/* Input Simulation */}
           <div style={{ marginTop: 60, maxWidth: 400 }}>
             <label style={{ display: 'block', marginBottom: 10, fontSize: 12, opacity: 0.6 }}>{t('admin_simulacao_de_formulario', 'Simulação de formulário')}</label>
             <input 
               type="text" 
               placeholder={t('admin_escreva_algo', 'Escreva algo...')} 
               style={{ 
                 width: '100%', 
                 background: selectedTheme?.color_background_alt, 
                 border: `1px solid ${selectedTheme?.color_foreground}22`, 
                 padding: '12px 16px', 
                 borderRadius: RADIUS_MAP[selectedTheme?.border_radius_inputs || 'Médio'],
                 color: selectedTheme?.color_foreground
               }} 
             />
           </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="editor-control-item" style={{ cursor: 'default' }}>
      <div className="control-label">
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: value, border: '1px solid var(--glass-border)' }}></div>
        <span>{label}</span>
      </div>
      <div className="control-value" style={{ position: 'relative' }}>
        <input 
          type="color" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer' }}
        />
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

function RadiusGroup({ label, value, onChange, radiusOptions }: { label: string, value: string, onChange: (v: string) => void, radiusOptions: { value: string, label: string }[] }) {
  return (
    <div className="radius-group" style={{ marginBottom: 30 }}>
      <h5 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#888' }}>{label}</h5>
      <div className="radius-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {radiusOptions.map(opt => (
          <button 
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`radius-option-btn ${value === opt.value ? 'active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
