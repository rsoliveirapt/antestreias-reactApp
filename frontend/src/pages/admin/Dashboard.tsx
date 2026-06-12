import { useState, useEffect } from 'react';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';
import {
  LayoutDashboard, Users, Play, Gift,
  TrendingUp, Monitor, Globe, Share2, MousePointer2,
  Clock, Activity, Search, Download, ExternalLink,
  MapPin, Zap, RefreshCw
} from 'lucide-react';

interface Stats {
  totals: { users: number; plays: number; engagement: number; };
  countries: { name: string; value: number }[];
  sources: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  top_pages: { title: string; path: string; views: number }[];
  realtime_users: number;
  realtime_visitors: number;
  top_contests: { name: string; clicks: number }[];
  recent_activity: { item_type: string; action: string; created_at: string }[];
  visitor_history: { ip_address: string; last_activity: string; username?: string; avatar?: string; role?: string }[];
  error?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useTranslation();

  const tabs = [
    { id: 'overview', label: t('admin_tab_overview', 'Visão Geral'), icon: '📊' },
    { id: 'audience', label: t('admin_tab_audience', 'Público'), icon: '🌐' },
    { id: 'behavior', label: t('admin_tab_behavior', 'Comportamento'), icon: '🖱️' },
    { id: 'realtime', label: t('admin_tab_realtime', 'Tempo Real'), icon: '⚡' },
    { id: 'history', label: t('admin_tab_history', 'Histórico'), icon: '🕒' },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.metrics-tabs-mobile')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [dropdownOpen]);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_stats.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    } finally {
      if (isManual) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <RefreshCw size={40} className="spin-anim" style={{ marginBottom: 20, opacity: 0.5 }} />
        <p style={{ fontSize: 16, fontWeight: 500 }}>{t('admin_loading_metrics', 'A carregar métricas em tempo real...')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: isMobile ? '0 10px 40px' : '0 40px 60px' }}>
      {/* Premium Header Section */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: isMobile ? 16 : 0,
        marginBottom: 40,
        paddingTop: 20
      }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            {t('admin_dashboard_title', 'Métricas')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{t('admin_dashboard_subtitle', 'Monitorização inteligente em tempo real')}</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="realtime-indicator" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
            <span className="pulse-dot" style={{ background: '#10b981' }}></span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.realtime_users || 0}</span> {t('admin_dashboard_members', 'Membros')}
          </div>
          <div className="realtime-indicator" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
            <span className="pulse-dot" style={{ background: '#f59e0b' }}></span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats.realtime_visitors || 0}</span> {t('admin_dashboard_visitors', 'Visitantes')}
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="action-btn-circle"
            title={t('admin_dashboard_refresh', 'Atualizar dados')}
            style={{ width: 42, height: 42, background: 'var(--accent)', color: 'white' }}
          >
            <RefreshCw size={18} className={refreshing ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>
      {isMobile ? (
        /* Modern Custom Dropdown Selector (Mobile) */
        <div className="metrics-tabs-mobile" style={{ marginBottom: 32, position: 'relative', zIndex: 100 }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: '100%',
              padding: '14px 18px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '14px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'left'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{(tabs.find(t => t.id === activeTab) || tabs[0]).icon}</span>
              <span>{(tabs.find(t => t.id === activeTab) || tabs[0]).label}</span>
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: 'var(--text-secondary)'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="glass"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '14px',
                padding: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '12px 14px',
                    background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  className="dropdown-item-hover"
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Modern Horizontal Tabs (Desktop) */
        <div className="metrics-tabs-desktop" style={{
          display: 'flex',
          gap: 8,
          marginBottom: 32,
          padding: 6,
          background: 'var(--bg-secondary)',
          borderRadius: 14,
          border: '1px solid var(--glass-border)',
          width: 'fit-content'
        }}>
          <TabButton id="overview" label={t('admin_tab_overview', 'Visão Geral')} active={activeTab === 'overview'} onClick={setActiveTab} icon={<LayoutDashboard size={16} />} />
          <TabButton id="audience" label={t('admin_tab_audience', 'Público')} active={activeTab === 'audience'} onClick={setActiveTab} icon={<Globe size={16} />} />
          <TabButton id="behavior" label={t('admin_tab_behavior', 'Comportamento')} active={activeTab === 'behavior'} onClick={setActiveTab} icon={<MousePointer2 size={16} />} />
          <TabButton id="realtime" label={t('admin_tab_realtime', 'Tempo Real')} active={activeTab === 'realtime'} onClick={setActiveTab} icon={<Zap size={16} />} />
          <TabButton id="history" label={t('admin_tab_history', 'Histórico')} active={activeTab === 'history'} onClick={setActiveTab} icon={<Clock size={16} />} />
        </div>
      )}

      <div className="dashboard-content-fade">
        {activeTab === 'overview' && (
          <>
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
              <MetricCard title={t('admin_metric_users', 'Utilizadores')} value={stats.totals.users} icon={<Users size={22} />} trend="GA4 (30d)" />
              <MetricCard title={t('admin_metric_views', 'Visualizações')} value={stats.totals.plays} icon={<Play size={22} />} trend="GA4 (30d)" />
              <MetricCard title={t('admin_metric_engagement', 'Engajamento')} value={stats.totals.engagement} icon={<TrendingUp size={22} />} trend={t('admin_metric_sessions', 'Sessões')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20 }}>
              <div className="glass-panel" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Activity size={20} color="var(--accent)" /> {t('admin_recent_activity', 'Atividade Recente')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.recent_activity?.map((act, i) => (
                    <div key={i} className="activity-row" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderRadius: 12
                    }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)'
                        }}>
                          {act.item_type === 'contest' ? <Gift size={18} /> : <Play size={18} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{act.action} em <span style={{ color: 'var(--accent)' }}>{act.item_type}</span></div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{new Date(act.created_at).toLocaleString('pt-PT')}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 20, fontWeight: 800, letterSpacing: 0.5 }}>LIVE</div>
                    </div>
                  ))}
                  {(!stats.recent_activity || stats.recent_activity.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <Activity size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <p>{t('admin_loading_activity', 'A aguardar atividade...')}</p>
                    </div>
                  )}
                </div>
              </div>
              <DataCard title={t('admin_top_countries', 'Top Países')} items={stats.countries} icon={<MapPin size={20} />} type="list" />
            </div>
          </>
        )}

        {activeTab === 'audience' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
            <DataCard title={t('admin_traffic_source', 'Origem do Tráfego')} items={stats.sources} icon={<Share2 size={20} />} type="progress" />
            <DataCard title={t('admin_browsers', 'Navegadores')} items={stats.browsers} icon={<Monitor size={20} />} type="progress" />
            <DataCard title={t('admin_geolocation', 'Geolocalização')} items={stats.countries} icon={<Globe size={20} />} type="progress" />
            <div className="glass-panel" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ width: 64, height: 64, background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Users size={32} color="var(--accent)" style={{ opacity: 0.5 }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('admin_demographics', 'Dados Demográficos')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
                  {t('admin_demographics_hint', 'Ativa os "Google Signals" no teu painel GA4 para ver idade e género aqui.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <MousePointer2 size={20} color="var(--accent)" /> {t('admin_top_pages', 'Páginas Mais Visitadas')}
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '0 12px 16px', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('admin_page_col', 'Página')}</th>
                      <th style={{ padding: '0 12px 16px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 }}>{t('admin_views_col', 'Visualizações')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_pages?.map((page, i) => (
                      <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{page.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>{page.path}</div>
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{page.views.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <DataCard title={t('menu_contests', 'Passatempos')} items={stats.top_contests.map(c => ({ name: c.name, value: c.clicks }))} icon={<Gift size={20} />} type="list" />
              <div className="glass-panel" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{t('admin_extra_interactions', 'Interações Adicionais')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ActionItem icon={<Search size={16} />} label={t('admin_internal_searches', 'Buscas Internas')} value={t('admin_ativo', 'Ativo')} />
                  <ActionItem icon={<Download size={16} />} label={t('admin_downloads', 'Downloads')} value={t('admin_auto', 'Auto')} />
                  <ActionItem icon={<ExternalLink size={16} />} label={t('admin_external_links', 'Links Externos')} value={t('admin_status_on', 'ON')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'realtime' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div className="big-pulse" style={{ width: 180, height: 180 }}>
                <div className="pulse-inner" style={{ width: 100, height: 100 }}></div>
                <div className="pulse-outer"></div>
                <div className="pulse-text" style={{ fontSize: 42 }}>{(stats.realtime_users || 0) + (stats.realtime_visitors || 0)}</div>
              </div>
              <h3 style={{ marginTop: 32, fontSize: 20, fontWeight: 800 }}>{t('admin_active_members', 'Membros Ativos')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>{t('admin_online_now', 'Utilizadores ligados neste preciso momento.')}</p>

              <div style={{ display: 'flex', gap: 24, padding: '20px 32px', background: 'var(--bg-secondary)', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>{stats.realtime_users}</div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: 0.5 }}>{t('admin_registered', 'Registados')}</div>
                </div>
                <div style={{ width: 1, background: 'var(--glass-border)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>{stats.realtime_visitors}</div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: 0.5 }}>{t('admin_anonymous', 'Anónimos')}</div>
                </div>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Zap size={20} color="#10b981" /> {t('admin_events_detected', 'Eventos Detetados')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.recent_activity?.map((act, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px',
                    borderLeft: '4px solid #10b981',
                    background: 'rgba(16, 185, 129, 0.03)',
                    borderRadius: '0 12px 12px 0'
                  }}>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                      {t('admin_event_registered', 'Foi registado um evento de')} <strong>{act.action}</strong> {t('admin_event_in', 'em')} <strong>{act.item_type}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {t('admin_event_just_now', 'Agora mesmo')}
                      </div>
                    </div>
                  </div>
                ))}
                {(!stats.recent_activity || stats.recent_activity.length === 0) && (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                    <RefreshCw size={24} className="spin-anim" style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>{t('admin_listening_events', 'À escuta de novos eventos...')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={20} color="var(--accent)" /> {t('admin_session_history', 'Histórico de Sessões')}
            </h3>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {stats.visitor_history?.map((entry, i) => (
                  <div key={i} style={{
                    padding: 16,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    {/* Linha Superior: Perfil + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: entry.username ? 'var(--accent)' : 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          fontWeight: 800,
                          color: entry.username ? 'white' : 'var(--text-primary)',
                          overflow: 'hidden',
                          border: '1px solid var(--glass-border)',
                          flexShrink: 0
                        }}>
                          {entry.avatar ? <img src={entry.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (entry.username ? entry.username[0].toUpperCase() : <Users size={18} />)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'break-word' }}>{entry.username || t('admin_visitor_label', 'Visitante')}</div>
                          <div style={{ fontSize: 10, color: entry.role ? 'var(--accent)' : 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, overflowWrap: 'break-word' }}>
                            {entry.role ? entry.role.split(',').join(', ') : t('admin_guest_label', 'Convidado')}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, padding: '4px 8px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>ONLINE</span>
                    </div>

                    {/* Detalhes (IP e Atividade) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--glass-border)'
                    }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 }}>IP</div>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{entry.ip_address}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 }}>{t('admin_activity_col', 'Atividade')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>{new Date(entry.last_activity).toLocaleString('pt-PT')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '0 15px 16px', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, minWidth: 180 }}>{t('admin_user_col', 'Utilizador')}</th>
                      <th style={{ padding: '0 15px 16px', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, minWidth: 110 }}>IP</th>
                      <th style={{ padding: '0 15px 16px', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, minWidth: 160 }}>{t('admin_activity_col', 'Atividade')}</th>
                      <th style={{ padding: '0 15px 16px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1, minWidth: 90 }}>{t('admin_status_col', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.visitor_history?.map((entry, i) => (
                      <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              background: entry.username ? 'var(--accent)' : 'var(--bg-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              fontWeight: 800,
                              color: entry.username ? 'white' : 'var(--text-primary)',
                              overflow: 'hidden',
                              border: '1px solid var(--glass-border)'
                            }}>
                              {entry.avatar ? <img src={entry.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (entry.username ? entry.username[0].toUpperCase() : <Users size={18} />)}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'break-word' }}>{entry.username || t('admin_visitor_label', 'Visitante')}</div>
                              <div style={{ fontSize: 10, color: entry.role ? 'var(--accent)' : 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, overflowWrap: 'break-word' }}>
                                {entry.role ? entry.role.split(',').join(', ') : t('admin_guest_label', 'Convidado')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 15px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{entry.ip_address}</td>
                        <td style={{ padding: '16px 15px', fontSize: 13, color: 'var(--text-primary)' }}>{new Date(entry.last_activity).toLocaleString('pt-PT')}</td>
                        <td style={{ padding: '16px 15px', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800 }}>ONLINE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-content-fade {
          animation: dashboardFadeIn 0.4s ease-out;
        }
        @keyframes dashboardFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .table-row-hover:hover {
          background: rgba(255,255,255,0.015);
        }
        .dropdown-item-hover:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: var(--accent) !important;
        }
      `}</style>
    </div>
  );
}

function TabButton({ id, label, active, onClick, icon }: { id: string, label: string, active: boolean, onClick: (id: string) => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        background: active ? 'var(--text-primary)' : 'transparent',
        border: 'none',
        padding: '10px 20px',
        color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
        fontSize: 13,
        fontWeight: 700,
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
        transform: active ? 'scale(1.05)' : 'scale(1)',
        flexShrink: 0,
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
      {label}
    </button>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="glass-panel" style={{ padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: -10,
        right: -10,
        width: 80,
        height: 80,
        background: 'var(--accent)',
        opacity: 0.02,
        borderRadius: '50%',
        filter: 'blur(30px)'
      }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 6 }}>
          {trend}
        </div>
      </div>
      <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 6px 0' }}>{title}</h3>
      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{value.toLocaleString()}</div>
    </div>
  );
}

function DataCard({ title, items, icon, type }: { title: string, items: any[], icon: React.ReactNode, type: 'list' | 'progress' }) {
  const max = Math.max(...items.map(i => i.value || 0), 1);
  return (
    <div className="glass-panel" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ color: 'var(--accent)' }}>{icon}</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {items.map((item, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{item.value ? item.value.toLocaleString() : '0'}</span>
            </div>
            {type === 'progress' && (
              <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((item.value || 0) / max) * 100}%`,
                  background: 'linear-gradient(90deg, var(--accent), #ff4d4d)',
                  borderRadius: 10,
                  boxShadow: '0 0 10px rgba(229, 9, 21, 0.3)'
                }} />
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>A aguardar dados...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      fontSize: 13,
      borderBottom: '1px solid var(--glass-border)',
      transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span> {label}
      </div>
      <span style={{
        color: '#10b981',
        fontWeight: 800,
        fontSize: 11,
        textTransform: 'uppercase'
      }}>{value}</span>
    </div>
  );
}
