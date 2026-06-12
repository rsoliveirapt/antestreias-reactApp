import { useState, useEffect } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsRegistration() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    'auth.registration_enabled': '1',
    'auth.email_verification': '0',
    'auth.default_role': 'Utilizador'
  });

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php?group=auth`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_registo_guardadas_com_suce', 'Definições de registo guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <UserPlus size={28} color="var(--accent)" /> {t('admin_registos', 'Registos')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configura_como_novos_utilizadores_entram_na_plataf', 'Configura como novos utilizadores entram na plataforma.')}
        </p>
      </div>

      {/* Registration Enabled */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={settings['auth.registration_enabled'] === '1'} 
            onChange={(e) => setSettings({ ...settings, 'auth.registration_enabled': e.target.checked ? '1' : '0' })}
          />
          <span className="toggle-slider"></span>
        </label>
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_permitir_novos_registos', 'Permitir novos registos')}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_ativa_ou_desativa_a_criacao_de_novas_con', 'Ativa ou desativa a criação de novas contas na aplicação.')}</span>
        </div>
      </div>

      {/* Email Verification */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={settings['auth.email_verification'] === '1'} 
            onChange={(e) => setSettings({ ...settings, 'auth.email_verification': e.target.checked ? '1' : '0' })}
          />
          <span className="toggle-slider"></span>
        </label>
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_verificacao_de_e_mail', 'Verificação de E-mail')}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_exigir_que_os_utilizadores_confirmem_o_e', 'Exigir que os utilizadores confirmem o e-mail antes de aceder.')}</span>
        </div>
      </div>

      {/* Default Role */}
      <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_cargo_padrao_para_novos_utilizadores', 'Cargo padrão para novos utilizadores')}</label>
        <select 
          className="form-input"
          value={settings['auth.default_role']}
          onChange={(e) => setSettings({ ...settings, 'auth.default_role': e.target.value })}
          style={{ width: '100%', maxWidth: 300 }}
        >
          <option value="Utilizador">{t('admin_utilizador', 'Utilizador')}</option>
          <option value="Editor">{t('admin_editor', 'Editor')}</option>
          <option value="Administrador">{t('admin_administrador', 'Administrador')}</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('admin_este_cargo_sera_atribuido_automaticamente_a_todos', 'Este cargo será atribuído automaticamente a todos os novos utilizadores registados.')}
        </p>
      </div>

      <button 
        className="btn-primary" 
        style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 180 }} 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <div className="spinner" /> : <Save size={18} />}
        {saving ? t('admin_a_guardar', 'A guardar...') : t('admin_guardar_alteracoes', 'Guardar Alterações')}
      </button>
    </div>
  );
}
