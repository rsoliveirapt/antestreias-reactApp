import { useState, useEffect } from 'react';
import { X, PlayCircle } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsVideos() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  
  const [videoPanelContent, setVideoPanelContent] = useState('all');
  const [videoOrder, setVideoOrder] = useState('order:asc');
  const [preferFullVideos, setPreferFullVideos] = useState(false);
  const [showAlternativeVideos, setShowAlternativeVideos] = useState(false);
  const [showHeaderPlayButton, setShowHeaderPlayButton] = useState(false);
  const [qualities, setQualities] = useState<string[]>(['regular', 'SD', 'HD', '720p', '1080p', '4k']);
  const [newQuality, setNewQuality] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['streaming.video_panel_content']) setVideoPanelContent(data['streaming.video_panel_content']);
        if (data['streaming.default_sort']) setVideoOrder(data['streaming.default_sort']);
        if (data['streaming.prefer_full_videos']) setPreferFullVideos(data['streaming.prefer_full_videos'] === 'true');
        if (data['streaming.show_alternative_videos']) setShowAlternativeVideos(data['streaming.show_alternative_videos'] === 'true');
        if (data['streaming.show_header_play']) setShowHeaderPlayButton(data['streaming.show_header_play'] === 'true');
        if (data['streaming.qualities']) {
          try {
            setQualities(JSON.parse(data['streaming.qualities']));
          } catch (e) {
            console.error(t('admin_error_parsing_qualities', 'Error parsing qualities'), e);
          }
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'streaming.video_panel_content': videoPanelContent,
      'streaming.default_sort': videoOrder,
      'streaming.prefer_full_videos': preferFullVideos,
      'streaming.show_alternative_videos': showAlternativeVideos,
      'streaming.show_header_play': showHeaderPlayButton,
      'streaming.qualities': JSON.stringify(qualities),
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_video_guardadas_com_sucess', 'Definições de vídeo guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'));
    }
  };

  const removeQuality = (q: string) => {
    setQualities(qualities.filter(item => item !== q));
  };

  const addQuality = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newQuality) {
      if (!qualities.includes(newQuality)) {
        setQualities([...qualities, newQuality]);
      }
      setNewQuality('');
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <PlayCircle size={28} color="var(--accent)" /> {t('admin_videos', 'Vídeos')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_controla_como_os_videos_sao_reproduzidos_e_exibido', 'Controla como os vídeos são reproduzidos e exibidos no site.')}
        </p>
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_videos_exibidos', 'Vídeos exibidos')}</label>
        <select value={videoPanelContent} onChange={e => setVideoPanelContent(e.target.value)} className="form-input">
          <option value="all">{t('admin_todos_os_videos', 'Todos os vídeos')}</option>
          <option value="full">{t('admin_filmes_e_episodios_completos', 'Filmes e episódios completos')}</option>
          <option value="short">{t('admin_videos_curtos_tudo_exceto_filmes_e_episo', 'Vídeos curtos (tudo exceto filmes e episódios completos)')}</option>
          <option value="trailer">{t('admin_trailers', 'Trailers')}</option>
          <option value="clip">{t('admin_clipes', 'Clipes')}</option>
        </select>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('admin_que_tipo_de_videos_devem_ser_mostrados_nas_paginas', 'Que tipo de vídeos devem ser mostrados nas páginas de títulos e episódios (se houver mais de um vídeo anexado).')}
        </p>
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_ordenacao_de_videos', 'Ordenação de vídeos')}</label>
        <select value={videoOrder} onChange={e => setVideoOrder(e.target.value)} className="form-input">
          <option value="order:asc">{t('admin_manual_ordem_atribuida_manualmente_na_ar', 'Manual (ordem atribuída manualmente na área de administração)')}</option>
          <option value="created_at:desc">{t('admin_data_de_adicao', 'Data de adição')}</option>
          <option value="name:asc">{t('admin_nome_a_z', 'Nome (a-z)')}</option>
          <option value="language:asc">{t('admin_idioma_a_z', 'Idioma (a-z)')}</option>
          <option value="reports:asc">{t('admin_denuncias_videos_com_menos_denuncias_pri', 'Denúncias (vídeos com menos denúncias primeiro)')}</option>
          <option value="score:desc">{t('admin_pontuacao_videos_com_mais_gostos_primeir', 'Pontuação (vídeos com mais gostos primeiro)')}</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
        <label className="toggle-switch">
          <input type="checkbox" checked={preferFullVideos} onChange={e => setPreferFullVideos(e.target.checked)} />
          <span className="toggle-slider"></span>
        </label>
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_preferir_videos_completos', 'Preferir vídeos completos')}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_quando_o_utilizador_clica_nos_botoes_rep', 'Quando o utilizador clica nos botões "reproduzir" em todo o site, reproduzir o filme ou episódio completo em vez de trailers e clipes.')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
        <label className="toggle-switch">
          <input type="checkbox" checked={showAlternativeVideos} onChange={e => setShowAlternativeVideos(e.target.checked)} />
          <span className="toggle-slider"></span>
        </label>
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_videos_alternativos', 'Vídeos alternativos')}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_mostrar_videos_alternativos_na_pagina_de', 'Mostrar vídeos alternativos na página de visualização.')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
        <label className="toggle-switch">
          <input type="checkbox" checked={showHeaderPlayButton} onChange={e => setShowHeaderPlayButton(e.target.checked)} />
          <span className="toggle-slider"></span>
        </label>
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>{t('admin_botao_de_reproducao_no_cabecalho', 'Botão de reprodução no cabeçalho')}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_se_o_botao_de_reproducao_deve_ser_mostra', 'Se o botão de reprodução deve ser mostrado no cabeçalho principal do título.')}</span>
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_qualidades_de_video_possiveis', 'Qualidades de vídeo possíveis')}</label>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {qualities.map(q => (
              <span key={q} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                {q}
                <X size={14} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => removeQuality(q)} />
              </span>
            ))}
          </div>
          <input 
            type="text" 
            placeholder={t('admin_adicionar_outro', 'Adicionar outro...')} 
            value={newQuality} 
            onChange={e => setNewQuality(e.target.value)}
            onKeyDown={addQuality}
            className="form-input" 
            style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '14px' }} 
          />
        </div>
      </div>

      <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSave}>
        {t('admin_save_changes', 'Save changes')}
      </button>
    </div>
  );
}
