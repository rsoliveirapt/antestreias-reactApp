import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Shield, Mail, Users, Share2, Ban } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsAuth() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [mailConfigured, setMailConfigured] = useState(false);

  // Settings State
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [disableRegistration, setDisableRegistration] = useState(false);
  const [socialRequiresAccount, setSocialRequiresAccount] = useState(false);
  const [singleDevice, setSingleDevice] = useState(false);
  const [compactSocial, setCompactSocial] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookClientId, setFacebookClientId] = useState('');
  const [facebookClientSecret, setFacebookClientSecret] = useState('');
  const [twitterEnabled, setTwitterEnabled] = useState(false);
  const [twitterClientId, setTwitterClientId] = useState('');
  const [twitterClientSecret, setTwitterClientSecret] = useState('');
  const [domainBlacklist, setDomainBlacklist] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setConfirmEmail(data['auth.confirm_email'] === 'true' || data['auth.confirm_email'] === '1');
        setDisableRegistration(data['auth.disable_registration'] === 'true' || data['auth.disable_registration'] === '1');
        setSocialRequiresAccount(data['auth.social_login_requires_account'] === 'true' || data['auth.social_login_requires_account'] === '1');
        setSingleDevice(data['auth.single_device_login'] === 'true' || data['auth.single_device_login'] === '1');
        setCompactSocial(data['auth.compact_social_buttons'] === 'true' || data['auth.compact_social_buttons'] === '1');
        setGoogleEnabled(data['auth.google_login_enabled'] === 'true' || data['auth.google_login_enabled'] === '1');
        setGoogleClientId(data['auth.google_client_id'] || '');
        setGoogleClientSecret(data['auth.google_client_secret'] || '');
        setFacebookEnabled(data['auth.facebook_login_enabled'] === 'true' || data['auth.facebook_login_enabled'] === '1');
        setFacebookClientId(data['auth.facebook_client_id'] || '');
        setFacebookClientSecret(data['auth.facebook_client_secret'] || '');
        setTwitterEnabled(data['auth.twitter_login_enabled'] === 'true' || data['auth.twitter_login_enabled'] === '1');
        setTwitterClientId(data['auth.twitter_client_id'] || '');
        setTwitterClientSecret(data['auth.twitter_client_secret'] || '');
        setDomainBlacklist(data['auth.domain_blacklist'] || '');
        
        // Check if mail is configured (simplified check)
        setMailConfigured(!!data['mail.handler']);
        
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'auth.confirm_email': confirmEmail ? 'true' : 'false',
      'auth.disable_registration': disableRegistration ? 'true' : 'false',
      'auth.social_login_requires_account': socialRequiresAccount ? 'true' : 'false',
      'auth.single_device_login': singleDevice ? 'true' : 'false',
      'auth.compact_social_buttons': compactSocial ? 'true' : 'false',
      'auth.google_login_enabled': googleEnabled ? 'true' : 'false',
      'auth.google_client_id': googleClientId,
      'auth.google_client_secret': googleClientSecret,
      'auth.facebook_login_enabled': facebookEnabled ? 'true' : 'false',
      'auth.facebook_client_id': facebookClientId,
      'auth.facebook_client_secret': facebookClientSecret,
      'auth.twitter_login_enabled': twitterEnabled ? 'true' : 'false',
      'auth.twitter_client_id': twitterClientId,
      'auth.twitter_client_secret': twitterClientSecret,
      'auth.domain_blacklist': domainBlacklist,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_guardadas_com_sucesso', 'Definições guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'), 'error');
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={28} color="var(--accent)" /> {t('admin_seguranca_e_autenticacao', 'Segurança e Autenticação')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configura_as_opcoes_de_registo_inicio_de_sessao_e', 'Configura as opções de registo, início de sessão e fornecedores OAuth.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        {/* Confirm Email */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={confirmEmail} onChange={e => setConfirmEmail(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_exigir_confirmacao_de_e_mail', 'Exigir confirmação de e-mail')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_exigir_que_os_utilizadores_recem_regista', 'Exigir que os utilizadores recém-registados validem o seu endereço de e-mail antes de poderem iniciar sessão.')}</span>
            
            {!mailConfigured && (
              <div className="glass" style={{ marginTop: 16, padding: 20, border: '1px solid rgba(229, 9, 21, 0.2)', borderRadius: 8 }}>
                <p style={{ color: '#E50914', fontSize: 14, marginBottom: 12 }}>
                  {t('admin_o_metodo_de_e_mail_de_saida_precisa_de_ser_configu', 'O método de e-mail de saída precisa de ser configurado antes de ativar esta definição.')}
                </p>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>{t('admin_corrigir_agora', 'Corrigir agora')}</button>
              </div>
            )}
          </div>
        </div>

        {/* Disable Registration */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={disableRegistration} onChange={e => setDisableRegistration(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_desativar_registo', 'Desativar registo')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_todas_as_funcionalidades_relacionadas_co', 'Todas as funcionalidades relacionadas com o registo serão desativadas e ocultadas para os utilizadores.')}</span>
          </div>
        </div>

        {/* Social Login Requires Account */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={socialRequiresAccount} onChange={e => setSocialRequiresAccount(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_social_login_requires_existing_account', 'Social login requires existing account')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_se_ativado_os_utilizadores_so_poderao_in', 'Se ativado, os utilizadores só poderão iniciar sessão via rede social se já tiverem uma conta ligada.')}</span>
          </div>
        </div>

        {/* Single Device Login */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={singleDevice} onChange={e => setSingleDevice(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_inicio_de_sessao_num_unico_dispositivo', 'Início de sessão num único dispositivo')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_permitir_que_apenas_um_dispositivo_tenha', 'Permitir que apenas um dispositivo tenha sessão iniciada na conta do utilizador ao mesmo tempo.')}</span>
          </div>
        </div>

        {/* Compact Social Buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={compactSocial} onChange={e => setCompactSocial(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_botoes_compactos', 'Botões compactos')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_utilizar_design_compacto_para_os_botoes_', 'Utilizar design compacto para os botões de início de sessão social.')}</span>
          </div>
        </div>

        {/* Social Providers */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30, marginBottom: 30 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Share2 size={18} className="accent-text" /> {t('admin_fornecedores_sociais_oauth_20_api_keys', 'Fornecedores Sociais (OAuth 2.0 / API Keys)')}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
            {/* Google */}
            <div className="glass" style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: googleEnabled ? 20 : 0 }}>
                <label className="toggle-switch">
                  <input type="checkbox" checked={googleEnabled} onChange={e => setGoogleEnabled(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t('admin_inicio_de_sessao_google', 'Início de sessão Google')}</span>
              </div>

              {googleEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderTop: '1px solid var(--glass-border)', paddingTop: 20 }}>
                  <div className="field-group">
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('admin_client_id', 'Client ID *')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={t('admin_ex_123456789_abcappsgoogleusercontentcom', 'ex: 123456789-abc.apps.googleusercontent.com')} 
                      value={googleClientId}
                      onChange={e => setGoogleClientId(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('admin_client_secret', 'Client Secret *')}</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••••••••••••••••••••••" 
                      value={googleClientSecret}
                      onChange={e => setGoogleClientSecret(e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-muted)' }}>
                    {t('admin_url_de_redirecionamento_callback', 'URL de Redirecionamento (Callback):')} <code style={{ color: 'var(--accent)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>{window.location.origin}/v2/api/oauth_callback.php?provider=google</code>
                  </div>
                </div>
              )}
            </div>

            {/* Facebook */}
            <div className="glass" style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: facebookEnabled ? 20 : 0 }}>
                <label className="toggle-switch">
                  <input type="checkbox" checked={facebookEnabled} onChange={e => setFacebookEnabled(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t('admin_inicio_de_sessao_facebook', 'Início de sessão Facebook')}</span>
              </div>

              {facebookEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderTop: '1px solid var(--glass-border)', paddingTop: 20 }}>
                  <div className="field-group">
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('admin_app_id', 'App ID *')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={t('admin_ex_987654321098765', 'ex: 987654321098765')} 
                      value={facebookClientId}
                      onChange={e => setFacebookClientId(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('admin_app_secret', 'App Secret *')}</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••••••••••••••••••••••" 
                      value={facebookClientSecret}
                      onChange={e => setFacebookClientSecret(e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-muted)' }}>
                    {t('admin_url_de_redirecionamento_callback', 'URL de Redirecionamento (Callback):')} <code style={{ color: 'var(--accent)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>{window.location.origin}/v2/api/oauth_callback.php?provider=facebook</code>
                  </div>
                </div>
              )}
            </div>

            {/* Twitter (X) */}
            <div className="glass" style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: twitterEnabled ? 20 : 0 }}>
                <label className="toggle-switch">
                  <input type="checkbox" checked={twitterEnabled} onChange={e => setTwitterEnabled(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t('admin_inicio_de_sessao_x_twitter', 'Início de sessão X (Twitter)')}</span>
              </div>

              {twitterEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderTop: '1px solid var(--glass-border)', paddingTop: 20 }}>
                  <div className="field-group">
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('admin_client_id', 'Client ID *')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={t('admin_ex_abc123xyz', 'ex: abc123XYZ')} 
                      value={twitterClientId}
                      onChange={e => setTwitterClientId(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('admin_client_secret', 'Client Secret *')}</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••••••••••••••••••••••" 
                      value={twitterClientSecret}
                      onChange={e => setTwitterClientSecret(e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-muted)' }}>
                    {t('admin_url_de_redirecionamento_callback', 'URL de Redirecionamento (Callback):')} <code style={{ color: 'var(--accent)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>{window.location.origin}/v2/api/oauth_callback.php?provider=x</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain Blacklist */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30, marginBottom: 30 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ban size={18} className="accent-text" /> {t('admin_lista_negra_de_dominios', 'Lista negra de domínios')}
          </h3>
          <textarea 
            className="form-input" 
            style={{ height: 120, resize: 'vertical' }}
            placeholder={t('admin_exemplocom_tempmailorg', 'exemplo.com, tempmail.org')}
            value={domainBlacklist}
            onChange={e => setDomainBlacklist(e.target.value)}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_lista_de_dominios_separada_por_virgulas_os_utiliza', 'Lista de domínios separada por vírgulas. Os utilizadores não poderão registar-se ou iniciar sessão utilizando qualquer endereço de e-mail dos domínios especificados.')}
          </p>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
