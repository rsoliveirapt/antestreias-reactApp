import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { HardDrive, Zap, Maximize, FileType, X } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsUploads() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [serverMaxUpload, setServerMaxUpload] = useState('0M');

  // Settings State
  const [userStorage, setUserStorage] = useState('local');
  const [publicStorage, setPublicStorage] = useState('local');
  const [optimization, setOptimization] = useState('none');
  const [chunkSize, setChunkSize] = useState(5);
  const [maxFileSize, setMaxFileSize] = useState(50);
  const [maxUserSpace, setMaxUserSpace] = useState(100);
  const [allowedExtensions, setAllowedExtensions] = useState<string[]>([]);
  const [blockedExtensions, setBlockedExtensions] = useState<string[]>(['exe', 'application/x-msdownload', 'x-dosexec']);
  
  const [newAllowed, setNewAllowed] = useState('');
  const [newBlocked, setNewBlocked] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/check_upload_settings.php`)
      .then(res => res.json())
      .then(data => {
        setServerMaxUpload(data.max_upload);
        
        const settings = data.settings.reduce((acc: any, curr: any) => {
          acc[curr.name] = curr.value;
          return acc;
        }, {});

        if (settings['storage.user_uploads']) setUserStorage(settings['storage.user_uploads']);
        if (settings['storage.public_uploads']) setPublicStorage(settings['storage.public_uploads']);
        if (settings['storage.delivery_optimization']) setOptimization(settings['storage.delivery_optimization']);
        if (settings['storage.chunk_size']) setChunkSize(parseInt(settings['storage.chunk_size']));
        if (settings['storage.max_file_size']) setMaxFileSize(parseInt(settings['storage.max_file_size']));
        if (settings['storage.max_user_space']) setMaxUserSpace(parseInt(settings['storage.max_user_space']));
        if (settings['storage.allowed_extensions']) setAllowedExtensions(settings['storage.allowed_extensions'].split(',').filter(Boolean));
        if (settings['storage.blocked_extensions']) setBlockedExtensions(settings['storage.blocked_extensions'].split(',').filter(Boolean));
        
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'storage.user_uploads': userStorage,
      'storage.public_uploads': publicStorage,
      'storage.delivery_optimization': optimization,
      'storage.chunk_size': chunkSize,
      'storage.max_file_size': maxFileSize,
      'storage.max_user_space': maxUserSpace,
      'storage.allowed_extensions': allowedExtensions.join(','),
      'storage.blocked_extensions': blockedExtensions.join(','),
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_carregamento_guardadas_com', 'Definições de carregamento guardadas com sucesso!'));
      }
    } catch (err) {
      showToast(t('admin_erro_ao_guardar_definicoes', 'Erro ao guardar definições.'));
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div className="settings-uploads-container" style={{ maxWidth: 800 }}>
      <style>{`
        @media (max-width: 768px) {
          .settings-uploads-container h1 {
            font-size: 22px !important;
          }
          .settings-uploads-container .flex-row-mobile {
            flex-direction: column !important;
            gap: 15px !important;
          }
          .settings-uploads-container .btn-primary {
            width: 100% !important;
          }
        }
      `}</style>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <HardDrive size={28} color="var(--accent)" /> {t('admin_carregamentos', 'Carregamentos')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_configura_o_tamanho_e_o_tipo_de_ficheiros_que_os_u', 'Configura o tamanho e o tipo de ficheiros que os utilizadores podem carregar. Isto afetará todos os carregamentos no site.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_metodo_de_armazenamento_de_carregamentos', 'Método de armazenamento de carregamentos de utilizadores')}</label>
          <select value={userStorage} onChange={e => setUserStorage(e.target.value)} className="form-input">
            <option value="local">{t('admin_disco_local_padrao', 'Disco Local (Padrão)')}</option>
            <option value="s3">{t('admin_amazon_s3', 'Amazon S3')}</option>
            <option value="ftp">{t('admin_ftp', 'FTP')}</option>
            <option value="digitalocean">{t('admin_digitalocean_spaces', 'DigitalOcean Spaces')}</option>
            <option value="backblaze">{t('admin_backblaze', 'Backblaze')}</option>
          </select>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_onde_devem_ser_armazenados_os_carregamentos_de_fic', 'Onde devem ser armazenados os carregamentos de ficheiros privados dos utilizadores.')}
          </p>
        </div>

        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_metodo_de_armazenamento_de_carregamentos_publicos', 'Método de armazenamento de carregamentos públicos')}</label>
          <select value={publicStorage} onChange={e => setPublicStorage(e.target.value)} className="form-input">
            <option value="local">{t('admin_disco_local_padrao', 'Disco Local (Padrão)')}</option>
            <option value="s3">{t('admin_amazon_s3_ou_compativel', 'Amazon S3 (ou compatível)')}</option>
            <option value="dropbox">{t('admin_dropbox', 'Dropbox')}</option>
            <option value="rackspace">{t('admin_rackspace', 'Rackspace')}</option>
          </select>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_onde_devem_ser_armazenados_os_carregamentos_public', 'Onde devem ser armazenados os carregamentos públicos dos utilizadores (como avatares).')}
          </p>
        </div>

        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_otimizacao_da_entrega_de_ficheiros', 'Otimização da entrega de ficheiros')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input type="radio" checked={optimization === 'none'} onChange={() => setOptimization('none')} style={{ accentColor: 'var(--accent)' }} />
              <span>{t('admin_nenhum', 'Nenhum')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input type="radio" checked={optimization === 'x-sendfile'} onChange={() => setOptimization('x-sendfile')} style={{ accentColor: 'var(--accent)' }} />
              <span>{t('admin_x_sendfile_apache', 'X-Sendfile (Apache)')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input type="radio" checked={optimization === 'x-accel'} onChange={() => setOptimization('x-accel')} style={{ accentColor: 'var(--accent)' }} />
              <span>{t('admin_x_accel_nginx', 'X-Accel (Nginx)')}</span>
            </label>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
            {t('admin_tanto_o_x_sendfile_como_o_x_accel_precisam_de_esta', 'Tanto o X-Sendfile como o X-Accel precisam de estar ativados no servidor primeiro. Quando ativados, reduzirão o uso de memória e CPU do servidor ao pré-visualizar ou descarregar ficheiros, especialmente ficheiros grandes.')}
          </p>
        </div>

        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <div className="flex-row-mobile" style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_tamanho_do_pedaco_chunk_size', 'Tamanho do pedaço (Chunk size)')}</label>
              <div style={{ display: 'flex' }}>
                <input type="number" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="form-input" style={{ borderRight: 'none', borderRadius: '8px 0 0 8px' }} />
                <span className="form-input" style={{ width: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'center', borderLeft: 'none' }}>{t('admin_mb', 'MB')}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_tamanho_maximo_do_ficheiro', 'Tamanho máximo do ficheiro')}</label>
              <div style={{ display: 'flex' }}>
                <input type="number" value={maxFileSize} onChange={e => setMaxFileSize(parseInt(e.target.value))} className="form-input" style={{ borderRight: 'none', borderRadius: '8px 0 0 8px' }} />
                <span className="form-input" style={{ width: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'center', borderLeft: 'none' }}>{t('admin_mb', 'MB')}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
            {t('admin_tamanho_em_bytes_para_cada_pedaco_de_ficheiro_so_d', 'Tamanho (em bytes) para cada pedaço de ficheiro. Só deve ser alterado se houver um tamanho máximo de carregamento no teu servidor ou proxy (por exemplo, Cloudflare).')}
          </p>
          <div className="glass" style={{ marginTop: 20, padding: 16, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: 14 }}>{t('admin_o_tamanho_maximo_de_carregamento_no_teu_', 'O tamanho máximo de carregamento no teu servidor está atualmente definido para')} <strong>{serverMaxUpload}</strong></p>
          </div>
        </div>

        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_extensoes_permitidas', 'Extensões permitidas')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {allowedExtensions.map(ext => (
              <span key={ext} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                {ext} <X size={14} onClick={() => setAllowedExtensions(allowedExtensions.filter(e => e !== ext))} style={{ cursor: 'pointer' }} />
              </span>
            ))}
          </div>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('admin_adicionar_extensao_ex_jpg_mp4', 'Adicionar extensão... (ex: jpg, mp4)')} 
            value={newAllowed}
            onChange={e => setNewAllowed(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newAllowed) {
                setAllowedExtensions([...allowedExtensions, newAllowed.replace('.', '')]);
                setNewAllowed('');
              }
            }}
          />
        </div>

        <div style={{ marginBottom: 40, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_extensoes_bloqueadas', 'Extensões bloqueadas')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {blockedExtensions.map(ext => (
              <span key={ext} style={{ background: 'rgba(229, 9, 21, 0.1)', color: '#ff4d4d', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, border: '1px solid rgba(229, 9, 21, 0.2)' }}>
                {ext} <X size={14} onClick={() => setBlockedExtensions(blockedExtensions.filter(e => e !== ext))} style={{ cursor: 'pointer' }} />
              </span>
            ))}
          </div>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('admin_adicionar_extensao_para_bloquear', 'Adicionar extensão para bloquear...')} 
            value={newBlocked}
            onChange={e => setNewBlocked(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newBlocked) {
                setBlockedExtensions([...blockedExtensions, newBlocked.replace('.', '')]);
                setNewBlocked('');
              }
            }}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_impede_o_carregamento_destes_tipos_de_ficheiros_me', 'Impede o carregamento destes tipos de ficheiros, mesmo que sejam permitidos acima.')}
          </p>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
