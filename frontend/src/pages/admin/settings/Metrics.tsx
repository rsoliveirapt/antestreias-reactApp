import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { BarChart3, ExternalLink } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsMetrics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  // Settings State
  const [propertyId, setPropertyId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [hasJsonFile, setHasJsonFile] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['analytics.property_id']) setPropertyId(data['analytics.property_id']);
        if (data['analytics.tracking_code']) setTrackingCode(data['analytics.tracking_code']);
        if (data['analytics.google_maps_api_key']) setMapsApiKey(data['analytics.google_maps_api_key']);
        if (data['analytics.service_account_json']) setHasJsonFile(true);
        
        setLoading(false);
      });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
          JSON.parse(content); // Validate JSON
          saveSetting('analytics.service_account_json', content);
          setHasJsonFile(true);
          showToast(t('admin_ficheiro_json_carregado_com_sucesso', 'Ficheiro JSON carregado com sucesso!'));
        } catch (err) {
          showToast('Ficheiro JSON inválido.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const saveSetting = async (name: string, value: string) => {
    try {
      await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [name]: value })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    const settings = {
      'analytics.property_id': propertyId,
      'analytics.tracking_code': trackingCode,
      'analytics.google_maps_api_key': mapsApiKey,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_metricas_guardadas_com_suc', 'Definições de métricas guardadas com sucesso!'));
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
          <BarChart3 size={28} color="var(--accent)" /> {t('admin_metricas', 'Métricas')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configurar_a_integracao_e_credenciais_do_google_an', 'Configurar a integração e credenciais do Google Analytics.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        
        {/* Google JSON Key */}
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
            {t('admin_ficheiro_de_chave_de_conta_de_servico_google_json', 'Ficheiro de chave de conta de serviço Google (.json)')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                <button className="btn-primary" style={{ background: '#E50914', padding: '10px 20px', fontSize: 14 }}>
                  {hasJsonFile ? t('admin_substituir_ficheiro', 'Substituir ficheiro') : t('admin_choose_file', 'Choose File')}
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload}
                  style={{ position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} 
                />
             </div>
             <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
               {hasJsonFile ? t('admin_ficheiro_configurado', '✓ Ficheiro configurado') : t('admin_no_file_chosen', 'No file chosen')}
             </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_necessario_para_importar_dados_do_google_analytics', 'Necessário para importar dados do Google Analytics.')} 
            <a href="https://support.google.com/analytics/answer/10089681" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              <ExternalLink size={14} /> {t('admin_saber_mais', 'Saber mais')}
            </a>
          </p>
        </div>

        {/* Property ID */}
        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_id_de_propriedade_google_analytics', 'ID de propriedade Google Analytics')}</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('admin_ex_123456789', 'Ex: 123456789')}
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
          />
        </div>

        {/* GTM / Tracking ID */}
        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_id_de_medicao_do_google_tag_manager', 'ID de medição do Google Tag Manager')}</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('admin_g_', 'G-******')}
            value={trackingCode}
            onChange={e => setTrackingCode(e.target.value)}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_apenas_o_id_de_medicao_do_google_analytics_nao_o_s', 'Apenas o ID de medição do Google Analytics, não o snippet de JavaScript completo.')}
          </p>
        </div>

        {/* Maps API Key */}
        <div style={{ marginBottom: 40, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_chave_de_api_javascript_do_google_maps', 'Chave de API JavaScript do Google Maps')}</label>
          <input 
            type="text" 
            className="form-input" 
            value={mapsApiKey}
            onChange={e => setMapsApiKey(e.target.value)}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_necessario_apenas_para_mostrar_o_mapa_geografico_m', 'Necessário apenas para mostrar o mapa geográfico mundial em páginas de analítica integradas.')}
            <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              <ExternalLink size={14} /> {t('admin_saber_mais', 'Saber mais')}
            </a>
          </p>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
