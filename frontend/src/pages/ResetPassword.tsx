import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, LockKeyhole, ArrowLeft, Check, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { showToast } from '../components/Toast';
import { API_BASE } from '../config';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password requirements checklist
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast(t('auth_reset_missing_token', 'Token de recuperação em falta. Por favor, utilize o link enviado no e-mail.'), 'error');
      return;
    }

    if (!isPasswordValid) {
      showToast(t('auth_password_weak', 'A palavra-passe não cumpre os requisitos de segurança.'), 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast(t('auth_passwords_mismatch', 'As palavras-passe não coincidem.'), 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reset_password.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("A resposta do servidor não é um JSON válido.");
      }

      if (res.ok && data.success) {
        showToast(data.message || t('auth_password_reset_success', 'Palavra-passe redefinida com sucesso!'));
        navigate('/login');
      } else {
        showToast(data.error || t('auth_password_reset_error', 'Erro ao redefinir a palavra-passe.'), 'error');
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
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
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(229, 9, 21, 0.3)' }}>
            <LockKeyhole size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t('auth_reset_title', 'Nova Palavra-passe')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {t('auth_reset_subtitle', 'Escolhe a tua nova palavra-passe de acesso')}
          </p>
        </div>

        {!token ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, padding: '20px 0' }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 20 }}>
              {t('auth_reset_invalid_token', 'Ligação Inválida ou Expirada')}
            </p>
            <p style={{ marginBottom: 20 }}>
              {t('auth_reset_invalid_desc', 'Esta ligação de recuperação já não é válida. Por favor, solicita um novo pedido de recuperação.')}
            </p>
            <Link to="/forgot-password" className="btn-primary" style={{ display: 'block', padding: '12px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>
              {t('btn_request_again', 'Solicitar Nova Recuperação')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {t('auth_new_password', 'Nova Palavra-passe')}
              </label>
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

            <div className="field-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {t('auth_confirm_password', 'Confirmar Palavra-passe')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  required 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

            {/* Password rules checklist */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, marginBottom: 30, fontSize: 13, border: '1px solid var(--glass-border)' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('auth_password_rules_title', 'A palavra-passe deve conter:')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: rules.length ? '#4caf50' : 'var(--text-secondary)' }}>
                  {rules.length ? <Check size={14} /> : <X size={14} />} {t('auth_rule_length', 'Mínimo de 8 caracteres')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: rules.upper ? '#4caf50' : 'var(--text-secondary)' }}>
                  {rules.upper ? <Check size={14} /> : <X size={14} />} {t('auth_rule_upper', 'Pelo menos uma letra maiúscula')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: rules.lower ? '#4caf50' : 'var(--text-secondary)' }}>
                  {rules.lower ? <Check size={14} /> : <X size={14} />} {t('auth_rule_lower', 'Pelo menos uma letra minúscula')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: rules.number ? '#4caf50' : 'var(--text-secondary)' }}>
                  {rules.number ? <Check size={14} /> : <X size={14} />} {t('auth_rule_number', 'Pelo menos um número')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: rules.special ? '#4caf50' : 'var(--text-secondary)' }}>
                  {rules.special ? <Check size={14} /> : <X size={14} />} {t('auth_rule_special', 'Pelo menos um caractere especial (!@#$%^&*)')}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || !isPasswordValid || password !== confirmPassword}
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {loading ? t('btn_saving', 'A guardar...') : t('btn_change_password', 'Alterar Palavra-passe')}
            </button>
          </form>
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
