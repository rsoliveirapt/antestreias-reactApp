import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { Zap, Info, Loader2 } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsCache() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [cacheMethod, setCacheMethod] = useState('file');

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['cache.handler']) setCacheMethod(data['cache.handler']);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'cache.handler': cacheMethod,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_cache_guardadas_com_sucess', 'Definições de cache guardadas com sucesso!'));
      }
    } catch (err) {
      showToast('Erro ao guardar definições.', 'error');
    }
  };

  const handleClearCache = async () => {
    if (isClearing) return;
    setIsClearing(true);
    showToast(t('admin_a_limpar_cache', 'A limpar cache...'));
    try {
      const res = await apiFetch(`${API_BASE}/clear_cache.php`);
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_cache_limpa_com_sucesso', 'Cache limpa com sucesso!'));
      } else {
        showToast('Erro ao limpar cache.', 'error');
      }
    } catch (err) {
      showToast('Erro ao conectar ao servidor.', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'white' }}>{t('admin_a_carregar_definicoes', 'A carregar definições...')}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={28} color="var(--accent)" /> {t('admin_definicoes_de_cache', 'Definições de cache')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_seleciona_o_fornecedor_de_cache_e_limpa_a_cache_ma', 'Seleciona o fornecedor de cache e limpa a cache manualmente.')}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_metodo_de_cache', 'Método de cache')}</label>
          <select value={cacheMethod} onChange={e => setCacheMethod(e.target.value)} className="form-input">
            <option value="file">{t('admin_ficheiro_padrao', 'Ficheiro (Padrão)')}</option>
            <option value="none">{t('admin_nenhum', 'Nenhum')}</option>
            <option value="apc">{t('admin_apc', 'APC')}</option>
            <option value="memcached">"Memcached"</option>
            <option value="redis">{t('admin_redis', 'Redis')}</option>
          </select>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('admin_qual_o_metodo_que_deve_ser_utilizado_para_armazena', 'Qual o método que deve ser utilizado para armazenar e recuperar itens em cache.')}
          </p>
        </div>

        <div style={{ marginBottom: 30, borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
           <button 
             className="btn-clear-cache" 
             onClick={handleClearCache}
             disabled={isClearing}
           >
             {isClearing ? <Loader2 size={16} className="spinner" /> : null}
             {t('admin_limpar_cache', 'Limpar cache')}
           </button>
        </div>

        <div className="glass" style={{ marginBottom: 40, padding: 20, background: 'rgba(184, 134, 11, 0.05)', border: '1px solid rgba(184, 134, 11, 0.1)', borderRadius: 8, display: 'flex', gap: 16 }}>
            <Info size={20} color="#B8860B" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: '#B8860B', lineHeight: '1.5' }}>
              {t('admin_ficheiro_e_a_melhor_opcao_para_a_maioria_dos_casos', '"Ficheiro" é a melhor opção para a maioria dos casos e não deve ser alterada, a menos que estejas familiarizado com outro método de cache e já o tenhas configurado no servidor.')}
            </p>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
