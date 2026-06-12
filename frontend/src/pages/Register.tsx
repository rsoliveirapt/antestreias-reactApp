import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, Check, X } from 'lucide-react';
import { showToast } from '../components/Toast';
import { API_BASE } from '../config';
import { useTranslation } from '../context/LanguageContext';

export default function Register() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [logo, setLogo] = useState('');
  const [socialKeys, setSocialKeys] = useState<{ google?: string; facebook?: string; twitter?: string }>({});
  const [policies, setPolicies] = useState<{ id: string; name: string; url: string }[]>([]);
  const [acceptedPolicies, setAcceptedPolicies] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'google') {
      if (!socialKeys.google) {
        showToast(t('auth_google_unavailable', 'O registo com Google está indisponível de momento (Falta configurar o Client ID nas Definições).'), 'error');
        return;
      }
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${socialKeys.google}&redirect_uri=${encodeURIComponent(window.location.origin + '/v2/api/oauth_callback.php?provider=google')}&response_type=code&scope=email%20profile`;
    } else if (provider === 'facebook') {
      if (!socialKeys.facebook) {
        showToast(t('auth_facebook_unavailable', 'O registo com Facebook está indisponível de momento (Falta configurar o App ID nas Definições).'), 'error');
        return;
      }
      window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${socialKeys.facebook}&redirect_uri=${encodeURIComponent(window.location.origin + '/v2/api/oauth_callback.php?provider=facebook')}&scope=email,public_profile`;
    } else if (provider === 'x') {
      if (!socialKeys.twitter) {
        showToast(t('auth_x_unavailable', 'O registo com X (Twitter) está indisponível de momento (Falta configurar o Client ID nas Definições).'), 'error');
        return;
      }
      window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${socialKeys.twitter}&redirect_uri=${encodeURIComponent(window.location.origin + '/v2/api/oauth_callback.php?provider=x')}&scope=users.read%20tweet.read&code_challenge=challenge&code_challenge_method=plain`;
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/admin_appearance.php`)
      .then(res => res.json())
      .then(data => {
        if (data['auth.registration_enabled'] === '0') {
          setIsRegistrationEnabled(false);
        }
        if (data['appearance.logo_light']) {
          setLogo(data['appearance.logo_light']);
        }
        setCheckingStatus(false);
      })
      .catch(() => setCheckingStatus(false));

    fetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['auth.disable_registration'] === 'true' || data['auth.disable_registration'] === '1') {
          setIsRegistrationEnabled(false);
        }
        setSocialKeys({
          google: data['auth.google_client_id'] || '',
          facebook: data['auth.facebook_client_id'] || '',
          twitter: data['auth.twitter_client_id'] || ''
        });

        if (data['gdpr.policies']) {
          try {
            const parsed = JSON.parse(data['gdpr.policies']);
            setPolicies(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setPolicies([]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const password = formData.password;
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /[0-9]/.test(password);
  const reqSpecial = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      showToast(t('auth_password_invalid', 'A palavra-passe não cumpre todos os requisitos de segurança.'), 'error');
      return;
    }

    for (const policy of policies) {
      if (!acceptedPolicies[policy.id]) {
        showToast(t('auth_policy_confirm_prefix', 'Por favor, confirma que leste e aceitas a ') + policy.name + t('auth_policy_confirm_suffix', ' para prosseguir.'), 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        if (data.requires_verification) {
          showToast(data.message || t('auth_register_verify_success', 'Conta criada com sucesso! Enviámos um código de verificação para o teu e-mail.'), 'success');
          navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } else {
          showToast(data.message || t('auth_register_success', 'Conta criada com sucesso! Podes fazer login agora.'), 'success');
          navigate('/login');
        }
      } else {
        showToast(data.error || t('auth_register_error', 'Erro no registo'), 'error');
      }
    } catch (err: any) {
      showToast(t('auth_server_error', 'Erro ao ligar ao servidor'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (checkingStatus) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="register-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)',
      padding: '40px 20px'
    }}>

      <div className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 40, borderRadius: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {logo ? (
            <img src={logo} alt="Logo" style={{ height: 60, marginBottom: 20, maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ 
              width: 64, height: 64, background: isRegistrationEnabled ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 16, display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 20px', 
              boxShadow: isRegistrationEnabled ? '0 10px 30px rgba(229, 9, 21, 0.3)' : 'none'
            }}>
              <UserPlus size={32} color={isRegistrationEnabled ? "white" : "var(--text-muted)"} />
            </div>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            {isRegistrationEnabled ? t('auth_register_title', 'Criar Conta') : t('auth_register_closed_title', 'Registos Fechados')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {isRegistrationEnabled ? t('auth_register_subtitle_new', 'Junta-te à comunidade Antestreias') : t('auth_register_closed_desc', 'Pedimos desculpa, mas os registos estão desativados temporariamente.')}
          </p>
        </div>

        {isRegistrationEnabled ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="field-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('auth_first_name_short', 'Nome')}</label>
                <input 
                  type="text" 
                  name="first_name"
                  className="form-input" 
                  placeholder={t('auth_first_name_placeholder', 'Ex: João')} 
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('auth_last_name_short', 'Apelido')}</label>
                <input 
                  type="text" 
                  name="last_name"
                  className="form-input" 
                  placeholder={t('auth_last_name_placeholder', 'Ex: Silva')} 
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('auth_username_required', 'Nome de utilizador *')}</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="text" 
                  name="username"
                  className="form-input" 
                  placeholder={t('auth_username_placeholder', 'ex: joaosilva')} 
                  required 
                  value={formData.username}
                  onChange={handleChange}
                  style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

            <div className="field-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('auth_email_required', 'E-mail *')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="email" 
                  name="email"
                  className="form-input" 
                  placeholder={t('auth_email_placeholder', 'nome@exemplo.com')} 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

            <div className="field-group" style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('auth_password_required', 'Palavra-passe *')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="password" 
                  name="password"
                  className="form-input" 
                  placeholder={t('auth_password_placeholder', '••••••••')} 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  style={{ paddingLeft: 48 }}
                />
              </div>

              {/* Password Complexity Checklist */}
              <div style={{ marginTop: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('auth_password_requirements', 'Requisitos da Palavra-passe:')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: reqLength ? '#10b981' : 'var(--text-muted)' }}>
                    {reqLength ? <Check size={16} /> : <X size={16} />}
                    <span>{t('auth_req_length', 'Mínimo 8 caracteres')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: reqUpper ? '#10b981' : 'var(--text-muted)' }}>
                    {reqUpper ? <Check size={16} /> : <X size={16} />}
                    <span>{t('auth_req_upper', 'Letra maiúscula (A-Z)')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: reqLower ? '#10b981' : 'var(--text-muted)' }}>
                    {reqLower ? <Check size={16} /> : <X size={16} />}
                    <span>{t('auth_req_lower', 'Letra minúscula (a-z)')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: reqNumber ? '#10b981' : 'var(--text-muted)' }}>
                    {reqNumber ? <Check size={16} /> : <X size={16} />}
                    <span>{t('auth_req_number', 'Número (0-9)')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: reqSpecial ? '#10b981' : 'var(--text-muted)', gridColumn: 'span 2' }}>
                    {reqSpecial ? <Check size={16} /> : <X size={16} />}
                    <span>{t('auth_req_special', 'Caractere especial (!@#$%^&* etc)')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GDPR Policies Checkboxes */}
            {policies.length > 0 && (
              <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 14, padding: '0 4px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('auth_gdpr_title', 'Termos e Privacidade *')}</p>
                {policies.map(policy => (
                  <label key={policy.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={!!acceptedPolicies[policy.id]}
                      onChange={e => setAcceptedPolicies({ ...acceptedPolicies, [policy.id]: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span>
                      {t('auth_gdpr_accept_prefix', 'Li e aceito a ')}<a href={policy.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}>{policy.name}</a> *
                    </span>
                  </label>
                ))}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {loading ? t('auth_registering', 'A criar conta...') : t('auth_register_submit_btn', 'Criar minha conta')}
            </button>

            {/* Social Login Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '30px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
              <span style={{ padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('auth_register_social_divider', 'Ou registar com')}</span>
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
                title={t('auth_register_google_title', 'Registar com Google')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.2-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              </button>
              <button 
                type="button" 
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="glass-button" 
                style={{ flex: 1, height: 48 }}
                title={t('auth_register_facebook_title', 'Registar com Facebook')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
              <button 
                type="button" 
                onClick={() => handleSocialLogin('x')}
                disabled={loading}
                className="glass-button" 
                style={{ flex: 1, height: 48 }}
                title={t('auth_register_x_title', 'Registar com X (Twitter)')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 23.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, textAlign: 'center', marginBottom: 20 }}>
             <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('auth_registration_disabled_desc', 'O administrador desativou temporariamente o registo de novas contas. Por favor, tenta mais tarde ou contacta o suporte se achares que isto é um erro.')}</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 30, fontSize: 14, color: 'var(--text-secondary)' }}>
          {isRegistrationEnabled ? (
            <>{t('auth_already_have_account_text', 'Já tens conta? ')}<Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{t('auth_login_here', 'Inicia sessão aqui')}</Link></>
          ) : (
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{t('auth_go_to_login', 'Ir para o Login')}</Link>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', opacity: 0.7 }}>
            <ArrowLeft size={14} /> {t('auth_back_to_home', 'Voltar ao Início')}
          </Link>
        </div>
      </div>
    </div>
  );
}
