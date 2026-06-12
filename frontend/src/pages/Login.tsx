import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { showToast } from '../components/Toast';
import { API_BASE } from '../config';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialKeys, setSocialKeys] = useState<{ google?: string; facebook?: string; twitter?: string }>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        setSocialKeys({
          google: data['auth.google_client_id'] || '',
          facebook: data['auth.facebook_client_id'] || '',
          twitter: data['auth.twitter_client_id'] || ''
        });
      })
      .catch(() => {});
  }, []);

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'google') {
      if (!socialKeys.google) {
        showToast(t('auth_google_unavailable', 'O início de sessão com Google está indisponível de momento (Falta configurar o Client ID nas Definições).'), 'error');
        return;
      }
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${socialKeys.google}&redirect_uri=${encodeURIComponent(window.location.origin + '/v2/api/oauth_callback.php?provider=google')}&response_type=code&scope=email%20profile`;
    } else if (provider === 'facebook') {
      if (!socialKeys.facebook) {
        showToast(t('auth_facebook_unavailable', 'O início de sessão com Facebook está indisponível de momento (Falta configurar o App ID nas Definições).'), 'error');
        return;
      }
      window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${socialKeys.facebook}&redirect_uri=${encodeURIComponent(window.location.origin + '/v2/api/oauth_callback.php?provider=facebook')}&scope=email,public_profile`;
    } else if (provider === 'x') {
      if (!socialKeys.twitter) {
        showToast(t('auth_twitter_unavailable', 'O início de sessão com X (Twitter) está indisponível de momento (Falta configurar o Client ID nas Definições).'), 'error');
        return;
      }
      window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${socialKeys.twitter}&redirect_uri=${encodeURIComponent(window.location.origin + '/v2/api/oauth_callback.php?provider=x')}&scope=users.read%20tweet.read&code_challenge=challenge&code_challenge_method=plain`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { email, password };
      if (requires2FA) {
        payload.code = twoFactorCode;
      }

      const res = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Servidor respondeu com erro ${res.status}`);
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Erro ao processar JSON:", text);
        throw new Error("A resposta do servidor não é um JSON válido.");
      }
      
      if (data.success) {
        if (data.requires_2fa) {
          setRequires2FA(true);
          setTwoFactorCode(''); // Reset code field
          showToast(t('auth_enter_2fa_toast', 'Introduz o código de 6 dígitos da tua app Authenticator.'));
        } else {
          login(data.user);
          showToast(t('auth_welcome_back_toast', 'Bem-vindo de volta!'));
          if (data.user.role?.split(',').includes('Administrador')) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
      } else {
        if (data.requires_email_verification) {
          showToast(data.message || t('auth_verify_email_toast', 'Por favor, confirma o teu endereço de e-mail antes de iniciares sessão.'), 'error');
          navigate(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
        } else {
          showToast(data.message || t('auth_login_error_toast', 'Erro no login'), 'error');
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
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
            <LogIn size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t('auth_login_title', 'Iniciar Sessão')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('auth_login_subtitle', 'Acede ao teu painel de gestão')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!requires2FA ? (
            <>
              <div className="field-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('auth_email', 'E-mail')}</label>
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

              <div className="field-group" style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('auth_password', 'Palavra-passe')}</label>
                  <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{t('auth_forgot_password', 'Esqueceu-se?')}</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingLeft: 48 }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 30, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#4caf50' }}>
                <ShieldCheck size={30} />
              </div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 }}>{t('auth_2fa_code', 'Código de 6 dígitos')}</label>
              <input 
                type="text" 
                maxLength={6}
                className="form-input" 
                placeholder={t('auth_2fa_placeholder', '000 000')} 
                required 
                autoFocus
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 5, padding: '15px' }}
              />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 15 }}>{t('auth_2fa_desc', 'Abre a tua app de autenticação para ver o código.')}</p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            {loading ? t('auth_btn_verifying', 'A verificar...') : (requires2FA ? t('auth_btn_verify_enter', 'Verificar e Entrar') : t('auth_btn_enter_panel', 'Entrar no Painel'))}
          </button>

          {/* Social Login Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '30px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            <span style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('auth_social_or', 'Ou entrar com')}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
          </div>

          {/* Social Login Buttons */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="glass-button" 
              style={{ flex: 1, height: 48 }}
              title={t('auth_title_google', 'Entrar com Google')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            </button>
            <button 
              type="button" 
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              className="glass-button" 
              style={{ flex: 1, height: 48 }}
              title={t('auth_title_facebook', 'Entrar com Facebook')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            <button 
              type="button" 
              onClick={() => handleSocialLogin('x')}
              disabled={loading}
              className="glass-button" 
              style={{ flex: 1, height: 48 }}
              title={t('auth_title_twitter', 'Entrar com X (Twitter)')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 23.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
          </div>

          {requires2FA && (
            <button 
              type="button"
              onClick={() => setRequires2FA(false)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', marginTop: 15, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              {t('btn_cancel_back', 'Cancelar e voltar')}
            </button>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 30, fontSize: 14, color: 'var(--text-secondary)' }}>
          {t('auth_no_account_prompt', 'Ainda não tens conta? ')} <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{t('auth_register_here', 'Regista-te aqui')}</Link>
        </div>
      </div>
    </div>
  );
}
