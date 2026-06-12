import { useState, useEffect } from 'react';
import { showToast } from '../../../components/Toast';
import { ListTodo, Link as LinkIcon } from 'lucide-react';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

export default function SettingsQueue() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [queueMethod, setQueueMethod] = useState('sync');

  useEffect(() => {
    apiFetch(`${API_BASE}/admin_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data['queue.handler']) setQueueMethod(data['queue.handler']);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const settings = {
      'queue.handler': queueMethod,
    };

    try {
      const res = await apiFetch(`${API_BASE}/admin_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await res.json();
      if (result.success) {
        showToast(t('admin_definicoes_de_fila_guardadas_com_sucesso', 'Definições de fila guardadas com sucesso!'));
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
          <ListTodo size={28} color="var(--accent)" /> {t('admin_fila_queue', 'Fila (Queue)')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_as_filas_queues_permitem_adiar_tarefas_demoradas_c', 'As filas (queues) permitem adiar tarefas demoradas, como o envio de um e-mail, para um momento posterior. São totalmente opcionais e não fornecem funcionalidades adicionais.')}
        </p>
        <a href="https://laravel.com/docs/queues" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
          <LinkIcon size={14} /> {t('admin_saber_mais', 'Saber mais')}
        </a>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 30 }}>
        
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>{t('admin_metodo_de_fila', 'Método de fila')}</label>
          <select value={queueMethod} onChange={e => setQueueMethod(e.target.value)} className="form-input">
            <option value="sync">{t('admin_nenhum_padrao', 'Nenhum (Padrão)')}</option>
            <option value="beanstalkd">{t('admin_beanstalkd', 'Beanstalkd')}</option>
            <option value="database">{t('admin_base_de_dados', 'Base de dados')}</option>
            <option value="sqs">{t('admin_sqs_amazon_simple_queue_service', 'SQS (Amazon Simple Queue Service)')}</option>
            <option value="redis">{t('admin_redis', 'Redis')}</option>
          </select>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t('admin_save_changes', 'Save changes')}
        </button>
      </div>
    </div>
  );
}
