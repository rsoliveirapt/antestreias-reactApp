import { useState, useEffect } from 'react';
import { Send, Bell, Users, Info, Loader2 } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { API_BASE, apiFetch } from '../../config';
import { showToast } from '../../components/Toast';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminPushNotifications() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('Antestreias');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ total_subscribers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_send_push.php`);
      const data = await res.json();
      if (!data.error) {
        setStats(data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      showToast(t('admin_push_empty_body', 'Por favor, escreva uma mensagem.'), 'error');
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_send_push.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          t('admin_push_send_success', `Notificação enviada com sucesso! Enviada: ${data.sent}, Falhas/Limpos: ${data.failed + data.cleaned}`),
          'success'
        );
        setBody('');
        setUrl('/');
        fetchStats(); // Update stats if any expired subscriptions were cleaned
      } else {
        showToast(data.error || t('admin_push_send_error', 'Erro ao enviar notificações.'), 'error');
      }
    } catch (err) {
      showToast(t('admin_push_send_error', 'Erro de rede ao enviar notificações.'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-page admin-push-notifications" style={{ padding: '0 40px 60px' }}>
      <AdminPageHeader 
        title={t('admin_push_title', 'Notificações Push')}
        subtitle={t('admin_push_subtitle', 'Cria e envia mensagens push personalizadas para todos os utilizadores subscritos.')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 30, marginTop: 30 }}>
        {/* Send Notification Form */}
        <div className="metric-card" style={{ padding: 30, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 25, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={20} color="var(--accent)" />
            {t('admin_push_compose', 'Nova Notificação')}
          </h3>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="field-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', display: 'block' }}>
                {t('admin_push_input_title', 'Título')}
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="glass-input" 
                placeholder="Ex: Antestreias"
                style={{ width: '100%', padding: '12px 15px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div className="field-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', display: 'block' }}>
                {t('admin_push_input_body', 'Mensagem')} <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <textarea 
                value={body} 
                onChange={e => setBody(e.target.value)}
                className="glass-input" 
                placeholder="Ex: Novo passatempo disponível para o filme Dune: Parte Dois! Participa já."
                rows={4}
                style={{ width: '100%', padding: '12px 15px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                required
              />
            </div>

            <div className="field-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', display: 'block' }}>
                {t('admin_push_input_url', 'URL de Destino')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: 14 }}>
                  /
                </span>
                <input 
                  type="text" 
                  value={url.startsWith('/') ? url.substring(1) : url} 
                  onChange={e => {
                    const val = e.target.value;
                    setUrl(val.startsWith('/') ? val : '/' + val);
                  }}
                  className="glass-input" 
                  placeholder="passatempos/dune-parte-dois"
                  style={{ width: '100%', padding: '12px 15px 12px 28px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, display: 'block' }}>
                {t('admin_push_url_help', 'O endereço da página que o utilizador irá abrir ao clicar na notificação.')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button 
                type="submit"
                disabled={sending}
                style={{ 
                  padding: '12px 30px', borderRadius: 8, border: 'none', 
                  background: 'var(--accent)', color: 'white', fontWeight: 700, 
                  cursor: 'pointer', opacity: sending ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 4px 12px rgba(229, 9, 21, 0.2)',
                  transition: 'all 0.2s'
                }}
                className="btn-primary"
              >
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {sending ? t('admin_push_sending', 'A Enviar...') : t('admin_push_send_btn', 'Enviar Broadcast')}
              </button>
            </div>
          </form>
        </div>

        {/* Info & Stats Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats Card */}
          <div className="metric-card" style={{ padding: 25, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} />
              {t('admin_push_stats', 'Subscritores')}
            </h4>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 5 }}>
              {loadingStats ? <Loader2 className="animate-spin" size={24} /> : stats.total_subscribers}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {t('admin_push_active_devices', 'Dispositivos ativos registados que irão receber as tuas notificações instantâneas.')}
            </p>
          </div>

          {/* Guidelines / Help Card */}
          <div className="metric-card" style={{ padding: 25, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.03, color: 'white' }}>
              <Info size={120} />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={16} />
              {t('admin_push_tips', 'Dicas de Envio')}
            </h4>
            <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.5 }}>
              <li>
                <strong>{t('admin_push_tip1_title', 'Sê Breve:')}</strong> {t('admin_push_tip1_desc', 'As mensagens mais curtas são mais fáceis de ler e têm maior taxa de clique.')}
              </li>
              <li>
                <strong>{t('admin_push_tip2_title', 'Evita Spam:')}</strong> {t('admin_push_tip2_desc', 'Não envies demasiadas notificações no mesmo dia para evitar que os utilizadores as desativem.')}
              </li>
              <li>
                <strong>{t('admin_push_tip3_title', 'Links Relevantes:')}</strong> {t('admin_push_tip3_desc', 'Aponta sempre o URL de destino diretamente para o conteúdo novo (ex: passatempo ou crítica).')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
