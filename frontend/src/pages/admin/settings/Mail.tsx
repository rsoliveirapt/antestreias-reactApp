import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Mail, Link as LinkIcon } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsMail() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Settings State
  const [fromAddress, setFromAddress] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [fromName, setFromName] = useState('');
  const [handler, setHandler] = useState('smtp');
  const [smtpHost, setSmtpHost] = useState('smtp.mailtrap.io');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpPort, setSmtpPort] = useState('2525');
  const [smtpEncryption, setSmtpEncryption] = useState('none');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['mail.from_address']) setFromAddress(data['mail.from_address']);
        if (data['mail.contact_page_address']) setContactAddress(data['mail.contact_page_address']);
        if (data['mail.from_name']) setFromName(data['mail.from_name']);
        if (data['mail.handler']) setHandler(data['mail.handler']);
        if (data['mail.smtp_host']) setSmtpHost(data['mail.smtp_host']);
        if (data['mail.smtp_user']) setSmtpUser(data['mail.smtp_user']);
        if (data['mail.smtp_password']) setSmtpPassword(data['mail.smtp_password']);
        if (data['mail.smtp_port']) setSmtpPort(data['mail.smtp_port']);
        if (data['mail.smtp_encryption']) setSmtpEncryption(data['mail.smtp_encryption']);
        
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'mail.from_address': fromAddress,
      'mail.contact_page_address': contactAddress,
      'mail.from_name': fromName,
      'mail.handler': handler,
      'mail.smtp_host': smtpHost,
      'mail.smtp_user': smtpUser,
      'mail.smtp_password': smtpPassword,
      'mail.smtp_port': smtpPort,
      'mail.smtp_encryption': smtpEncryption,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_e_mail_guardadas_com_suces', 'Definições de e-mail guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'));
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_mail_test.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: testRecipient || fromAddress,
          from_address: fromAddress,
          from_name: fromName,
          handler,
          smtp_host: smtpHost,
          smtp_user: smtpUser,
          smtp_password: smtpPassword,
          smtp_port: smtpPort,
          smtp_encryption: smtpEncryption
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_e_mail_de_teste_enviado_com_sucesso', 'E-mail de teste enviado com sucesso!'));
      } else {
        showToast(data.error || t('admin_erro_ao_enviar_e_mail_de_teste', 'Erro ao enviar e-mail de teste.'), 'error');
      }
    } catch (err) {
      showToast('Erro ao ligar ao servidor de teste.', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Mail size={isMobile ? 22 : 28} color="var(--accent)" /> {t('admin_definicoes_de_e_mail_de_saida', 'Definições de e-mail de saída')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? 13 : 14 }}>
          {t('admin_altera_os_processadores_de_e_mail_de_saida_credenc', 'Altera os processadores de e-mail de saída, credenciais e outras definições relacionadas.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_endereco_de_remetente', 'Endereço de remetente')}</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder={t('admin_noreplyantestreiaspt', 'noreply@antestreias.pt')}
            value={fromAddress}
            onChange={e => setFromAddress(e.target.value)}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_todos_os_e_mails_de_saida_da_aplicacao_serao_envia', 'Todos os e-mails de saída da aplicação serão enviados deste endereço.')}
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_endereco_da_pagina_de_contacto', 'Endereço da página de contacto')}</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder={t('admin_contactoantestreiaspt', 'contacto@antestreias.pt')}
            value={contactAddress}
            onChange={e => setContactAddress(e.target.value)}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_para_onde_devem_ser_enviados_os_e_mails_da_pagina', 'Para onde devem ser enviados os e-mails da página')} <span style={{ color: 'var(--accent)' }}>{t('admin_httpsantestreiascomcontact', 'https://antestreias.com/contact')}</span>.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_nome_do_remetente', 'Nome do remetente')}</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Antestreias"
            value={fromName}
            onChange={e => setFromName(e.target.value)}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_todos_os_e_mails_de_saida_da_aplicacao_serao_envia', 'Todos os e-mails de saída da aplicação serão enviados usando este nome.')}
          </p>
        </div>

        <div className="glass" style={{ marginBottom: 40, padding: 20, background: 'rgba(184, 134, 11, 0.05)', border: '1px solid rgba(184, 134, 11, 0.1)', borderRadius: 8 }}>
           <p style={{ fontSize: 14, color: '#B8860B' }}>
             {t('admin_o_metodo_de_e_mail_selecionado_deve_estar_autoriza', 'O método de e-mail selecionado deve estar autorizado a enviar e-mails usando este endereço e nome.')}
           </p>
        </div>

        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_metodo_de_e_mail_de_saida', 'Método de e-mail de saída')}</label>
          <select value={handler} onChange={e => setHandler(e.target.value)} className="form-input">
            <option value="smtp">{t('admin_smtp', 'SMTP')}</option>
            <option value="mailgun">{t('admin_mailgun', 'Mailgun')}</option>
            <option value="postmark">{t('admin_postmark', 'Postmark')}</option>
            <option value="ses">{t('admin_amazon_ses', 'Amazon SES')}</option>
            <option value="sendmail">{t('admin_sendmail', 'Sendmail')}</option>
          </select>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_que_metodo_deve_ser_usado_para_enviar_e_mails_de_s', 'Que método deve ser usado para enviar e-mails de saída (como confirmação de registo).')}
            <a href="#" style={{ color: 'var(--accent)', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              <LinkIcon size={14} /> {t('admin_saber_mais', 'Saber mais')}
            </a>
          </p>
        </div>

        {handler === 'smtp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: 'rgba(255,255,255,0.02)', padding: isMobile ? 16 : 24, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_host_smtp', 'Host SMTP')}</label>
              <input type="text" className="form-input" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 24 : 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_utilizador_smtp', 'Utilizador SMTP')}</label>
                <input type="text" className="form-input" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_palavra_passe_smtp', 'Palavra-passe SMTP')}</label>
                <input type="password" className="form-input" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 24 : 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_porta_smtp', 'Porta SMTP')}</label>
                <input type="text" className="form-input" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('admin_encriptacao_smtp', 'Encriptação SMTP')}</label>
                <select value={smtpEncryption} onChange={e => setSmtpEncryption(e.target.value)} className="form-input">
                  <option value="none">{t('admin_nenhum', 'Nenhum')}</option>
                  <option value="tls">{t('admin_tls', 'TLS')}</option>
                  <option value="ssl">{t('admin_ssl', 'SSL')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            {t('admin_enviar_e_mail_de_teste', 'Enviar E-mail de Teste')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
            {t('admin_insere_um_e_mail_para_validar_as_configuracoes_aci', 'Insere um e-mail para validar as configurações acima antes de as guardar.')}
          </p>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, alignItems: isMobile ? 'stretch' : 'center' }}>
            <input 
              type="email" 
              className="form-input" 
              placeholder={t('admin_ex_o_teu_emailgmailcom', 'Ex: o-teu-email@gmail.com')}
              style={{ flex: 1 }}
              value={testRecipient}
              onChange={e => setTestRecipient(e.target.value)}
            />
            <button 
              className="btn-secondary" 
              onClick={handleTest}
              disabled={testing}
              style={{ whiteSpace: 'nowrap', height: 42, justifyContent: 'center' }}
            >
              {testing ? t('admin_a_enviar', 'A enviar...') : t('admin_testar_agora', 'Testar Agora')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
          <button className="btn-primary" onClick={handleSave} style={{ width: isMobile ? '100%' : 'auto', padding: '12px 30px', fontSize: 16, justifyContent: 'center' }}>
            {t('admin_guardar_alteracoes', 'Guardar Alterações')}
          </button>
        </div>
      </div>
    </div>
  );
}
