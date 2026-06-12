import { useState, useEffect } from 'react';
import { Mail, ChevronRight, Save, Info, Eye } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

interface Template {
  id: number;
  slug: string;
  name: string;
  subject: string;
  body: string;
}

export default function SettingsMailTemplates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [showTestInput, setShowTestInput] = useState(false);

  // Global Appearance State for Preview
  const [appearance, setAppearance] = useState({
    header: '',
    footer: '',
    accent: '#e50914',
    css: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchAppearance();
  }, []);

  const fetchAppearance = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`);
      const data = await res.json();
      setAppearance({
        header: data['mail.appearance.header'] || '',
        footer: data['mail.appearance.footer'] || '',
        accent: data['mail.appearance.accent'] || '#e50914',
        css: data['mail.appearance.css'] || ''
      });
    } catch (err) {
      console.error(t('admin_failed_to_fetch_appearance_settings', 'Failed to fetch appearance settings'));
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_mail_templates.php`);
      const data = await res.json();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        handleSelect(data[0]);
      }
      setLoading(false);
    } catch (err) {
      showToast('Erro ao carregar templates', 'error');
      setLoading(false);
    }
  };

  const handleSelect = (t: Template) => {
    setSelectedTemplate(t);
    setSubject(t.subject);
    setBody(t.body);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_mail_templates.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: selectedTemplate.id,
          subject,
          body
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_template_atualizado_com_sucesso', 'Template atualizado com sucesso!'));
        fetchTemplates();
      }
    } catch (err) {
      showToast('Erro ao guardar template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testRecipient) {
      showToast('Insere um e-mail para o teste', 'error');
      return;
    }
    setSendingTest(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_mail_test.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: testRecipient,
          subject: t('admin_teste_subject', '[TESTE] ${subject}'),
          message: body,
          is_template: true
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_e_mail_de_teste_enviado', 'E-mail de teste enviado!'));
        setShowTestInput(false);
      } else {
        showToast(data.error || t('admin_erro_ao_enviar_teste', 'Erro ao enviar teste'), 'error');
      }
    } catch (err) {
      showToast('Erro de ligação', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const getPlaceholders = () => {
    switch (selectedTemplate?.slug) {
      case 'welcome': return ['{{name}}', '{{email}}'];
      case 'verify_email': return ['{{name}}', '{{code}}'];
      case '2fa_code': return ['{{name}}', '{{code}}'];
      case 'contest_winner': return ['{{name}}', '{{movie}}', '{{tickets}}', '{{cinema}}', '{{date}}', '{{time}}'];
      case 'new_follower': return ['{{name}}', '{{follower_name}}'];
      case 'contest_participation': return ['{{name}}', '{{movie}}', '{{contest_name}}', '{{location}}', '{{answer}}'];
      default: return ['{{name}}'];
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar', 'A carregar...')}</div>;

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Mail size={isMobile ? 22 : 28} color="var(--accent)" /> {t('admin_templates_de_e_mail', 'Templates de E-mail')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? 13 : 14 }}>
          {t('admin_gira_o_conteudo_das_mensagens_automaticas_enviadas', 'Gira o conteúdo das mensagens automáticas enviadas pelo sistema.')}
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', 
        gap: isMobile ? 20 : 30, 
        alignItems: 'start' 
      }}>
        {/* Sidebar: Template List */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('admin_mensagens_do_sistema', 'Mensagens do Sistema')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleSelect(tpl)}
                style={{
                  padding: '16px 20px',
                  background: selectedTemplate?.id === tpl.id ? 'rgba(229, 9, 21, 0.1)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${selectedTemplate?.id === tpl.id ? 'var(--accent)' : 'transparent'}`,
                  color: selectedTemplate?.id === tpl.id ? 'white' : 'var(--text-secondary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  fontSize: 14,
                  fontWeight: selectedTemplate?.id === tpl.id ? 700 : 500
                }}
              >
                {tpl.name}
                <ChevronRight size={16} opacity={selectedTemplate?.id === tpl.id ? 1 : 0.3} />
              </button>
            ))}
          </div>
        </div>

        {/* Main: Editor */}
        {selectedTemplate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 24 }}>
            <div className="glass-card" style={{ padding: isMobile ? 16 : 30 }}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{t('admin_assunto_do_e_mail', 'Assunto do E-mail')}</label>
                <input 
                  className="form-input"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  style={{ fontSize: 16, fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row', 
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center', 
                  gap: isMobile ? 8 : 12,
                  marginBottom: 10 
                }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{t('admin_conteudo_html', 'Conteúdo (HTML)')}</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {getPlaceholders().map(p => (
                      <code 
                        key={p} 
                        style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: 'var(--accent)' }}
                        onClick={() => setBody(body + p)}
                        title={t('admin_clique_para_inserir', 'Clique para inserir')}
                      >
                        {p}
                      </code>
                    ))}
                  </div>
                </div>
                <textarea 
                  className="form-input" 
                  rows={15}
                  style={{ fontFamily: 'monospace', fontSize: 14, background: 'rgba(0,0,0,0.2)', lineHeight: 1.5 }}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: 12, 
                justifyContent: 'flex-end', 
                marginTop: 10, 
                alignItems: isMobile ? 'stretch' : 'center',
                width: '100%'
              }}>
                {showTestInput ? (
                  <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '4px 8px', 
                    borderRadius: 8,
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'space-between'
                  }}>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder={t('admin_teu_emailexemplocom', 'teu-email@exemplo.com')}
                      style={{ width: isMobile ? '100%' : 200, height: 36, fontSize: 13 }}
                      value={testRecipient}
                      onChange={e => setTestRecipient(e.target.value)}
                    />
                    <button className="btn-primary" onClick={handleSendTest} disabled={sendingTest} style={{ height: 36, padding: '0 12px', fontSize: 12 }}>
                      {sendingTest ? '...' : 'Enviar'}
                    </button>
                    <button className="btn-secondary" onClick={() => setShowTestInput(false)} style={{ height: 36, padding: '0 12px', fontSize: 12, background: 'transparent' }}>
                      X
                    </button>
                  </div>
                ) : (
                  <button className="btn-secondary" onClick={() => setShowTestInput(true)} style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                    <Mail size={18} /> {t('admin_enviar_teste_real', 'Enviar Teste Real')}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => setPreviewOpen(true)} style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                  <Eye size={18} /> {t('admin_ver_exemplo', 'Ver Exemplo')}
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                  <Save size={18} /> {saving ? t('admin_a_guardar', 'A guardar...') : t('admin_guardar_template', 'Guardar Template')}
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20, display: 'flex', gap: 15, alignItems: 'start', background: 'rgba(229, 9, 21, 0.05)', borderColor: 'rgba(229, 9, 21, 0.2)' }}>
              <Info size={20} color="var(--accent)" style={{ marginTop: 2 }} />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'white', display: 'block', marginBottom: 4 }}>{t('admin_dica_de_personalizacao', 'Dica de Personalização')}</strong>
                {t('admin_podes_usar_tags_html_como', 'Podes usar tags HTML como')} <code>{t('admin_ltstronggt', '&lt;strong&gt;')}</code>, <code>{t('admin_ltbrgt', '&lt;br&gt;')}</code> {t('admin_ou', 'ou')} <code>{t('admin_ltagt', '&lt;a&gt;')}</code> {t('admin_para_formatar_o_texto_os_campos_entre_chavetas_com', 'para formatar o texto. Os campos entre chavetas como')} <code>{`{{name}}`}</code> {t('admin_serao_substituidos_automaticamente_pelos_dados_rea', 'serão substituídos automaticamente pelos dados reais no momento do envio.')}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {t('admin_selecione_um_template_a_esquerda_para_comecar_a_ed', 'Selecione um template à esquerda para começar a editar.')}
          </div>
        )}
      </div>

      {previewOpen && selectedTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 10 : 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 1000, height: isMobile ? '95vh' : '90vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a', padding: 0 }}>
            <div style={{ padding: isMobile ? '16px 20px' : '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 18 }}>Pré-visualização: {selectedTemplate.name}</h3>
              <button onClick={() => setPreviewOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>{t('btn_close', 'Fechar')}</button>
            </div>
            <div style={{ flex: 1, padding: 0, overflowY: 'auto' }}>
              <iframe 
                srcDoc={`
                  <html>
                    <head>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; border: 1px solid #eee; }
                        .header { padding: 30px; background: white; text-align: left; }
                        .content { padding: 30px; line-height: 1.6; }
                        .footer { padding: 20px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
                        .btn { display: inline-block; padding: 12px 24px; background: ${appearance.accent}; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
                        ${appearance.css}
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          ${(appearance.header || `<h2 style="color: ${appearance.accent}; margin: 0;">${t('admin_antestreias', 'Antestreias')}</h2>`).replace(/{{site_url}}/g, window.location.origin)}
                        </div>
                        <div class="content">
                          ${body.replace(/{{name}}/g, t('admin_utilizador_exemplo', 'Utilizador Exemplo'))
                                .replace(/{{code}}/g, '123456')
                                .replace(/{{movie}}/g, 'Gladiador II')
                                .replace(/{{contest_name}}/g, t('admin_passatempo_exclusivo_antestreias', 'Passatempo Exclusivo Antestreias'))
                                .replace(/{{location}}/g, t('admin_cinemas_nos_colombo_imax', 'Cinemas NOS Colombo (IMAX)'))
                                .replace(/{{answer}}/g, t('admin_eu_quero_muito_ir_a_antestreia_porque_sou_o_maior', 'Eu quero muito ir à antestreia porque sou o maior fã!'))
                                .replace(/{{cinema}}/g, t('admin_cinemas_nos_colombo_imax', 'Cinemas NOS Colombo (IMAX)'))
                                .replace(/{{date}}/g, t('admin_17_de_abril_quarta_feira', '17 de Abril (Quarta-feira)'))
                                .replace(/{{time}}/g, '21h30')
                                .replace(/{{follower_name}}/g, '@cinemaniac')
                                .replace(/{{site_url}}/g, window.location.origin)
                                .replace(/{{footer_copyright}}/g, t('admin_2026_antestreias_todos_os_direitos_reservados', '© 2026 Antestreias. Todos os direitos reservados.'))}
                        </div>
                        <div class="footer">
                          ${(appearance.footer || t('admin_2026_antestreias_todos_os_direitos_reservados', '© 2026 Antestreias. Todos os direitos reservados.'))
                                .replace(/{{site_url}}/g, window.location.origin)
                                .replace(/{{footer_copyright}}/g, t('admin_2026_antestreias_todos_os_direitos_reservados', '© 2026 Antestreias. Todos os direitos reservados.'))}
                        </div>
                      </div>
                    </body>
                  </html>
                `} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                title={t('admin_email_template_preview', 'Email Template Preview')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
