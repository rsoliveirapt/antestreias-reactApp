import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { ShieldCheck } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsRecaptcha() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  // Settings State
  const [contactPage, setContactPage] = useState(false);
  const [registerPage, setRegisterPage] = useState(false);
  const [siteKey, setSiteKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        setContactPage(data['recaptcha.contact'] === 'true');
        setRegisterPage(data['recaptcha.register'] === 'true');
        setSiteKey(data['recaptcha.site_key'] || '');
        setSecretKey(data['recaptcha.secret_key'] || '');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'recaptcha.contact': contactPage,
      'recaptcha.register': registerPage,
      'recaptcha.site_key': siteKey,
      'recaptcha.secret_key': secretKey,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_recaptcha_guardadas_com_su', 'Definições de reCAPTCHA guardadas com sucesso!'));
      }
    } catch (err) {
      showToast('Erro ao guardar definições.', 'error');
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={28} color="var(--accent)" /> Recaptcha
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configurar_a_integracao_e_credenciais_do_google_re', 'Configurar a integração e credenciais do Google reCAPTCHA.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>

        {/* Contact Page Toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={contactPage} onChange={e => setContactPage(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_pagina_de_contacto', 'Página de contacto')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_ativar_a_integracao_do_recaptcha_para_a_', 'Ativar a integração do reCAPTCHA para a página "contacte-nos".')}</span>
          </div>
        </div>

        {/* Register Page Toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={registerPage} onChange={e => setRegisterPage(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_pagina_de_registo', 'Página de registo')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_ativar_a_integracao_do_recaptcha_para_a_', 'Ativar a integração do reCAPTCHA para a página de registo.')}</span>
          </div>
        </div>

        {/* Site Key */}
        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_chave_de_site_recaptcha_v3', 'Chave de site reCAPTCHA v3')}</label>
          <input
            type="text"
            className="form-input"
            placeholder={t('admin_insira_a_sua_site_key', 'Insira a sua Site Key')}
            value={siteKey}
            onChange={e => setSiteKey(e.target.value)}
          />
        </div>

        {/* Secret Key */}
        <div style={{ marginBottom: 40, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_chave_secreta_recaptcha_v3', 'Chave secreta reCAPTCHA v3')}</label>
          <input
            type="password"
            className="form-input"
            placeholder={t('admin_insira_a_sua_secret_key', 'Insira a sua Secret Key')}
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
