import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { showToast } from '../components/Toast';
import { API_BASE } from '../config';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forgot_password.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("A resposta do servidor não é um JSON válido.");
      }

      if (res.ok && data.success) {
        setSubmitted(true);
        showToast(data.message || t('auth_reset_link_sent', 'E-mail de recuperação enviado!'));
      } else {
        showToast(data.error || t('auth_reset_link_error', 'Ocorreu um erro ao processar o pedido.'), 'error');
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      showToast(err.message || t('auth_server_error_toast', 'Erro ao ligar ao servidor'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)',
      padding: 20
    }}>

      <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(229, 9, 21, 0.3)' }}>
            <KeyRound size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t('auth_forgot_title', 'Recuperar Palavra-passe')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {t('auth_forgot_subtitle', 'Introduz o teu e-mail para receberes as instruções')}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="field-group" style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {t('auth_email', 'E-mail')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder={t('auth_email_placeholder', 'nome@exemplo.com')} 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {loading ? t('btn_sending', 'A enviar...') : t('btn_send_instructions', 'Enviar Instruções')}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
            <p style={{ marginBottom: 20, color: '#4caf50', fontWeight: 600 }}>
              {t('auth_reset_success_msg', 'Instruções enviadas com sucesso!')}
            </p>
            <p>
              {t('auth_reset_success_desc', 'Se o e-mail introduzido estiver registado, receberás um link de recuperação em breve. Por favor, verifica também a pasta de Spam.')}
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 30, display: 'flex', justifyContent: 'center' }}>
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <ArrowLeft size={16} /> {t('auth_back_login', 'Voltar ao Login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
