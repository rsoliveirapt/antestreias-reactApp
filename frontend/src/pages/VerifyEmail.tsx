import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { showToast } from '../components/Toast';
import { API_BASE } from '../config';
import { useTranslation } from '../context/LanguageContext';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      showToast(t('verify_fill_fields_error', 'Preenche o e-mail e o código de verificação.'), 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify_email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || t('verify_success', 'E-mail validado com sucesso!'), 'success');
        navigate('/login');
      } else {
        showToast(data.message || t('verify_error', 'Erro ao validar e-mail.'), 'error');
      }
    } catch (err) {
      showToast(t('auth_server_error', 'Erro ao ligar ao servidor.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast(t('verify_enter_email_resend_error', 'Introduz o teu e-mail para reenviar o código.'), 'error');
      return;
    }

    setResending(true);
    try {
      const res = await fetch(`${API_BASE}/verify_email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', email })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || t('verify_resend_success', 'Novo código enviado!'), 'success');
      } else {
        showToast(data.message || t('verify_resend_error', 'Erro ao reenviar código.'), 'error');
      }
    } catch (err) {
      showToast(t('auth_server_error', 'Erro ao ligar ao servidor.'), 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)',
      padding: 20
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 450, padding: 40, borderRadius: 24, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(229, 9, 21, 0.3)' }}>
          <Mail size={32} color="white" />
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t('verify_title', 'Validar E-mail')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 30 }}>
          {t('verify_subtitle', 'Introduz o código de 6 dígitos que enviámos para o teu endereço de e-mail.')}
        </p>

        <form onSubmit={handleVerify}>
          <div className="field-group" style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{t('verify_email_label', 'Endereço de E-mail')}</label>
            <input 
              type="email" 
              className="form-input" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('verify_email_placeholder', 'teu.email@exemplo.com')}
            />
          </div>

          <div className="field-group" style={{ marginBottom: 30, textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{t('verify_code_label', 'Código de Verificação')}</label>
            <input 
              type="text" 
              className="form-input" 
              required
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700, padding: '16px' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}
          >
            <CheckCircle size={20} />
            {loading ? t('verify_validating', 'A validar...') : t('verify_confirm_btn', 'Confirmar e Continuar')}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
          <span>{t('verify_no_code_received', 'Não recebeste o código?')}</span>
          <button 
            type="button" 
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
          >
            <RefreshCw size={14} className={resending ? "spin" : ""} />
            {resending ? t('verify_resending', 'A reenviar...') : t('verify_resend_btn', 'Reenviar código')}
          </button>
        </div>
      </div>
    </div>
  );
}
