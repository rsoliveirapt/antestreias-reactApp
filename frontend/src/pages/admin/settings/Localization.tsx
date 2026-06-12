import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Globe } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsLocalization() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState('Europe/Lisbon');
  const [locale, setLocale] = useState('pt');
  const [dateFormat, setDateFormat] = useState('numeric');
  const [translations, setTranslations] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['app.timezone']) setTimezone(data['app.timezone']);
        if (data['app.locale']) setLocale(data['app.locale']);
        if (data['dates.format']) setDateFormat(data['dates.format']);
        if (data['app.translations']) setTranslations(data['app.translations'] === 'true');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'app.timezone': timezone,
      'app.locale': locale,
      'dates.format': dateFormat,
      'app.translations': translations,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_localizacao_guardadas_com_', 'Definições de localização guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'));
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Globe size={28} color="var(--accent)" /> {t('admin_localizacao', 'Localização')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configurar_definicoes_globais_de_data_hora_e_idiom', 'Configurar definições globais de data, hora e idioma.')}
        </p>
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_fuso_horario_padrao', 'Fuso horário padrão')}</label>
        <select value={timezone} onChange={e => setTimezone(e.target.value)} className="form-input">
          <option value="Europe/Lisbon">{t('admin_lisbon_wetwest', 'Lisbon (WET/WEST)')}</option>
          <option value="Europe/London">{t('admin_london_gmtbst', 'London (GMT/BST)')}</option>
          <option value="Europe/Madrid">{t('admin_madrid_cetcest', 'Madrid (CET/CEST)')}</option>
          <option value="America/Sao_Paulo">{t('admin_sao_paulo_brt', 'São Paulo (BRT)')}</option>
          <option value="UTC">{t('admin_utc', 'UTC')}</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('admin_que_fuso_horario_deve_ser_selecionado_por_defeito', 'Que fuso horário deve ser selecionado por defeito para novos utilizadores e convidados.')}
        </p>
      </div>

      <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_idioma_padrao', 'Idioma padrão')}</label>
        <select value={locale} onChange={e => setLocale(e.target.value)} className="form-input">
          <option value="auto">{t('admin_automatico_detectado_pelo_browser', 'Automático (Detectado pelo browser)')}</option>
          <option value="pt">{t('admin_portugues', 'Português')}</option>
          <option value="en">{t('admin_english', 'English')}</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('admin_que_localizacao_deve_ser_selecionada_por_defeito_p', 'Que localização deve ser selecionada por defeito para novos utilizadores e convidados.')}
        </p>
      </div>

      <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_verbosidade_da_data', 'Verbosidade da data')}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { id: 'auto', label: t('admin_automatico', 'Automático') },
            { id: 'numeric', label: '23/04/2026' },
            { id: 'short', label: t('admin_23_de_abr_de_2026', '23 de abr. de 2026') },
            { id: 'long', label: t('admin_23_de_abril_de_2026', '23 de abril de 2026') },
            { id: 'full', label: '23/04/2026, 21:43:37' },
            { id: 'time', label: '21:43' },
          ].map(opt => (
            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="dateFormat" 
                checked={dateFormat === opt.id} 
                onChange={() => setDateFormat(opt.id)} 
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 15 }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
          {t('admin_verbosidade_padrao_para_todas_as_datas_exibidas_no_s', 'Verbosidade padrão para todas as datas exibidas no site. A ordem mês/dia e os separadores serão ajustados automaticamente com base na localização do utilizador.')}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        <label className="toggle-switch">
          <input type="checkbox" checked={translations} onChange={e => setTranslations(e.target.checked)} />
          <span className="toggle-slider"></span>
        </label>
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_ativar_traducoes', 'Ativar traduções')}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_se_desativado_o_site_sera_sempre_mostrad', 'Se desativado, o site será sempre mostrado no idioma padrão e o utilizador não poderá alterar a sua localização.')}</span>
        </div>
      </div>

      <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSave}>
        {t('admin_save_changes', 'Save changes')}
      </button>
    </div>
  );
}
