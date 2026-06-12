import { useState, useEffect } from 'react';
import { Layout, Code, Eye, Save } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsAppearanceMail() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Settings State
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [accentColor, setAccentColor] = useState('#e50914');
  const [customCss, setCustomCss] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['mail.appearance.header']) setHeaderHtml(data['mail.appearance.header']);
        if (data['mail.appearance.footer']) setFooterHtml(data['mail.appearance.footer']);
        if (data['mail.appearance.accent']) setAccentColor(data['mail.appearance.accent']);
        if (data['mail.appearance.css']) setCustomCss(data['mail.appearance.css']);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const settings = {
      'mail.appearance.header': headerHtml,
      'mail.appearance.footer': footerHtml,
      'mail.appearance.accent': accentColor,
      'mail.appearance.css': customCss,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_aparencia_de_e_mail_guardada', 'Aparência de e-mail guardada!'));
      }
    } catch (err) {
      showToast('Erro ao guardar definições.', 'error');
    }
  };

  const getPreviewHtml = () => {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; border: 1px solid #eee; }
            .header { padding: 30px; background: white; text-align: left; }
            .content { padding: 30px; line-height: 1.6; }
            .footer { padding: 20px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
            .btn { display: inline-block; padding: 12px 24px; background: ${accentColor}; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
            ${customCss}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${headerHtml || `<h2 style={t('admin_color_accentcolor_margin_0', 'color: ${accentColor}; margin: 0;')}>{t('admin_antestreias', 'Antestreias')}</h2>`}
            </div>
            <div class="content">
              <h3>{t('admin_ola_nome_do_utilizador', 'Olá, Nome do Utilizador!')}</h3>
              <p>{t('admin_este_e_um_exemplo_de_como_as_suas_mensag', 'Este é um exemplo de como as suas mensagens de e-mail serão apresentadas aos utilizadores. O conteúdo dinâmico será inserido nesta área central.')}</p>
              <p>{t('admin_pode_usar_html_para_personalizar_o_cabec', 'Pode usar HTML para personalizar o cabeçalho e o rodapé da forma que desejar.')}</p>
              <a href="#" class="btn">{t('admin_botao_de_exemplo', 'Botão de Exemplo')}</a>
            </div>
            <div class="footer">
              ${footerHtml || t('admin_2024_antestreias_todos_os_direitos_reservados', '© 2024 Antestreias. Todos os direitos reservados.')}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-primary)' }}>{t('admin_a_carregar', 'A carregar...')}</div>;

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Top Header */}
      <div style={{ 
        marginBottom: isMobile ? 24 : 40, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 16 : 24
      }}>
        <div>
          <h1 style={{ 
            fontSize: isMobile ? 22 : 28, 
            marginBottom: 8, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12 
          }}>
            <Layout size={isMobile ? 22 : 28} color="var(--accent)" /> {t('admin_aparencia_de_e_mails', 'Aparência de E-mails')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? 13 : 14 }}>
            {t('admin_personalize_o_design_visual_dos_e_mails_enviados_p', 'Personalize o design visual dos e-mails enviados pela plataforma.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setPreviewOpen(true)}
            style={{ flex: isMobile ? 1 : 'none', justifyContent: 'center' }}
          >
            <Eye size={18} /> Visualizar
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            style={{ flex: isMobile ? 1 : 'none', justifyContent: 'center' }}
          >
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 350px', 
        gap: isMobile ? 20 : 30 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 24 }}>
          <div className="glass-card" style={{ padding: isMobile ? 16 : 24 }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16 }}>
              <Code size={18} color="var(--accent)" /> {t('admin_cabecalho_html', 'Cabeçalho (HTML)')}
            </h3>
            <textarea 
              className="form-input" 
              rows={8}
              style={{ fontFamily: 'monospace', fontSize: 13, background: 'rgba(0,0,0,0.2)' }}
              value={headerHtml}
              onChange={e => setHeaderHtml(e.target.value)}
              placeholder={t('admin_placeholder_logo', '<div>Seu Logótipo aqui...</div>')}
            />
          </div>

          <div className="glass-card" style={{ padding: isMobile ? 16 : 24 }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16 }}>
              <Code size={18} color="var(--accent)" /> {t('admin_rodape_html', 'Rodapé (HTML)')}
            </h3>
            <textarea 
              className="form-input" 
              rows={6}
              style={{ fontFamily: 'monospace', fontSize: 13, background: 'rgba(0,0,0,0.2)' }}
              value={footerHtml}
              onChange={e => setFooterHtml(e.target.value)}
              placeholder={t('admin_placeholder_footer', '<div>© Antestreias...</div>')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 24 }}>
          <div className="glass-card" style={{ padding: isMobile ? 16 : 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{t('admin_cor_de_destaque', 'Cor de Destaque')}</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input 
                type="color" 
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
              />
              <input 
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
              {t('admin_usada_em_botoes_links_e_titulos_principais_nos_e_m', 'Usada em botões, links e títulos principais nos e-mails.')}
            </p>
          </div>

          <div className="glass-card" style={{ padding: isMobile ? 16 : 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{t('admin_css_personalizado', 'CSS Personalizado')}</h3>
            <textarea 
              className="form-input" 
              rows={isMobile ? 6 : 10}
              style={{ fontFamily: 'monospace', fontSize: 12, background: 'rgba(0,0,0,0.2)' }}
              value={customCss}
              onChange={e => setCustomCss(e.target.value)}
              placeholder={t('admin_container', '.container { ... }')}
            />
          </div>
        </div>
      </div>

      {previewOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 10 : 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 1000, height: isMobile ? '95vh' : '90vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a', padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 18 }}>{t('admin_pre_visualizacao_do_e_mail', 'Pré-visualização do E-mail')}</h3>
              <button onClick={() => setPreviewOpen(false)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>{t('btn_close', 'Fechar')}</button>
            </div>
            <div style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              <iframe 
                srcDoc={getPreviewHtml()} 
                style={{ width: '100%', height: '100%', border: 'none', background: '#f4f4f4' }} 
                title={t('admin_email_preview', 'Email Preview')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
