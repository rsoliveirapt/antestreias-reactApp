import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { FileText, Info } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsLogging() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sentryDsn, setSentryDsn] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['logging.sentry_dsn']) setSentryDsn(data['logging.sentry_dsn']);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'logging.sentry_dsn': sentryDsn,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_registo_guardadas_com_suce', 'Definições de registo guardadas com sucesso!'));
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
          <FileText size={28} color="var(--accent)" /> {t('admin_registo_de_erros', 'Registo de erros')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configurar_o_registo_de_erros_do_site_e_integracoe', 'Configurar o registo de erros do site e integrações de terceiros relacionadas.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_dsn_do_sentry', 'DSN do Sentry')}</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="https://key@sentry.io/project"
            value={sentryDsn}
            onChange={e => setSentryDsn(e.target.value)}
          />
        </div>

        <div className="glass" style={{ marginBottom: 40, padding: 20, background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: 8, display: 'flex', gap: 16 }}>
           <Info size={20} color="#22c55e" style={{ flexShrink: 0 }} />
           <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
             {t('admin_a_integracao_com_o', 'A integração com o')} <strong style={{ color: '#E50914' }}>{t('admin_sentry', 'Sentry')}</strong> {t('admin_fornece_rastreio_de_erros_em_tempo_real_e_ajuda_a', 'fornece rastreio de erros em tempo real e ajuda a identificar e corrigir problemas quando o site está em produção.')}
           </p>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
