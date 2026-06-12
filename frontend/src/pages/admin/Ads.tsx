import { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { showToast } from '../../components/Toast';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

interface AdsSettings {
  'ads.top': string;
  'ads.bottom': string;
  'ads.movie-series': string;
  'ads.celebrity': string;
  'ads.player': string;
  'ads.news-top': string;
  'ads.news-bottom': string;
  'ads.homepage-bottom': string;
  'ads.disabled': string;
}

export default function AdminAds() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [settings, setSettings] = useState<AdsSettings>({
    'ads.top': '',
    'ads.bottom': '',
    'ads.movie-series': '',
    'ads.celebrity': '',
    'ads.player': '',
    'ads.news-top': '',
    'ads.news-bottom': '',
    'ads.homepage-bottom': '',
    'ads.disabled': '0'
  });

  useEffect(() => {
    fetchSettings();
    
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php?group=ads`);
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load ads settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof AdsSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Definições de anúncios guardadas com sucesso.', 'success');
      } else {
        showToast('Erro ao guardar configurações.', 'error');
      }
    } catch (err) {
      showToast('Erro ao guardar configurações.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}><div className="spinner" /></div>;

  const AdPreview = ({ slotKey, label }: { slotKey: string; label: string }) => {
    const renderMockContent = (key: string) => {
      const MiniNavbar = () => (
        <div style={{
          height: 12,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 6px',
          flexShrink: 0
        }}>
          <div style={{ width: 16, height: 2, background: 'var(--accent)', borderRadius: 1 }} />
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 8, height: 2, background: 'var(--text-secondary)', opacity: 0.3, borderRadius: 1 }} />
            <div style={{ width: 8, height: 2, background: 'var(--text-secondary)', opacity: 0.3, borderRadius: 1 }} />
            <div style={{ width: 8, height: 2, background: 'var(--text-secondary)', opacity: 0.3, borderRadius: 1 }} />
          </div>
        </div>
      );

      const MiniFooter = () => (
        <div style={{
          height: 14,
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
          marginTop: 'auto',
          flexShrink: 0
        }}>
          <div style={{ width: 40, height: 2, background: 'var(--text-secondary)', opacity: 0.2, borderRadius: 1 }} />
        </div>
      );

      const AdBanner = ({ text }: { text: string }) => (
        <div 
          className="ad-preview-banner"
          style={{
            height: 14,
            background: 'rgba(229, 9, 21, 0.12)',
            border: '1px dashed var(--accent)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            fontWeight: 800,
            fontSize: 7,
            letterSpacing: '0.05em',
            flexShrink: 0,
            fontFamily: 'sans-serif'
          }}
        >
          ANÚNCIO ({text})
        </div>
      );

      const TextLine = ({ width = '100%', opacity = 0.15 }) => (
        <div style={{ width, height: 3, background: 'var(--text-primary)', opacity, borderRadius: 0.5 }} />
      );

      const mockBodyStyle: React.CSSProperties = {
        flex: 1,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflow: 'hidden'
      };

      switch (key) {
        case 'ads.top':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              <AdBanner text="Topo" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '2px 0' }}>
                <TextLine width="40%" opacity={0.3} />
                <TextLine />
                <TextLine width="85%" />
                <TextLine width="60%" />
              </div>
              <MiniFooter />
            </div>
          );

        case 'ads.bottom':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '2px 0' }}>
                <TextLine width="40%" opacity={0.3} />
                <TextLine />
                <TextLine width="85%" />
              </div>
              <AdBanner text="Fundo" />
              <MiniFooter />
            </div>
          );

        case 'ads.movie-series':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              <div style={{
                height: 22,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 4,
                display: 'flex',
                padding: 4,
                gap: 4,
                flexShrink: 0
              }}>
                <div style={{ width: 12, height: 14, background: 'var(--accent)', opacity: 0.25, borderRadius: 2 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                  <div style={{ width: '60%', height: 3, background: 'var(--text-primary)', opacity: 0.5 }} />
                  <div style={{ width: '30%', height: 2, background: 'var(--text-secondary)', opacity: 0.3 }} />
                </div>
              </div>
              <AdBanner text="Filme" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextLine width="90%" />
                <TextLine width="65%" />
              </div>
              <MiniFooter />
            </div>
          );

        case 'ads.celebrity':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              <div style={{ display: 'flex', gap: 5, padding: '2px 0', flexShrink: 0 }}>
                <div style={{
                  width: 16,
                  height: 20,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 3,
                  flexShrink: 0
                }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
                  <div style={{ width: '50%', height: 4, background: 'var(--text-primary)', opacity: 0.5 }} />
                  <TextLine />
                  <TextLine width="80%" />
                </div>
              </div>
              <AdBanner text="Celebridade" />
              <MiniFooter />
            </div>
          );

        case 'ads.player':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              <div style={{
                height: 28,
                background: '#000000',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0
              }}>
                <div style={{
                  width: 0,
                  height: 0,
                  borderTop: '3px solid transparent',
                  borderBottom: '3px solid transparent',
                  borderLeft: '5px solid #ffffff',
                  opacity: 0.8
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  right: 2,
                  height: 2,
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 1
                }}>
                  <div style={{ width: '40%', height: '100%', background: 'var(--accent)' }} />
                </div>
              </div>
              <AdBanner text="Player" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextLine width="50%" opacity={0.3} />
              </div>
              <MiniFooter />
            </div>
          );

        case 'ads.news-top':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '2px 0' }}>
                <div style={{ width: '70%', height: 4, background: 'var(--text-primary)', opacity: 0.6 }} />
                <AdBanner text="Notícia Topo" />
                <TextLine />
                <TextLine width="90%" />
              </div>
              <MiniFooter />
            </div>
          );

        case 'ads.news-bottom':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '2px 0' }}>
                <div style={{ width: '70%', height: 4, background: 'var(--text-primary)', opacity: 0.6 }} />
                <TextLine />
                <TextLine />
                <TextLine width="90%" />
                <AdBanner text="Notícia Fundo" />
              </div>
              <MiniFooter />
            </div>
          );

        case 'ads.homepage-bottom':
          return (
            <div style={mockBodyStyle}>
              <MiniNavbar />
              {/* Slider mockup */}
              <div style={{ height: 16, background: 'var(--bg-secondary)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, flexShrink: 0 }}>
                <div style={{ width: 30, height: 2, background: 'var(--text-primary)', opacity: 0.3 }} />
              </div>
              {/* Movie Grid mockup */}
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                <div style={{ width: 15, height: 20, background: 'var(--bg-secondary)', borderRadius: 2 }} />
                <div style={{ width: 15, height: 20, background: 'var(--bg-secondary)', borderRadius: 2 }} />
                <div style={{ width: 15, height: 20, background: 'var(--bg-secondary)', borderRadius: 2 }} />
                <div style={{ width: 15, height: 20, background: 'var(--bg-secondary)', borderRadius: 2 }} />
              </div>
              {/* Last Review mockup */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 3,
                padding: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                flexShrink: 0
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', opacity: 0.3 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <div style={{ width: '40%', height: 2, background: 'var(--text-primary)', opacity: 0.5 }} />
                  <div style={{ width: '70%', height: 1.5, background: 'var(--text-secondary)', opacity: 0.3 }} />
                </div>
              </div>
              <AdBanner text="Pág. Inicial Fundo" />
              <MiniFooter />
            </div>
          );

        default:
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          );
      }
    };

    return (
      <div style={{
        width: '100%',
        height: 120,
        background: 'var(--bg-primary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
      }}>
        {/* Browser Top Bar */}
        <div style={{
          height: 16,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
          gap: 3,
          flexShrink: 0
        }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#27c93f' }} />
          <div style={{
            flex: 1,
            height: 10,
            background: 'var(--bg-primary)',
            borderRadius: 2,
            marginLeft: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: 40, height: 1.5, background: 'var(--text-secondary)', opacity: 0.15 }} />
          </div>
        </div>

        {/* Browser Page Body */}
        {renderMockContent(slotKey)}
      </div>
    );
  };

  const adSlots = [
    {
      key: 'ads.top',
      label: t('admin_topo_global', 'Topo (Global)'),
      description: t('admin_aparece_no_topo_da_maioria_das_paginas_melhor_tama', 'Aparece no topo da maioria das páginas. Melhor tamanho <= 150px de altura ou responsivo.')
    },
    {
      key: 'ads.bottom',
      label: t('admin_fundo_global', 'Fundo (Global)'),
      description: t('admin_aparece_no_fundo_da_maioria_das_paginas_melhor_tam', 'Aparece no fundo da maioria das páginas. Melhor tamanho <= 150px de altura ou responsivo.')
    },
    {
      key: 'ads.movie-series',
      label: 'Página de Filme/Série',
      description: t('admin_aparece_apenas_na_pagina_do_titulo_apos_o_resumo_d', 'Aparece apenas na página do título (após o resumo do enredo). Melhor tamanho <= 850px de largura ou responsivo.')
    },
    {
      key: 'ads.celebrity',
      label: t('admin_pagina_de_celebridade', 'Página de Celebridade'),
      description: t('admin_aparece_apenas_na_pagina_da_celebridade_apos_a_bio', 'Aparece apenas na página da celebridade (após a biografia). Melhor tamanho <= 850px de largura ou responsivo.')
    },
    {
      key: 'ads.player',
      label: t('admin_pagina_do_player', 'Página do Player'),
      description: t('admin_aparece_apenas_na_pagina_de_visualizacao_abaixo_do', 'Aparece apenas na página de visualização (abaixo do reprodutor de vídeo). O melhor tamanho é o mais largo possível ou responsivo.')
    },
    {
      key: 'ads.news-top',
      label: t('admin_noticias_topo', 'Notícias (Topo)'),
      description: t('admin_aparece_no_topo_do_conteudo_da_noticia_melhor_tama', 'Aparece no topo do conteúdo da notícia. Melhor tamanho <= 850px de largura ou responsivo.')
    },
    {
      key: 'ads.news-bottom',
      label: t('admin_noticias_fundo', 'Notícias (Fundo)'),
      description: t('admin_aparece_no_fundo_do_conteudo_da_noticia_melhor_tam', 'Aparece no fundo do conteúdo da notícia. Melhor tamanho <= 850px de largura ou responsivo.')
    },
    {
      key: 'ads.homepage-bottom',
      label: t('admin_homepage_bottom', 'Página Inicial (Fundo)'),
      description: t('admin_aparece_na_pagina_inicial_abaixo_da_ultima_critica', 'Aparece na página inicial abaixo da última crítica e antes do rodapé. Melhor tamanho <= 850px de largura ou responsivo.')
    }
  ];

  return (
    <div className="admin-page admin-page-ads">
      <style>{`
        .admin-page-ads {
          padding: ${isMobile ? '0 16px 40px' : '0 40px 60px'};
        }
        .ad-slot-item {
          display: flex;
          flex-direction: ${isMobile ? 'column' : 'row'};
          gap: ${isMobile ? '12px' : '20px'};
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 24px;
        }
        .ad-slot-preview {
          width: 200px;
          flex-shrink: 0;
          margin-top: 28px;
          display: ${isMobile ? 'none' : 'block'};
        }
        .ads-save-btn {
          width: ${isMobile ? '100%' : 'auto'};
        }
        @keyframes ad-pulse {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(0.98); }
        }
        .ad-preview-banner {
          animation: ad-pulse 2s infinite ease-in-out;
        }
        @media (max-width: 1024px) {
          .admin-page-ads {
            padding: 0 16px 40px !important;
          }
          .ad-slot-item {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .ad-slot-preview {
            display: none !important;
          }
          .ads-save-btn {
            width: 100% !important;
          }
        }
      `}</style>
      <AdminPageHeader
        title={t('admin_anuncios', 'Anúncios')}
        subtitle={t('admin_gerir_espacos_publicitarios_e_codigos_de', 'Gerir espaços publicitários e códigos de anúncios em toda a plataforma.')}
      />

      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '24px 0 20px' }}>{t('admin_espacos_publicitarios_predefinidos', 'Espaços publicitários predefinidos')}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {adSlots.map(slot => (
            <div 
              key={slot.key} 
              className="ad-slot-item"
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{slot.label}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{slot.description}</p>
                <textarea
                  value={settings[slot.key as keyof AdsSettings] || ''}
                  onChange={(e) => handleChange(slot.key as keyof AdsSettings, e.target.value)}
                  style={{
                    width: '100%',
                    height: 120,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    padding: 12,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder={t('admin__insira_o_codigo_htmljs_do_anuncio_aqui_', '<!-- Insira o código HTML/JS do anúncio aqui -->')}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>
              <div className="ad-slot-preview">
                <AdPreview slotKey={slot.key} label={slot.label} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings['ads.disabled'] === '1'}
                onChange={(e) => handleChange('ads.disabled', e.target.checked ? '1' : '0')}
              />
              <span className="toggle-slider"></span>
            </label>
            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{t('admin_desativar_anuncios', 'Desativar anúncios')}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 30px', paddingLeft: 55 }}>
            {t('admin_desativa_todas_as_funcionalidades_relacionadas_com', 'Desativa todas as funcionalidades relacionadas com anúncios no site.')}
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary ads-save-btn"
            style={{ justifyContent: 'center' }}
          >
            {saving ? t('admin_a_guardar', 'A Guardar...') : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
