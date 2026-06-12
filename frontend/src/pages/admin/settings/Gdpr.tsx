import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Scale, Plus, X } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

interface Policy {
  id: string;
  name: string;
  url: string;
}

export default function SettingsGdpr() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [cookieNotice, setCookieNotice] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        setCookieNotice(data['gdpr.cookie_notice'] === 'true' || data['gdpr.cookie_notice'] === '1');
        if (data['gdpr.policies']) {
          try {
            setPolicies(JSON.parse(data['gdpr.policies']));
          } catch (e) {
            setPolicies([]);
          }
        }
        setLoading(false);
      });
  }, []);

  const addPolicy = () => {
    const newPolicy = { id: Date.now().toString(), name: '', url: '' };
    setPolicies([...policies, newPolicy]);
  };

  const removePolicy = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id));
  };

  const updatePolicy = (id: string, field: 'name' | 'url', value: string) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    const settings = {
      'gdpr.cookie_notice': cookieNotice ? 'true' : 'false',
      'gdpr.policies': JSON.stringify(policies),
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_rgpd_guardadas_com_sucesso', 'Definições de RGPD guardadas com sucesso!'));
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
          <Scale size={28} color="var(--accent)" /> RGPD
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configurar_definicoes_relacionadas_com_o_regulamen', 'Configurar definições relacionadas com o Regulamento Geral sobre a Proteção de Dados (RGPD) da UE.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        
        {/* Cookie Notice Toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 30 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={cookieNotice} onChange={e => setCookieNotice(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_ativar_aviso_de_cookies', 'Ativar aviso de cookies')}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_se_o_aviso_de_cookies_deve_ser_mostrado_', 'Se o aviso de cookies deve ser mostrado automaticamente a utilizadores da UE até ser aceite.')}</span>
          </div>
        </div>

        {/* Policies Section */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30, marginBottom: 30 }}>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>{t('admin_politicas_de_registo', 'Políticas de registo')}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            {t('admin_cria_politicas_que_serao_mostradas_na_pagina_de_re', 'Cria políticas que serão mostradas na página de registo. O utilizador será obrigado a aceitá-las marcando uma caixa de seleção.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {policies.map((policy) => (
              <div key={policy.id} className="glass" style={{ padding: 20, borderRadius: 12, position: 'relative', border: '1px solid var(--glass-border)' }}>
                <button 
                  onClick={() => removePolicy(policy.id)}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_nome_da_politica', 'Nome da política')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={t('admin_ex_politica_de_privacidade', 'Ex: Política de Privacidade')}
                      value={policy.name}
                      onChange={e => updatePolicy(policy.id, 'name', e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_link_url', 'Link (URL)')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="https://exemplo.com/privacidade"
                      value={policy.url}
                      onChange={e => updatePolicy(policy.id, 'url', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="btn-add-policy" 
            onClick={addPolicy}
          >
            <Plus size={18} /> {t('admin_adicionar_outra_politica', 'Adicionar outra política')}
          </button>
        </div>

        <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
