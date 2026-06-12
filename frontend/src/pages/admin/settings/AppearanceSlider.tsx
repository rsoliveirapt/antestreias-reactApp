import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MonitorPlay } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function AppearanceSlider() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState({
    'slider.enabled': '1',
    'slider.type': 'latest', // latest, featured, manual
    'slider.autoplay': '1',
    'slider.interval': '5000',
    'slider.count': '5',
    'slider.manual_ids': ''
  });

  const [showModal, setShowModal] = useState(false);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_appearance.php`)
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    // Fetch media titles for manual selection names
    apiFetch(`${API_BASE}/movies.php`)
      .then(res => res.json())
      .then(data => setMediaItems(data))
      .catch(() => {});
  }, []);

  const openModal = () => {
    setShowModal(true);
  };

  const handleChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_appearance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_definicoes_do_slider_guardadas', 'Definições do slider guardadas!'));
        setHasChanges(false);
      } else {
        showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'), 'error');
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-primary)' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <MonitorPlay size={28} color="var(--accent)" /> {t('admin_slider_da_pagina_inicial', 'Slider da Página Inicial')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configura_o_comportamento_e_os_itens_exibidos_no_s', 'Configura o comportamento e os itens exibidos no slider de destaque da página principal.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30, marginBottom: 40 }}>
          
          <div className="field-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_ativar_slider', 'Ativar Slider')}</label>
            <select 
              className="form-input"
              value={settings['slider.enabled']}
              onChange={e => handleChange('slider.enabled', e.target.value)}
            >
              <option value="1">{t('admin_sim', 'Sim')}</option>
              <option value="0">{t('admin_nao', 'Não')}</option>
            </select>
          </div>

          <div className="field-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_tipo_de_conteudo', 'Tipo de Conteúdo')}</label>
            <select 
              className="form-input"
              value={settings['slider.type']}
              onChange={e => handleChange('slider.type', e.target.value)}
            >
              <option value="latest">{t('admin_ultimos_adicionados', 'Últimos Adicionados')}</option>
              <option value="featured">{t('admin_em_destaque', 'Em Destaque')}</option>
              <option value="manual">{t('admin_selecao_manual', 'Seleção Manual')}</option>
            </select>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{t('admin_como_os_items_sao_escolhidos_para_o_slid', 'Como os items são escolher para o slider.')}</p>
          </div>

          {settings['slider.type'] === 'manual' && (
            <div className="field-group" style={{ marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>{t('admin_itens_selecionados', 'Itens Selecionados')}</label>
                <button className="btn-secondary" onClick={openModal} style={{ padding: '6px 12px', fontSize: 12 }}>{t('admin_selecionar_media', 'Selecionar Média')}</button>
              </div>
              
              {settings['slider.manual_ids'] ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {settings['slider.manual_ids'].split(',').map(id => {
                    const item = mediaItems.find(m => m.id.toString() === id);
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-border)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                        {item ? item.name : t('admin_id_id', 'ID: ${id}')}
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', marginLeft: 6, cursor: 'pointer' }}
                          onClick={() => {
                            const newIds = settings['slider.manual_ids'].split(',').filter(i => i !== id).join(',');
                            handleChange('slider.manual_ids', newIds);
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('admin_nenhuma_item_selecionado', 'Nenhuma item selecionado.')}</p>
              )}
            </div>
          )}

          <div className="field-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_quantidade_de_itens', 'Quantidade de Itens')}</label>
            <input 
              type="number" 
              className="form-input"
              value={settings['slider.count']}
              onChange={e => handleChange('slider.count', e.target.value)}
              min="1" max="10"
            />
          </div>

          <div className="field-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_autoplay_transicao_automatica', 'Autoplay (Transição Automática)')}</label>
            <select 
              className="form-input"
              value={settings['slider.autoplay']}
              onChange={e => handleChange('slider.autoplay', e.target.value)}
            >
              <option value="1">{t('admin_ativado', 'Ativado')}</option>
              <option value="0">{t('admin_desativado', 'Desativado')}</option>
            </select>
          </div>

          {settings['slider.autoplay'] === '1' && (
            <div className="field-group" style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('admin_tempo_de_transicao_ms', 'Tempo de Transição (ms)')}</label>
              <input 
                type="number" 
                className="form-input"
                value={settings['slider.interval']}
                onChange={e => handleChange('slider.interval', e.target.value)}
                step="500" min="1000"
              />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{t('admin_tempo_em_milissegundos_ex_5000_5_segundo', 'Tempo em milissegundos (ex: 5000 = 5 segundos).')}</p>
            </div>
          )}

          <div style={{ marginTop: 30 }}>
            <button className="btn-primary" onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? t('admin_a_guardar', 'A guardar...') : t('admin_guardar_alteracoes', 'Guardar alterações')}
            </button>
          </div>
      </div>

      {showModal && (
        <div className="custom-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="custom-modal" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{t('admin_selecionar_media_para_o_slider', 'Selecionar Média para o Slider')}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {mediaItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20 }}>{t('admin_a_carregar', 'A carregar...')}</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  {mediaItems.map(item => {
                    const isSelected = settings['slider.manual_ids'] ? settings['slider.manual_ids'].split(',').includes(item.id.toString()) : false;
                    return (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: isSelected ? 'rgba(229, 9, 21, 0.1)' : 'var(--bg-secondary)', borderRadius: 6, cursor: 'pointer', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--glass-border)'}` }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            let ids = settings['slider.manual_ids'] ? settings['slider.manual_ids'].split(',') : [];
                            if (e.target.checked) {
                              ids.push(item.id.toString());
                            } else {
                              ids = ids.filter(id => id !== item.id.toString());
                            }
                            handleChange('slider.manual_ids', ids.join(','));
                          }}
                          style={{ marginRight: 12 }}
                        />
                        {item.poster ? (
                          <img src={item.poster} style={{ width: 30, height: 45, objectFit: 'cover', borderRadius: 4, marginRight: 12 }} />
                        ) : (
                          <div style={{ width: 30, height: 45, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginRight: 12 }}></div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.type === 'movie' ? 'Filme' : t('admin_serie', 'Série')}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ padding: '20px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowModal(false)} style={{ padding: '8px 24px', borderRadius: 30 }}>{t('admin_concluido', 'Concluído')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
